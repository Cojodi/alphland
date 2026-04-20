/**
 * GET /api/eco-price-history?address=<contractAddress>&from=<timestamp>
 *
 * Proxies Mobula market/history for Alephium ecosystem tokens.
 * Returns: { data: { price_history: [timestamp, price][] } }
 */
import type { NextApiRequest, NextApiResponse } from "next";

const MOBULA_API_KEY = process.env.MOBULA_API;

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
    const response = await fetch(
      `https://api.mobula.io/api/1/market/history?${params.toString()}`,
      {
        headers: {
          Authorization: MOBULA_API_KEY ?? "",
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return res
        .status(response.status)
        .json({ error: `Mobula error: ${text}` });
    }

    const data = await response.json();

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json(data);
  } catch (err) {
    console.error("eco-price-history error:", err);
    return res.status(500).json({ error: "Failed to fetch price history" });
  }
}
