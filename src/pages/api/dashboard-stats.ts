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
const DEFILLAMA_TVL = "https://api.llama.fi/tvl/alephium";

export type DashboardStats = {
  tvlUsd: number | null;
  activeAddresses24h: number | null;
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
  const dayAgo = now - 24 * 3600_000;

  const [tvlRaw, activeAddrsRaw] = await Promise.all([
    fetchJSON<number>(DEFILLAMA_TVL),
    fetchJSON<Array<{ totalAddresses: number; timestamp: number }>>(
      `${ALPH_EXPLORER}/charts/addresses-active?fromTs=${dayAgo}&toTs=${now}&interval-type=daily`,
    ),
  ]);

  // DeFi Llama returns a plain number for /tvl/:chain
  const tvlUsd = typeof tvlRaw === "number" ? tvlRaw : null;

  // Explorer chart returns an array; take the most recent entry
  const activeAddresses24h =
    Array.isArray(activeAddrsRaw) && activeAddrsRaw.length > 0
      ? (activeAddrsRaw[activeAddrsRaw.length - 1]?.totalAddresses ?? null)
      : null;

  const dappCount = countDapps();

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  return res.status(200).json({
    tvlUsd,
    activeAddresses24h,
    dappCount,
    checkedAt: now,
  });
}
