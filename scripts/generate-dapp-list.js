#!/usr/bin/env node
/**
 * Auto-generates src/worker/dappList.ts from the slug lists in src/data/featuredDapps.ts.
 * Run via: node scripts/generate-dapp-list.js
 * This is called automatically before worker:deploy (see package.json).
 */

const fs = require("fs");
const path = require("path");

// --- Read slugs from featuredDapps.ts ---
const featuredPath = path.join(__dirname, "../src/data/featuredDapps.ts");
const source = fs.readFileSync(featuredPath, "utf8");

function extractArray(name) {
  const re = new RegExp(`export const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`);
  const match = source.match(re);
  if (!match) throw new Error(`Could not find ${name} in featuredDapps.ts`);
  return match[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith('"'))
    .map((l) => l.replace(/^"|",?$/g, ""));
}

const BY_ALEPHIUM = extractArray("BY_ALEPHIUM_DAPPS");
const FEATURED = extractArray("FEATURED_DAPPS");

// Deduplicate preserving order (By Alephium first)
const seen = new Set();
const allSlugs = [...BY_ALEPHIUM, ...FEATURED].filter((s) => {
  if (seen.has(s)) return false;
  seen.add(s);
  return true;
});

// Verify all JSON files exist
const dataDir = path.join(__dirname, "../data");
const missing = allSlugs.filter(
  (s) => !fs.existsSync(path.join(dataDir, `${s}.json`)),
);
if (missing.length) {
  console.error("Missing JSON files for slugs:", missing);
  process.exit(1);
}

// --- Generate import identifier from slug ---
function toIdentifier(slug) {
  return slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// --- Build file content ---
const imports = allSlugs
  .map((s) => `import ${toIdentifier(s)} from "../../data/${s}.json";`)
  .join("\n");

const byAlephiumComment = BY_ALEPHIUM.map((s) => `  ${toIdentifier(s)},`).join(
  "\n",
);
const featuredComment = FEATURED.filter((s) => !new Set(BY_ALEPHIUM).has(s))
  .map((s) => `  ${toIdentifier(s)},`)
  .join("\n");

const output = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Run \`node scripts/generate-dapp-list.js\` (or \`npm run generate-dapp-list\`) to regenerate.
 * Source of truth: src/data/featuredDapps.ts
 */

${imports}

export interface DappData {
  name: string;
  description?: string;
  short_description?: string;
  tags?: string[];
  councils_choice?: boolean;
  verified?: boolean;
  dotw?: boolean;
  links?: {
    website?: string;
    careers?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    github?: string;
    youtube?: string;
    medium?: string;
    mirror?: string;
    linkedin?: string;
    docs?: string;
  };
  teamInfo?: { name?: string; contactEmail?: string; anonymous?: boolean; founded?: string };
  media?: { logoUrl?: string; bannerUrl?: string; previewUrl?: string; videoUrl?: string; gallery?: unknown[] };
  contracts?: unknown[];
  audits?: unknown[];
  tokens?: unknown[];
  nft?: unknown;
  twitterName?: string;
  group?: string;
}

interface DappListItem {
  name: string;
  developer: string;
  url: string;
}

function getDeveloperName(data: DappData): string {
  const team = data.teamInfo;
  if (team?.name) return team.name;
  if (team?.contactEmail) return team.contactEmail;
  return \`\${data.name} Team\`;
}

const RAW: DappData[] = [
  // By Alephium
${byAlephiumComment}
  // Spotlight
${featuredComment}
];

const seen = new Set<string>();
const DEDUPED = RAW.filter((raw) => {
  if (seen.has(raw.name)) return false;
  seen.add(raw.name);
  return true;
});

// Simple list: name + developer + url (for Apple App Store compliance)
export const DAPP_LIST: DappListItem[] = DEDUPED.reduce<DappListItem[]>(
  (acc, raw) => {
    const url = raw.links?.website;
    if (url) acc.push({ name: raw.name, developer: getDeveloperName(raw), url });
    return acc;
  },
  [],
);

`;

const outPath = path.join(__dirname, "../src/worker/dappList.ts");
fs.writeFileSync(outPath, output, "utf8");
console.log(`✓ Generated src/worker/dappList.ts (${allSlugs.length} dApps)`);
