/**
 * GET /api/dashboard-stats
 *
 * Returns public dashboard metrics grouped into:
 * - Chain Metrics: transactions, block time, hashrate, blocks/sec, avg tx fee
 * - Tokenomics: price, market cap, FDV, supply, burned, staked (TBC), locked
 * - Adoption: TVL, DEX volume, dApp count, active addresses
 */
import type { NextApiRequest, NextApiResponse } from "next";
import {
  fetchDashboardStats,
  type DashboardStats,
} from "../../lib/dashboard-stats-fetcher";

export type { DashboardStats };

// ─── In-memory cache ────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60_000;
let cachedResult: DashboardStats | null = null;
let cacheExpiresAt = 0;

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardStats | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();

  if (cachedResult && now < cacheExpiresAt) {
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json(cachedResult);
  }

  const result = await fetchDashboardStats(process.env.INTERNAL_SECRET);

  cachedResult = result;
  cacheExpiresAt = now + CACHE_TTL_MS;

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  return res.status(200).json(result);
}
