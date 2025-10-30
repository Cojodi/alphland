const fs = require('fs');
const path = require('path');

// Paths
const rootDir = path.join(__dirname, '../../..');
const dataDir = path.join(rootDir, 'data');
const distDir = path.join(__dirname, '../dist');
const srcDir = path.join(__dirname, '../src');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Read all JSON files from data directory
const filenames = fs.readdirSync(dataDir);
const dapps = [];

filenames
  .filter((filename) => filename.endsWith('.json'))
  .forEach((filename) => {
    const dappFile = path.join(dataDir, filename);
    const content = fs.readFileSync(dappFile, { encoding: 'utf8' });

    if (content) {
      try {
        const parsedContent = JSON.parse(content);
        const url = filename.replace(/\.json$/, '').toLowerCase();

        dapps.push({
          ...parsedContent,
          audits: parsedContent.audits || [],
          contracts: parsedContent.contracts || [],
          tokens: parsedContent.tokens || [],
          url: url,
        });
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

fs.writeFileSync(path.join(srcDir, 'dapps.ts'), dappsContent);

// Copy types to dist
const typesContent = fs.readFileSync(path.join(srcDir, 'types.ts'), 'utf8');
fs.writeFileSync(path.join(distDir, 'types.d.ts'), typesContent);

// Create index.d.ts
const indexDtsContent = `export * from './types';
export { dapps } from './dapps';
`;
fs.writeFileSync(path.join(distDir, 'index.d.ts'), indexDtsContent);

// Create index.js
const indexContent = fs.readFileSync(path.join(srcDir, 'index.ts'), 'utf8');
const indexJsContent = indexContent.replace(/from '\.\/types';/, "from './types.js';")
                                   .replace(/from '\.\/dapps';/, "from './dapps.js';");
fs.writeFileSync(path.join(distDir, 'index.js'), indexJsContent);

// Create dapps.js
const dappsJsContent = `// This file is auto-generated. Do not edit manually.
export const dapps = ${JSON.stringify(dapps, null, 2)};
`;
fs.writeFileSync(path.join(distDir, 'dapps.js'), dappsJsContent);

// Create dapps.d.ts
const dappsDtsContent = `import { DappInfo } from './types';
export declare const dapps: DappInfo[];
`;
fs.writeFileSync(path.join(distDir, 'dapps.d.ts'), dappsDtsContent);

console.log(`✅ Built package with ${dapps.length} dApps`);
console.log(`📦 Output directory: ${distDir}`);
