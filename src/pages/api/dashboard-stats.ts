/**
 * GET /api/dashboard-stats
 *
 * Returns public dashboard metrics:
 * - TVL (USD) from DeFi Llama
 * - Active addresses (7d / 30d) from D1 via Worker
 * - ALPH supply stats from Alephium explorer
 * - Total transactions from Alephium explorer
 * - Average block time from Alephium explorer
 * - dApp count from local data directory
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { readdirSync } from "fs";
import path from "path";

const DEFILLAMA_CHAINS = "https://api.llama.fi/v2/chains";
const ALPH_EXPLORER = "https://backend.mainnet.alephium.org";
const WORKER_URL = "https://alphland-bounty-api.alephium.workers.dev";

export type DashboardStats = {
  tvlUsd: number | null;
  activeAddresses7d: number | null;
  activeAddresses30d: number | null;
  totalAlph: number | null;
  circulatingAlph: number | null;
  reservedAlph: number | null;
  lockedAlph: number | null;
  totalTransactions: number | null;
  avgBlockTimeMs: number | null; // average across all 16 chains
  dappCount: number;
  checkedAt: number;
};

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

// Supply endpoints return a plain decimal string, not JSON
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

function countDapps(): number {
  try {
    const dataDir = path.join(process.cwd(), "data");
    return readdirSync(dataDir).filter((f) => f.endsWith(".json")).length;
  } catch {
    return 0;
  }
}

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
  type AddrCounts = { count7d: number; count30d: number };
  type BlockTimeEntry = {
    chainFrom: number;
    chainTo: number;
    duration: number;
  };

  const [
    chainsRaw,
    addrCounts,
    totalAlph,
    circulatingAlph,
    reservedAlph,
    lockedAlph,
    totalTransactions,
    blockTimes,
  ] = await Promise.all([
    fetchJSON<DefiLlamaChain[]>(DEFILLAMA_CHAINS),
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
  ]);

  const tvlUsd = Array.isArray(chainsRaw)
    ? (chainsRaw.find((c) => c.name === "Alephium")?.tvl ?? null)
    : null;

  const avgBlockTimeMs =
    Array.isArray(blockTimes) && blockTimes.length > 0
      ? Math.round(
          blockTimes.reduce((sum, e) => sum + e.duration, 0) /
            blockTimes.length,
        )
      : null;

  const dappCount = countDapps();

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  return res.status(200).json({
    tvlUsd,
    activeAddresses7d: addrCounts?.count7d ?? null,
    activeAddresses30d: addrCounts?.count30d ?? null,
    totalAlph,
    circulatingAlph,
    reservedAlph,
    lockedAlph,
    totalTransactions:
      typeof totalTransactions === "number" ? totalTransactions : null,
    avgBlockTimeMs,
    dappCount,
    checkedAt: now,
  });
}
