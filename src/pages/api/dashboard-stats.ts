/**
 * GET /api/dashboard-stats
 *
 * Returns public dashboard metrics:
 * - TVL (USD) from DeFi Llama
 * - Active addresses (24h) from Alephium explorer
 * - dApp count from local data directory
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { readdirSync } from "fs";
import path from "path";

const DEFILLAMA_CHAINS = "https://api.llama.fi/v2/chains";
const WORKER_URL = "https://alphland-bounty-api.alephium.workers.dev";

export type DashboardStats = {
  tvlUsd: number | null;
  activeAddresses7d: number | null;
  activeAddresses30d: number | null;
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

  type DefiLlamaChain = { name: string; tvl: number };
  type AddrCounts = { count7d: number; count30d: number };
  const secret = process.env.INTERNAL_SECRET;

  const [chainsRaw, addrCounts] = await Promise.all([
    fetchJSON<DefiLlamaChain[]>(DEFILLAMA_CHAINS),
    secret
      ? fetch(`${WORKER_URL}/api/internal/active-addresses/counts`, {
          headers: { Authorization: `Bearer ${secret}` },
        })
          .then((r) => (r.ok ? (r.json() as Promise<AddrCounts>) : null))
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const tvlUsd = Array.isArray(chainsRaw)
    ? (chainsRaw.find((c) => c.name === "Alephium")?.tvl ?? null)
    : null;

  const activeAddresses7d = addrCounts?.count7d ?? null;
  const activeAddresses30d = addrCounts?.count30d ?? null;

  const dappCount = countDapps();

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  return res.status(200).json({
    tvlUsd,
    activeAddresses7d,
    activeAddresses30d,
    dappCount,
    checkedAt: now,
  });
}
