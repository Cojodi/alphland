import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password required" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD not configured");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (password === adminPassword) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: "Invalid password" });
}
