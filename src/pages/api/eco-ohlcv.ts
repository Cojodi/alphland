/**
 * GET /api/eco-ohlcv?address=<addr>&from=<ts_ms>
 *
 * Fetches 1-hour OHLCV candles for a token via Mobula.
 * Cached for 12 hours — 5 credits per call.
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
    period: "60",
  });

  if (from && typeof from === "string") {
    params.set("from", from);
  }

  try {
    const r = await fetch(
      `https://api.mobula.io/api/v2/token/ohlcv-history?${params}`,
      { headers: { Authorization: MOBULA_API_KEY ?? "" } },
    );

    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: txt });
    }

    const json = await r.json();

    // Normalize: Mobula may return arrays or objects
    const raw: any[] = json?.data?.ohlcv ?? json?.data ?? [];
    const candles: OHLCVCandle[] = raw
      .map((item: any) => {
        if (Array.isArray(item)) {
          const [ts, open, high, low, close, volume] = item;
          return { ts, open, high, low, close, volume };
        }
        return {
          ts: item.timestamp ?? item.ts ?? 0,
          open: item.open ?? 0,
          high: item.high ?? 0,
          low: item.low ?? 0,
          close: item.close ?? 0,
          volume: item.volume ?? 0,
        };
      })
      .filter((c) => c.ts > 0 && c.high >= c.low);

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
