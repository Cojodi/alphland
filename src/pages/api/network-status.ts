/**
 * GET /api/network-status
 *
 * Served directly by Next.js/Vercel (takes precedence over the /api/* → Worker rewrite).
 * Checks Alephium public node + explorer health, hashrate trend, per-chain block times,
 * and optionally sends Slack alerts via SLACK_WEBHOOK_URL env var.
 *
 * Slack alert debounce uses module-level state — best-effort within a warm serverless
 * instance. For production-grade debounce, swap for Vercel KV / Cloudflare KV.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const ALPH_NODE = "https://node.mainnet.alephium.org";
const ALPH_EXPLORER = "https://backend.mainnet.alephium.org";
const ALPH_TESTNET_NODE = "https://node.testnet.alephium.org";
const ALPH_TESTNET_EXPLORER = "https://backend.testnet.alephium.org";
const BLOCK_DELAY_THRESHOLD_S = 60;
const HASHRATE_CHANGE_THRESHOLD_PCT = 50; // hourly fluctuation >50% is unusual

// ── Alert debounce (module-level, best-effort in serverless) ─────────────────
const _alertDebounce: Record<string, number> = {};
const ALERT_DEBOUNCE_MS = 10 * 60 * 1000;

async function sendSlackAlert(text: string, key: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
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

  // 2. Hashrate trend (last 2 hours, hourly buckets)
  const hrResult = await fetchJSON<Array<{ value: number }>>(
    `${ALPH_EXPLORER}/charts/hashrates?fromTs=${now - 2 * 3600_000}&toTs=${now}&interval-type=hourly`,
  );
  const hrData = hrResult.data ?? [];
  const currentHps = hrData[hrData.length - 1]?.value ?? 0;
  const previousHps =
    hrData.length >= 2 ? (hrData[hrData.length - 2]?.value ?? null) : null;
  let trendPct: number | null = null;
  let trendDirection: "up" | "down" | "stable" | null = null;
  if (previousHps && previousHps > 0) {
    trendPct = ((currentHps - previousHps) / previousHps) * 100;
    trendDirection =
      Math.abs(trendPct) < 1 ? "stable" : trendPct > 0 ? "up" : "down";
  }
  const hashrate = {
    currentHps,
    previousHps,
    currentFormatted: currentHps > 0 ? formatHashrate(currentHps) : "N/A",
    trendPct,
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
  }>(`${ALPH_EXPLORER}/blocks?page=1&limit=200`);

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
        `:rotating_light: *Aleph.land Network Alert*\n*Service Down*: ${svc.name} is unreachable\n<https://alph.land/status|View Status Page>`,
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
        `:warning: *Aleph.land Network Alert*\n*Block Delay*: Chain ${chain.fromGroup}→${chain.toGroup} has not produced a block in ${mins}m ${secs}s\n<https://alph.land/status|View Status Page>`,
        id,
      );
    }
  }

  if (
    trendPct !== null &&
    Math.abs(trendPct) >= HASHRATE_CHANGE_THRESHOLD_PCT
  ) {
    const dir = trendPct > 0 ? "increased" : "decreased";
    const id = "hashrate_anomaly";
    alerts.push({
      id,
      type: "hashrate_anomaly",
      message: `Hashrate ${dir} by ${Math.abs(trendPct).toFixed(1)}% in the last hour (${hashrate.currentFormatted})`,
      severity: "warning",
    });
    await sendSlackAlert(
      `:warning: *Aleph.land Network Alert*\n*Hashrate Anomaly*: Hashrate ${dir} by ${Math.abs(trendPct).toFixed(1)}% in the last hour\nCurrent: ${hashrate.currentFormatted}\n<https://alph.land/status|View Status Page>`,
      id,
    );
  }

  res.setHeader("Cache-Control", "no-store");
  return res
    .status(200)
    .json({ services, hashrate, chains, alerts, checkedAt: now });
}
