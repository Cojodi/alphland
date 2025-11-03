const fs = require("fs");
const path = require("path");

// Paths
const rootDir = path.join(__dirname, "../../..");
const dataDir = path.join(rootDir, "data");
const distDir = path.join(__dirname, "../dist");
const srcDir = path.join(__dirname, "../src");

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Read all JSON files from data directory
const filenames = fs.readdirSync(dataDir);
const dapps = [];

filenames
  .filter((filename) => filename.endsWith(".json"))
  .forEach((filename) => {
    const dappFile = path.join(dataDir, filename);
    const content = fs.readFileSync(dappFile, { encoding: "utf8" });

    if (content) {
      try {
        const parsedContent = JSON.parse(content);
        const url = filename.replace(/\.json$/, "").toLowerCase();

        // Ensure all required Links properties are present
        const defaultLinks = {
          website: "",
          mirror: "",
          twitter: "",
          telegram: "",
          discord: "",
          github: "",
          youtube: "",
          medium: "",
          careers: "",
          linkedin: "",
          docs: "",
        };

        // Ensure all required Media properties are present
        const defaultMedia = {
          logoUrl: "",
          bannerUrl: "",
          previewUrl: "",
          gallery: [],
        };

        // Filter valid audits (must have name and url)
        const validAudits = (parsedContent.audits || []).filter(
          (audit) =>
            audit && typeof audit === "object" && audit.name && audit.url
        );

        // Filter valid contracts (must have name and address, and be an object not a string)
        const validContracts = (parsedContent.contracts || []).filter(
          (contract) =>
            contract &&
            typeof contract === "object" &&
            contract.name &&
            contract.address
        );

        // Filter valid gallery items (must have url and description)
        const validGallery = (parsedContent.media?.gallery || []).filter(
          (item) =>
            item && typeof item === "object" && item.url && item.description
        );

        // Handle NFT - only include if it's a valid object with required properties
        const nft = parsedContent.nft;
        const hasValidNft =
          nft &&
          typeof nft === "object" &&
          typeof nft !== "string" &&
          nft.collectionLink &&
          nft.collectionContract &&
          nft.collectionName;

        // Build dapp object - exclude nft, contract, and gallery from spread
        const {
          nft: _,
          contract: __,
          gallery: ___,
          ...restOfParsedContent
        } = parsedContent;

        // Ensure teamInfo.anonymous is a boolean
        const teamInfo = parsedContent.teamInfo || {};
        const anonymous =
          typeof teamInfo.anonymous === "boolean" ? teamInfo.anonymous : false;

        const dapp = {
          ...restOfParsedContent,
          twitterName: parsedContent.twitterName || "",
          audits: validAudits,
          contracts: validContracts,
          tokens: parsedContent.tokens || [],
          links: {
            ...defaultLinks,
            ...parsedContent.links,
          },
          media: {
            ...defaultMedia,
            ...parsedContent.media,
            gallery: validGallery,
          },
          teamInfo: {
            ...teamInfo,
            anonymous: anonymous,
          },
          url: url,
        };

        // Only include nft if it's valid
        if (hasValidNft) {
          dapp.nft = nft;
        }

        // Remove unknown properties that might cause type errors
        if (dapp.links && dapp.links.tiktok) {
          delete dapp.links.tiktok;
        }

        dapps.push(dapp);
      } catch (error) {
        console.error(`Error parsing JSON file ${filename}:`, error);
        throw error;
      }
    }
  });

// Generate dapps.ts file
const dappsContent = `// This file is auto-generated. Do not edit manually.
import { DappInfo } from './types';

export const dapps: DappInfo[] = ${JSON.stringify(dapps, null, 2)};
`;

fs.writeFileSync(path.join(srcDir, "dapps.ts"), dappsContent);

// Copy types to dist
const typesContent = fs.readFileSync(path.join(srcDir, "types.ts"), "utf8");
fs.writeFileSync(path.join(distDir, "types.d.ts"), typesContent);

// Create index.d.ts
const indexDtsContent = `export * from './types';
export { dapps } from './dapps';
`;
fs.writeFileSync(path.join(distDir, "index.d.ts"), indexDtsContent);

// Create index.js
const indexContent = fs.readFileSync(path.join(srcDir, "index.ts"), "utf8");
const indexJsContent = indexContent
  .replace(/from '\.\/types';/, "from './types.js';")
  .replace(/from '\.\/dapps';/, "from './dapps.js';");
fs.writeFileSync(path.join(distDir, "index.js"), indexJsContent);

// Create dapps.js
const dappsJsContent = `// This file is auto-generated. Do not edit manually.
export const dapps = ${JSON.stringify(dapps, null, 2)};
`;
fs.writeFileSync(path.join(distDir, "dapps.js"), dappsJsContent);

// Create dapps.d.ts
const dappsDtsContent = `import { DappInfo } from './types';
export declare const dapps: DappInfo[];
`;
fs.writeFileSync(path.join(distDir, "dapps.d.ts"), dappsDtsContent);

console.log(`✅ Built package with ${dapps.length} dApps`);
console.log(`📦 Output directory: ${distDir}`);
