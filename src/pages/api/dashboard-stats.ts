/**
 * GET /api/dashboard-stats
 *
 * Returns public dashboard metrics grouped into:
 * - Chain Metrics: transactions, block time, hashrate, blocks/sec, avg tx fee
 * - Tokenomics: price, market cap, FDV, supply, burned, staked (TBC), locked
 * - Adoption: TVL, DEX volume, dApp count, active addresses
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { readdirSync, readFileSync } from "fs";
import path from "path";

const ALPH_EXPLORER = "https://backend.mainnet.alephium.org";
const DEFILLAMA_CHAINS = "https://api.llama.fi/v2/chains";
const DEFILLAMA_DEXS =
  "https://api.llama.fi/overview/dexs/Alephium?excludeTotalDataChartBreakdown=true&excludeTotalDataChart=true";
const NOTRUSTVERIFY = "https://lb-fullnode-alephium.notrustverify.ch";
const DIADATA_ALPH =
  "https://api.diadata.org/v1/assetQuotation/Alephium/tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq";
const WORKER_URL = "https://alphland-bounty-api.alephium.workers.dev";

// Same definition as Card.tsx — only these tag holders count as dApps
const DAPP_TAGS = new Set(["DeFi", "NFTs", "Games", "Quests", "Social"]);

export type DashboardStats = {
  // Chain Metrics
  totalTransactions: number | null;
  avgBlockTimeMs: number | null;
  blocksPerSecond: number | null;
  hashrate: number | null; // H/s
  avgTxFeeAlph: number | null;

  // Tokenomics
  alphPrice: number | null;
  marketCap: number | null;
  fdv: number | null;
  circulatingAlph: number | null;
  totalAlph: number | null;
  burnedAlph24h: number | null; // estimated from 15-min sample × 96
  stakedAlph: number | null; // TBC — Powfi
  lockedAlph: number | null;
  reservedAlph: number | null;

  // Adoption
  tvlUsd: number | null;
  dexVolume24h: number | null;
  dappCount: number;
  activeAddresses7d: number | null;
  activeAddresses30d: number | null;

  checkedAt: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function fetchDecimal(url: string): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = await res.text();
    const n = parseFloat(text);
    return isNaN(n) ? null : n;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Count entries whose tags contain at least one DAPP_TAG.
 * Mirrors the isDapp() logic in Card.tsx.
 */
function countDapps(): number {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const files = readdirSync(dataDir).filter((f) => f.endsWith(".json"));
    let count = 0;
    for (const file of files) {
      try {
        const raw = readFileSync(path.join(dataDir, file), "utf-8");
        const dapp = JSON.parse(raw) as { tags?: string[] };
        const tags = dapp.tags ?? [];
        if (tags.some((t) => DAPP_TAGS.has(t))) count++;
      } catch {
        // skip malformed files
      }
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Fetch the latest hourly hashrate from the explorer charts API.
 * Returns raw H/s value as a number.
 */
async function fetchHashrate(): Promise<number | null> {
  const now = Date.now();
  const from = now - 2 * 24 * 60 * 60 * 1000; // last 2 days
  type HashrateEntry = { timestamp: number; hashrate: string };
  const data = await fetchJSON<HashrateEntry[]>(
    `${ALPH_EXPLORER}/charts/hashrates?fromTs=${from}&toTs=${now}&interval-type=hourly`,
  );
  if (!Array.isArray(data) || data.length === 0) return null;
  const latest = data[data.length - 1];
  const hr = parseFloat(latest.hashrate);
  return isNaN(hr) ? null : hr;
}

/**
 * Fetch 15 minutes of block data from notrustverify, calculate:
 * - avgTxFeeAlph: average fee per user-initiated (non-coinbase) transaction
 * - burnedAlph24h: total fees in window extrapolated to 24 hours
 *
 * Non-coinbase = transactions that have at least one input (user UTXOs).
 * Logic mirrors burn.js by notrustverify.
 */
async function fetchFeeStats(): Promise<{
  avgTxFeeAlph: number | null;
  burnedAlph24h: number | null;
}> {
  const now = Date.now();
  const fromTs = now - 15 * 60 * 1000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(
      `${NOTRUSTVERIFY}/blockflow/blocks?fromTs=${fromTs}&toTs=${now}`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return { avgTxFeeAlph: null, burnedAlph24h: null };

    type Tx = {
      unsigned?: {
        gasAmount?: number;
        gasPrice?: string;
        inputs?: unknown[];
      };
    };
    type Block = { transactions?: Tx[] };
    type BlocksData = { blocks: Block[][] };

    const data = (await res.json()) as BlocksData;
    if (!Array.isArray(data?.blocks))
      return { avgTxFeeAlph: null, burnedAlph24h: null };

    let totalFeeAlph = 0;
    let nonCoinbaseTxs = 0;

    for (const blockGroup of data.blocks) {
      for (const block of blockGroup) {
        for (const tx of block.transactions ?? []) {
          const u = tx.unsigned;
          if (!u?.gasAmount || !u?.gasPrice) continue;
          // non-coinbase = has user inputs
          if (!Array.isArray(u.inputs) || u.inputs.length === 0) continue;
          // Split division to avoid float64 overflow (gasAmount * gasPrice can exceed MAX_SAFE_INTEGER)
          const feeAlph =
            (Number(u.gasAmount) / 1e9) * (parseFloat(u.gasPrice) / 1e9);
          totalFeeAlph += feeAlph;
          nonCoinbaseTxs++;
        }
      }
    }

    if (nonCoinbaseTxs === 0)
      return { avgTxFeeAlph: null, burnedAlph24h: null };

    const avgTxFeeAlph = totalFeeAlph / nonCoinbaseTxs;
    const burnedAlph24h = totalFeeAlph * ((24 * 60) / 15); // 15 min → 24 h

    return { avgTxFeeAlph, burnedAlph24h };
  } catch {
    clearTimeout(timer);
    return { avgTxFeeAlph: null, burnedAlph24h: null };
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardStats | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();
  const secret = process.env.INTERNAL_SECRET;

  type DefiLlamaChain = { name: string; tvl: number };
  type DefiLlamaDexs = { total24h: number | null };
  type AddrCounts = { count7d: number; count30d: number };
  type BlockTimeEntry = {
    chainFrom: number;
    chainTo: number;
    duration: number;
  };
  type DiaPrice = { Price: number };

  const [
    chainsRaw,
    dexsRaw,
    addrCounts,
    totalAlph,
    circulatingAlph,
    reservedAlph,
    lockedAlph,
    totalTransactions,
    blockTimes,
    hashrateRaw,
    priceRaw,
    feeStats,
  ] = await Promise.all([
    fetchJSON<DefiLlamaChain[]>(DEFILLAMA_CHAINS),
    fetchJSON<DefiLlamaDexs>(DEFILLAMA_DEXS),
    secret
      ? fetch(`${WORKER_URL}/api/internal/active-addresses/counts`, {
          headers: { Authorization: `Bearer ${secret}` },
        })
          .then((r) => (r.ok ? (r.json() as Promise<AddrCounts>) : null))
          .catch(() => null)
      : Promise.resolve(null),
    fetchDecimal(`${ALPH_EXPLORER}/infos/supply/total-alph`),
    fetchDecimal(`${ALPH_EXPLORER}/infos/supply/circulating-alph`),
    fetchDecimal(`${ALPH_EXPLORER}/infos/supply/reserved-alph`),
    fetchDecimal(`${ALPH_EXPLORER}/infos/supply/locked-alph`),
    fetchJSON<number>(`${ALPH_EXPLORER}/infos/total-transactions`),
    fetchJSON<BlockTimeEntry[]>(`${ALPH_EXPLORER}/infos/average-block-times`),
    fetchHashrate(),
    fetchJSON<DiaPrice>(DIADATA_ALPH),
    fetchFeeStats(),
  ]);

  // TVL
  const tvlUsd = Array.isArray(chainsRaw)
    ? (chainsRaw.find((c) => c.name === "Alephium")?.tvl ?? null)
    : null;

  // DEX volume
  const dexVolume24h = dexsRaw?.total24h ?? null;

  // Avg block time (average across all 16 shards) + blocks per second
  const avgBlockTimeMs =
    Array.isArray(blockTimes) && blockTimes.length > 0
      ? Math.round(
          blockTimes.reduce((sum, e) => sum + e.duration, 0) /
            blockTimes.length,
        )
      : null;
  const blocksPerSecond =
    avgBlockTimeMs != null && avgBlockTimeMs > 0
      ? Math.round((16_000 / avgBlockTimeMs) * 100) / 100
      : null;

  // Price + derived market metrics
  const alphPrice =
    priceRaw?.Price != null && !isNaN(priceRaw.Price) ? priceRaw.Price : null;
  const marketCap =
    alphPrice != null && circulatingAlph != null
      ? alphPrice * circulatingAlph
      : null;
  const fdv =
    alphPrice != null && totalAlph != null ? alphPrice * totalAlph : null;

  const dappCount = countDapps();

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  return res.status(200).json({
    // Chain Metrics
    totalTransactions:
      typeof totalTransactions === "number" ? totalTransactions : null,
    avgBlockTimeMs,
    blocksPerSecond,
    hashrate: hashrateRaw,
    avgTxFeeAlph: feeStats.avgTxFeeAlph,

    // Tokenomics
    alphPrice,
    marketCap,
    fdv,
    circulatingAlph,
    totalAlph,
    burnedAlph24h: feeStats.burnedAlph24h,
    stakedAlph: null, // TBC — requires Powfi API
    lockedAlph,
    reservedAlph,

    // Adoption
    tvlUsd,
    dexVolume24h,
    dappCount,
    activeAddresses7d: addrCounts?.count7d ?? null,
    activeAddresses30d: addrCounts?.count30d ?? null,

    checkedAt: now,
  });
}
