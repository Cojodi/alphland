import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const raw = await fetch(
    "https://backend.mainnet.alephium.org/blocks?page=1&limit=5",
  );
  const data = await raw.json();
  res.status(200).json({ status: raw.status, data });
}
