import { readdirSync, readFileSync } from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const dataDir = path.join(process.cwd(), "data");
    const files = readdirSync(dataDir).filter((f) => f.endsWith(".json"));

    const dapps = files
      .map((file) => {
        try {
          const content = readFileSync(path.join(dataDir, file), "utf8");
          const data = JSON.parse(content);
          return {
            slug: file.replace(/\.json$/, ""),
            name: data.name as string,
          };
        } catch {
          return null;
        }
      })
      .filter(
        (d): d is { slug: string; name: string } => d !== null && !!d.name,
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({ dapps });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load dapps" });
  }
}
