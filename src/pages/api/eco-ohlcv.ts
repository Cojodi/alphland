/**
 * GET /api/eco-ohlcv?address=<addr>&from=<ts_ms>
 *
 * Fetches price history from Mobula and aggregates into hourly OHLCV candles.
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

function aggregateCandles(priceHistory: [number, number][]): OHLCVCandle[] {
  const hourMap = new Map<number, number[]>();
  for (const [ts, price] of priceHistory) {
    const hourTs = Math.floor(ts / 3_600_000) * 3_600_000;
    const arr = hourMap.get(hourTs) ?? [];
    arr.push(price);
    hourMap.set(hourTs, arr);
  }
  return Array.from(hourMap.entries())
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

  const params = new URLSearchParams({
    asset: address,
    blockchain: "alephium",
  });

  if (from && typeof from === "string") {
    params.set("from", from);
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

    const candles = aggregateCandles(priceHistory);

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
