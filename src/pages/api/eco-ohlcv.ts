/**
 * GET /api/eco-ohlcv?address=<addr>&from=<ts_ms>
 *
 * Fetches price history from Mobula and aggregates into OHLCV candles.
 * Aggregation interval is adaptive: 1h for <7d, 4h for <30d, 1d for <1y, 1w otherwise.
 * Cached for 12 hours.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const MOBULA_API_KEY = process.env.MOBULA_API;

export type OHLCVCandle = {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function pickInterval(rangeMs: number | null): number {
  if (!rangeMs || rangeMs > 365 * 24 * 3_600_000) return 7 * 24 * 3_600_000; // 1 week
  if (rangeMs > 90 * 24 * 3_600_000) return 24 * 3_600_000; // 1 day
  if (rangeMs > 30 * 24 * 3_600_000) return 6 * 3_600_000; // 6 hours
  if (rangeMs > 7 * 24 * 3_600_000) return 4 * 3_600_000; // 4 hours
  return 3_600_000; // 1 hour
}

function aggregateCandles(
  priceHistory: [number, number][],
  intervalMs: number,
): OHLCVCandle[] {
  const buckets = new Map<number, number[]>();
  for (const [ts, price] of priceHistory) {
    const bucket = Math.floor(ts / intervalMs) * intervalMs;
    const arr = buckets.get(bucket) ?? [];
    arr.push(price);
    buckets.set(bucket, arr);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, prices]) => ({
      ts,
      open: prices[0],
      close: prices[prices.length - 1],
      high: Math.max(...prices),
      low: Math.min(...prices),
      volume: 0,
    }))
    .filter((c) => c.high >= c.low);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address, from } = req.query;

  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "address is required" });
  }

  const fromMs = from && typeof from === "string" ? Number(from) : null;
  const rangeMs = fromMs ? Date.now() - fromMs : null;
  const intervalMs = pickInterval(rangeMs);

  const params = new URLSearchParams({
    asset: address,
    blockchain: "alephium",
  });

  if (fromMs) {
    params.set("from", String(fromMs));
  }

  try {
    const r = await fetch(
      `https://api.mobula.io/api/1/market/history?${params}`,
      { headers: { Authorization: MOBULA_API_KEY ?? "" } },
    );

    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: txt });
    }

    const json = await r.json();
    const priceHistory: [number, number][] = json?.data?.price_history ?? [];

    const candles = aggregateCandles(priceHistory, intervalMs);

    res.setHeader(
      "Cache-Control",
      "s-maxage=43200, stale-while-revalidate=3600",
    );
    return res.status(200).json({ candles, fetchedAt: Date.now() });
  } catch (err) {
    console.error("eco-ohlcv:", err);
    return res.status(500).json({ error: "Failed to fetch OHLCV data" });
  }
}
