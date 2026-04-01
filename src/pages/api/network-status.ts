/**
 * GET /api/network-status
 *
 * Served directly by Next.js/Vercel (takes precedence over the /api/* → Worker rewrite).
 * Checks Alephium public node + explorer health, hashrate trend, per-chain block times,
 * and optionally sends Slack alerts via network_status_alert env var.
 *
 * Alert logic: fires when ≥3 of last 5 checks fail (60% failure rate).
 * Recovery alert: fires when failure rate drops back below threshold.
 * Debounce and state stored in Upstash KV (persistent across serverless cold starts).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const ALPH_NODE = "https://node.mainnet.alephium.org";
const ALPH_EXPLORER = "https://backend.mainnet.alephium.org";
const ALPH_TESTNET_NODE = "https://node.testnet.alephium.org";
const ALPH_TESTNET_EXPLORER = "https://backend.testnet.alephium.org";
const BLOCK_DELAY_THRESHOLD_S = 180;
const HASHRATE_1H_THRESHOLD_PCT = 20;
const HASHRATE_24H_THRESHOLD_PCT = 30;
const FAILURE_WINDOW = 5; // track last 5 checks per service
const FAILURE_RATE_THRESHOLD = 0.6; // alert if ≥60% of checks failed
const DEBOUNCE_TTL_S = 10 * 60; // 10 min debounce via KV TTL

// ── KV client ────────────────────────────────────────────────────────────────
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.STATUS_STORAGE_KV_REST_API_URL;
  const token = process.env.STATUS_STORAGE_KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// ── KV: record check result and detect state transitions ─────────────────────
async function updateServiceState(
  serviceKey: string,
  isOk: boolean,
): Promise<{ alertDown: boolean; alertRecovery: boolean }> {
  const kv = getRedis();
  if (!kv) return { alertDown: false, alertRecovery: false };
  try {
    const checksKey = `checks:${serviceKey}`;
    const stateKey = `state:${serviceKey}`;
    const consecOkKey = `consec_ok:${serviceKey}`;

    await kv.lpush(checksKey, isOk ? 1 : 0);
    await kv.ltrim(checksKey, 0, FAILURE_WINDOW - 1);
    await kv.expire(checksKey, 3600);

    const checks = await kv.lrange<number>(checksKey, 0, FAILURE_WINDOW - 1);
    if (checks.length < 3) return { alertDown: false, alertRecovery: false };

    const failCount = checks.filter((v) => v === 0).length;
    const isHighFailRate = failCount / checks.length >= FAILURE_RATE_THRESHOLD;
    const storedState = await kv.get<string>(stateKey);

    if (isHighFailRate && storedState !== "down") {
      await kv.set(stateKey, "down");
      await kv.del(consecOkKey); // reset consecutive ok counter
      return { alertDown: true, alertRecovery: false };
    }

    if (storedState === "down") {
      if (isOk) {
        const consecOk = await kv.incr(consecOkKey);
        await kv.expire(consecOkKey, 3600);
        if (consecOk >= 3) {
          await kv.set(stateKey, "up");
          await kv.del(consecOkKey);
          return { alertDown: false, alertRecovery: true };
        }
      } else {
        await kv.del(consecOkKey); // failed again, reset counter
      }
    }

    return { alertDown: false, alertRecovery: false };
  } catch {
    return { alertDown: false, alertRecovery: false };
  }
}

// ── Slack alert with KV-backed debounce ───────────────────────────────────────
async function sendSlackAlert(text: string, key: string): Promise<void> {
  const webhookUrl = process.env.network_status_alert;
  if (!webhookUrl) return;
  const kv = getRedis();
  if (kv) {
    try {
      const debounceKey = `debounce:${key}`;
      const exists = await kv.exists(debounceKey);
      if (exists) return;
      await kv.set(debounceKey, 1, { ex: DEBOUNCE_TTL_S });
    } catch {}
  }
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {}
}

// ── WhatsApp alert via Make.com → Green API ───────────────────────────────────
async function sendWhatsAppAlert(text: string, key: string): Promise<void> {
  const webhookUrl = process.env.WHATSAPP_ALERT_WEBHOOK;
  if (!webhookUrl) return;
  const kv = getRedis();
  if (kv) {
    try {
      const debounceKey = `wa_debounce:${key}`;
      const exists = await kv.exists(debounceKey);
      if (exists) return;
      await kv.set(debounceKey, 1, { ex: DEBOUNCE_TTL_S });
    } catch {}
  }
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {}
}

// ── Utilities ────────────────────────────────────────────────────────────────
function formatHashrate(hps: number): string {
  if (hps >= 1e15) return `${(hps / 1e15).toFixed(2)} PH/s`;
  if (hps >= 1e12) return `${(hps / 1e12).toFixed(2)} TH/s`;
  if (hps >= 1e9) return `${(hps / 1e9).toFixed(2)} GH/s`;
  if (hps >= 1e6) return `${(hps / 1e6).toFixed(2)} MH/s`;
  return `${hps.toFixed(0)} H/s`;
}

async function fetchJSON<T>(
  url: string,
  timeoutMs = 5000,
): Promise<{ ok: boolean; data: T | null; latency: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, data: null, latency: Date.now() - start };
    const data = (await res.json()) as T;
    return { ok: true, data, latency: Date.now() - start };
  } catch {
    clearTimeout(timer);
    return { ok: false, data: null, latency: Date.now() - start };
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();
  const STATUS_URL = "https://alph.land/status";

  // 1. Service health checks (mainnet + testnet, parallel)
  const [nodeResult, explorerResult, testnetNodeResult, testnetExplorerResult] =
    await Promise.all([
      fetchJSON<{ releaseVersion: string }>(`${ALPH_NODE}/infos/version`),
      fetchJSON<{ txNumber: number }>(
        `${ALPH_EXPLORER}/addresses/1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH`,
      ),
      fetchJSON<{ releaseVersion: string }>(
        `${ALPH_TESTNET_NODE}/infos/version`,
      ),
      fetchJSON<{ txNumber: number }>(
        `${ALPH_TESTNET_EXPLORER}/addresses/1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH`,
      ),
    ]);

  const services = [
    {
      name: "Public Mainnet Node",
      up: nodeResult.ok,
      latency: nodeResult.latency,
    },
    {
      name: "Public Explorer Backend",
      up: explorerResult.ok,
      latency: explorerResult.latency,
    },
    {
      name: "Public Testnet Node",
      up: testnetNodeResult.ok,
      latency: testnetNodeResult.latency,
    },
    {
      name: "Testnet Explorer Backend",
      up: testnetExplorerResult.ok,
      latency: testnetExplorerResult.latency,
    },
  ];

  // 2. Update KV failure history for each service
  const [nodeState, explorerState, testnetNodeState, testnetExplorerState] =
    await Promise.all([
      updateServiceState("mainnet_node", nodeResult.ok),
      updateServiceState("mainnet_explorer", explorerResult.ok),
      updateServiceState("testnet_node", testnetNodeResult.ok),
      updateServiceState("testnet_explorer", testnetExplorerResult.ok),
    ]);

  const serviceStates = [
    nodeState,
    explorerState,
    testnetNodeState,
    testnetExplorerState,
  ];

  // 3. Hashrate — fetch 25 hours of hourly data to support 1h and 24h comparisons
  const hrResult = await fetchJSON<Array<{ value: number }>>(
    `${ALPH_EXPLORER}/charts/hashrates?fromTs=${now - 25 * 3600_000}&toTs=${now}&interval-type=hourly`,
  );
  const hrData = hrResult.data ?? [];
  const currentHps = hrData[hrData.length - 1]?.value ?? 0;
  const hps1hAgo =
    hrData.length >= 2 ? (hrData[hrData.length - 2]?.value ?? null) : null;
  const hps24hAgo =
    hrData.length >= 25 ? (hrData[hrData.length - 25]?.value ?? null) : null;

  const calcTrend = (current: number, prev: number | null) => {
    if (!prev || prev === 0) return null;
    return ((current - prev) / prev) * 100;
  };

  const trend1h = calcTrend(currentHps, hps1hAgo);
  const trend24h = calcTrend(currentHps, hps24hAgo);

  const trendDirection =
    trend1h === null
      ? null
      : Math.abs(trend1h) < 1
        ? "stable"
        : trend1h > 0
          ? "up"
          : "down";

  const hashrate = {
    currentHps,
    currentFormatted: currentHps > 0 ? formatHashrate(currentHps) : "N/A",
    trend1h,
    trend24h,
    trendDirection,
  };

  // 4. Recent blocks → last-block timestamp per chain
  const blocksResult = await fetchJSON<{
    blocks: Array<{
      timestamp: number;
      chainFrom: number;
      chainTo: number;
      mainChain: boolean;
    }>;
  }>(`${ALPH_EXPLORER}/blocks?page=1&limit=100`, 15000);

  const blocks = blocksResult.data?.blocks ?? [];
  const lastBlockByChain: Record<string, number> = {};
  for (const b of blocks) {
    if (!b.mainChain) continue;
    const key = `${b.chainFrom}-${b.chainTo}`;
    if (!lastBlockByChain[key] || b.timestamp > lastBlockByChain[key]) {
      lastBlockByChain[key] = b.timestamp;
    }
  }

  const chains = [];
  for (let from = 0; from < 4; from++) {
    for (let to = 0; to < 4; to++) {
      const lastTs = lastBlockByChain[`${from}-${to}`] ?? null;
      const secondsSince = lastTs ? Math.floor((now - lastTs) / 1000) : null;
      chains.push({
        fromGroup: from,
        toGroup: to,
        lastBlockTimestamp: lastTs,
        secondsSinceBlock: secondsSince,
        delayed:
          secondsSince !== null
            ? secondsSince > BLOCK_DELAY_THRESHOLD_S
            : false,
      });
    }
  }

  // 5. Alerts + Slack notifications
  const alerts: Array<{
    id: string;
    type: "block_delay" | "hashrate_anomaly" | "service_down";
    message: string;
    severity: "warning" | "critical";
  }> = [];

  // Service alerts: based on failure rate (KV) not single check
  for (let i = 0; i < services.length; i++) {
    const svc = services[i];
    const state = serviceStates[i];
    const id = `service_down_${svc.name.replace(/\s+/g, "_").toLowerCase()}`;

    if (state.alertDown) {
      alerts.push({
        id,
        type: "service_down",
        message: `${svc.name} is degraded`,
        severity: "critical",
      });
      await Promise.all([
        sendSlackAlert(
          `:rotating_light: *Network Alert*\n*Service Degraded*: ${svc.name} — ≥3 of last 5 checks failed\n<${STATUS_URL}|View Status Page>`,
          id,
        ),
        sendWhatsAppAlert(
          `🚨 Network Alert\nService Degraded: ${svc.name}\n≥3 of last 5 checks failed\n${STATUS_URL}`,
          id,
        ),
      ]);
    } else if (state.alertRecovery) {
      alerts.push({
        id: `${id}_recovery`,
        type: "service_down",
        message: `${svc.name} recovered`,
        severity: "warning",
      });
      await Promise.all([
        sendSlackAlert(
          `:white_check_mark: *Network Alert*\n*Service Recovered*: ${svc.name} is back online\n<${STATUS_URL}|View Status Page>`,
          `${id}_recovery`,
        ),
        sendWhatsAppAlert(
          `✅ Network Alert\nService Recovered: ${svc.name} is back online\n${STATUS_URL}`,
          `${id}_recovery`,
        ),
      ]);
    }
  }

  // Block delay alerts
  for (const chain of chains) {
    if (chain.delayed) {
      const id = `block_delay_${chain.fromGroup}_${chain.toGroup}`;
      const mins = Math.floor((chain.secondsSinceBlock ?? 0) / 60);
      const secs = (chain.secondsSinceBlock ?? 0) % 60;
      alerts.push({
        id,
        type: "block_delay",
        message: `Chain ${chain.fromGroup}→${chain.toGroup}: no block for ${mins}m ${secs}s`,
        severity: "warning",
      });
      await Promise.all([
        sendSlackAlert(
          `:warning: *Network Status Alert*\n*Block Delay*: Chain ${chain.fromGroup}→${chain.toGroup} has not produced a block in ${mins}m ${secs}s\n<${STATUS_URL}|View Status Page>`,
          id,
        ),
        sendWhatsAppAlert(
          `⚠️ Network Alert\nBlock Delay: Chain ${chain.fromGroup}→${chain.toGroup} no block for ${mins}m ${secs}s\n${STATUS_URL}`,
          id,
        ),
      ]);
    }
  }

  // Hashrate alerts
  if (trend1h !== null && Math.abs(trend1h) >= HASHRATE_1H_THRESHOLD_PCT) {
    const dir = trend1h > 0 ? "surged" : "dropped";
    const id = `hashrate_1h_${trend1h > 0 ? "up" : "down"}`;
    alerts.push({
      id,
      type: "hashrate_anomaly",
      message: `Hashrate ${dir} ${Math.abs(trend1h).toFixed(1)}% in the last hour (now ${hashrate.currentFormatted})`,
      severity: "warning",
    });
    await sendSlackAlert(
      `:warning: *Network Status Alert*\n*Hashrate 1h ${dir}*: ${Math.abs(trend1h).toFixed(1)}% change in the last hour\nCurrent: ${hashrate.currentFormatted}\n<${STATUS_URL}|View Status Page>`,
      id,
    );
  }

  if (trend24h !== null && Math.abs(trend24h) >= HASHRATE_24H_THRESHOLD_PCT) {
    const dir = trend24h > 0 ? "surged" : "dropped";
    const id = `hashrate_24h_${trend24h > 0 ? "up" : "down"}`;
    alerts.push({
      id,
      type: "hashrate_anomaly",
      message: `Hashrate ${dir} ${Math.abs(trend24h).toFixed(1)}% over 24 hours (now ${hashrate.currentFormatted})`,
      severity: "warning",
    });
    await sendSlackAlert(
      `:warning: *Network Status Alert*\n*Hashrate 24h ${dir}*: ${Math.abs(trend24h).toFixed(1)}% change over 24 hours\nCurrent: ${hashrate.currentFormatted}\n<${STATUS_URL}|View Status Page>`,
      id,
    );
  }

  res.setHeader("Cache-Control", "no-store");
  return res
    .status(200)
    .json({ services, hashrate, chains, alerts, checkedAt: now });
}
