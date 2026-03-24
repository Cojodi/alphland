/**
 * GET /api/network-status
 *
 * Served directly by Next.js/Vercel (takes precedence over the /api/* → Worker rewrite).
 * Checks Alephium public node + explorer health, hashrate trend, per-chain block times,
 * and optionally sends Slack alerts via network_status_alert env var.
 *
 * Slack alert debounce uses module-level state — best-effort within a warm serverless
 * instance. For production-grade debounce, swap for Vercel KV / Cloudflare KV.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const ALPH_NODE = "https://node.mainnet.alephium.org";
const ALPH_EXPLORER = "https://backend.mainnet.alephium.org";
const ALPH_TESTNET_NODE = "https://node.testnet.alephium.org";
const ALPH_TESTNET_EXPLORER = "https://backend.testnet.alephium.org";
const BLOCK_DELAY_THRESHOLD_S = 120;
const HASHRATE_1H_THRESHOLD_PCT = 5; // alert if 1h change exceeds ±0.1% (temp: force trigger)
const HASHRATE_24H_THRESHOLD_PCT = 15; // alert if 24h change exceeds ±0.1% (temp: force trigger)

// ── Alert debounce (module-level, best-effort in serverless) ─────────────────
const _alertDebounce: Record<string, number> = {};
const ALERT_DEBOUNCE_MS = 10 * 60 * 1000;

async function sendSlackAlert(text: string, key: string): Promise<void> {
  const webhookUrl = process.env.network_status_alert;
  if (!webhookUrl) return;
  const now = Date.now();
  if (_alertDebounce[key] && now - _alertDebounce[key] < ALERT_DEBOUNCE_MS)
    return;
  _alertDebounce[key] = now;
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

  // 1. Service health checks (mainnet + testnet, parallel)
  const [nodeResult, explorerResult, testnetNodeResult, testnetExplorerResult] =
    await Promise.all([
      fetchJSON<{ releaseVersion: string }>(`${ALPH_NODE}/infos/version`),
      fetchJSON<{ totalTransactions: number }>(`${ALPH_EXPLORER}/infos`),
      fetchJSON<{ releaseVersion: string }>(
        `${ALPH_TESTNET_NODE}/infos/version`,
      ),
      fetchJSON<{ totalTransactions: number }>(
        `${ALPH_TESTNET_EXPLORER}/infos`,
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

  // 2. Hashrate — fetch 25 hours of hourly data to support 1h and 24h comparisons
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

  // 3. Recent blocks → last-block timestamp per chain
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

  // Build per-chain status (4 × 4 = 16 chains)
  const chains = [];
  for (let from = 0; from < 4; from++) {
    for (let to = 0; to < 4; to++) {
      const lastTs = lastBlockByChain[`${from}-${to}`] ?? null;
      // If chain not found in 200 blocks, it's genuinely unknown (not a fake 5m default)
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

  // 4. Generate alerts + Slack notifications
  const alerts: Array<{
    id: string;
    type: "block_delay" | "hashrate_anomaly" | "service_down";
    message: string;
    severity: "warning" | "critical";
  }> = [];

  for (const svc of services) {
    if (!svc.up) {
      const id = `service_down_${svc.name.replace(/\s+/g, "_").toLowerCase()}`;
      alerts.push({
        id,
        type: "service_down",
        message: `${svc.name} is unreachable`,
        severity: "critical",
      });
      await sendSlackAlert(
        `:rotating_light: *Network Alert*\n*Service Down*: ${svc.name} is unreachable\n<https://alph.land/status|View Status Page>`,
        id,
      );
    }
  }

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
      await sendSlackAlert(
        `:warning: *Network Status Alert*\n*Block Delay*: Chain ${chain.fromGroup}→${chain.toGroup} has not produced a block in ${mins}m ${secs}s\n<https://alph.land/status|View Status Page>`,
        id,
      );
    }
  }

  // 1h hashrate alert: ±5%
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
      `:warning: *Network Status Alert*\n*Hashrate 1h ${dir}*: ${Math.abs(trend1h).toFixed(1)}% change in the last hour\nCurrent: ${hashrate.currentFormatted}\n<https://alph.land/status|View Status Page>`,
      id,
    );
  }

  // 24h hashrate alert: ±15%
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
      `:warning: *Network Status Alert*\n*Hashrate 24h ${dir}*: ${Math.abs(trend24h).toFixed(1)}% change over 24 hours\nCurrent: ${hashrate.currentFormatted}\n<https://alph.land/status|View Status Page>`,
      id,
    );
  }

  res.setHeader("Cache-Control", "no-store");
  return res
    .status(200)
    .json({ services, hashrate, chains, alerts, checkedAt: now });
}
