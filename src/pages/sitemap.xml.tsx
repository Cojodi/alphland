import { GetServerSideProps } from "next";
import { readdirSync } from "node:fs";
import path from "path";

const BASE_URL = "https://alph.land";

const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/bounty", priority: "0.9", changefreq: "daily" },
  { loc: "/explore", priority: "0.8", changefreq: "daily" },
  { loc: "/dashboard", priority: "0.8", changefreq: "daily" },
  { loc: "/ecosystem-map", priority: "0.7", changefreq: "weekly" },
  { loc: "/resources", priority: "0.7", changefreq: "weekly" },
  { loc: "/terms", priority: "0.3", changefreq: "monthly" },
  { loc: "/privacy", priority: "0.3", changefreq: "monthly" },
];

function generateSitemap(dappSlugs: string[]): string {
  const now = new Date().toISOString().split("T")[0];

  const staticEntries = STATIC_PAGES.map(
    ({ loc, priority, changefreq }) => `
  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  ).join("");

  const dappEntries = dappSlugs
    .map(
      (slug) => `
  <url>
    <loc>${BASE_URL}/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${dappEntries}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let dappSlugs: string[] = [];
  try {
    const dappsDirectory = path.join(process.cwd(), "data");
    dappSlugs = readdirSync(dappsDirectory)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    // data directory not accessible
  }

  const sitemap = generateSitemap(dappSlugs);

  res.setHeader("Content-Type", "application/xml");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
