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

const ALPH_EXPLORER = "https://backend.mainnet.alephium.org";
const DEFILLAMA_CHAINS = "https://api.llama.fi/v2/chains";

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
  const weekAgo = now - 7 * 24 * 3600_000;
  const monthAgo = now - 30 * 24 * 3600_000;

  type AddressChartEntry = { totalAddresses: number; timestamp: number };
  type DefiLlamaChain = { name: string; tvl: number };
  const [chainsRaw, activeAddrsRaw] = await Promise.all([
    fetchJSON<DefiLlamaChain[]>(DEFILLAMA_CHAINS),
    fetchJSON<AddressChartEntry[]>(
      `${ALPH_EXPLORER}/charts/addresses-active?fromTs=${monthAgo}&toTs=${now}&interval-type=daily`,
    ),
  ]);

  // Find Alephium entry in the chains array
  const tvlUsd = Array.isArray(chainsRaw)
    ? (chainsRaw.find((c) => c.name === "Alephium")?.tvl ?? null)
    : null;

  const sumAddresses = (entries: AddressChartEntry[], fromTs: number) =>
    entries
      .filter((d) => d.timestamp >= fromTs)
      .reduce((sum, d) => sum + (d.totalAddresses ?? 0), 0);

  const activeAddresses7d =
    Array.isArray(activeAddrsRaw) && activeAddrsRaw.length > 0
      ? sumAddresses(activeAddrsRaw, weekAgo)
      : null;

  const activeAddresses30d =
    Array.isArray(activeAddrsRaw) && activeAddrsRaw.length > 0
      ? sumAddresses(activeAddrsRaw, monthAgo)
      : null;

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
