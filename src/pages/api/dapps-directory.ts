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
          if (!data.name) return null;
          const baseUrl = `https://${req.headers.host}`;
          if (data.media) {
            const toAbsolute = (url: string) =>
              url && url.startsWith("/") ? `${baseUrl}${url}` : url;
            data.media = {
              ...data.media,
              logoUrl: toAbsolute(data.media.logoUrl),
              bannerUrl: toAbsolute(data.media.bannerUrl),
              previewUrl: toAbsolute(data.media.previewUrl),
            };
          }
          return { slug: file.replace(/\.json$/, ""), ...data };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name),
      );

    res.setHeader(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=300",
    );
    return res.status(200).json(dapps);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load dapps" });
  }
}
