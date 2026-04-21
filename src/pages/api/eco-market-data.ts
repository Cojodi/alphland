/**
 * GET /api/eco-market-data
 *
 * Fetches market data for all tracked ecosystem tokens via Mobula multi-data.
 * Returns tokens sorted by market_cap descending.
 * Cached for 1 hour — only called once per page load.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const MOBULA_API_KEY = process.env.MOBULA_API;

const TRACKED = [
  {
    address: "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq",
    symbol: "ALPH",
    name: "Alephium",
  },
  {
    address: "vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy",
    symbol: "AYIN",
    name: "Ayin",
  },
  {
    address: "27HxXZJBTPjhHXwoF1Ue8sLMcSxYdxefoN2U6d8TKmZsm",
    symbol: "APAD",
    name: "AlphPad",
  },
  {
    address: "258k9T6WqezTLdfGvHixXzK1yLATeSPuyhtcxzQ3V2pqV",
    symbol: "ABX",
    name: "AlphBanX",
  },
  {
    address: "28LgMeQGdvtXfsvWhpNNVx1DoSiz7TzrATv9qxMQP5is9",
    symbol: "EX",
    name: "Elexium",
  },
  {
    address: "27Pb61qBV1L168Nb8oEvVmy7m6K8sSGK9RRSngMxkuKpb",
    symbol: "BUILD",
    name: "RalphBuilder",
  },
  {
    address: "ywWQo64HBSMXcv3XBLrm8WjY2Co43BpYJPB3YoSDd4xX",
    symbol: "AURA",
    name: "Aura",
  },
  {
    address: "25yXCxAdnzMgHFVyF963hEYKGzt8hVQtqUXkoKGQKmcNs",
    symbol: "$ONION",
    name: "MyOnion.fun",
  },
];

export type TokenMarketData = {
  address: string;
  name: string;
  symbol: string;
  price: number | null;
  market_cap: number | null;
  liquidity: number | null;
  volume: number | null;
  volume_7d: number | null;
  price_change_24h: number | null;
  price_change_7d: number | null;
  price_change_1m: number | null;
  price_change_1y: number | null;
  rank: number | null;
  ath: number | null;
  atl: number | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const addresses = TRACKED.map((t) => t.address);

  const params = new URLSearchParams({
    assets: addresses.join(","),
    blockchains: Array(addresses.length).fill("alephium").join(","),
  });

  try {
    const r = await fetch(
      `https://api.mobula.io/api/1/market/multi-data?${params}`,
      { headers: { Authorization: MOBULA_API_KEY ?? "" } },
    );

    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: txt });
    }

    const json = await r.json();
    const dataMap: Record<string, any> = json?.data ?? {};

    const tokens: TokenMarketData[] = addresses
      .map((addr) => {
        const d = dataMap[addr] ?? {};
        const meta = TRACKED.find((t) => t.address === addr)!;
        return {
          address: addr,
          name: d.name ?? meta.name,
          symbol: d.symbol ?? meta.symbol,
          price: d.price || null,
          market_cap: d.market_cap || null,
          liquidity: d.liquidity || null,
          volume: d.volume || null,
          volume_7d: d.volume_7d || null,
          price_change_24h: d.price_change_24h ?? null,
          price_change_7d: d.price_change_7d ?? null,
          price_change_1m: d.price_change_1m ?? null,
          price_change_1y: d.price_change_1y ?? null,
          rank: d.rank ?? null,
          ath: d.ath ?? null,
          atl: d.atl ?? null,
        };
      })
      .sort((a, b) => (b.market_cap ?? -1) - (a.market_cap ?? -1));

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=300");
    return res.status(200).json({ tokens, fetchedAt: Date.now() });
  } catch (err) {
    console.error("eco-market-data:", err);
    return res.status(500).json({ error: "Failed to fetch market data" });
  }
}
