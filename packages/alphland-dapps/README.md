# @alphland/dapps

A comprehensive list of dApps on the Alephium blockchain, curated and maintained by [Alphland](https://alph.land).

## Installation

```bash
npm install @alphland/dapps
```

or

```bash
yarn add @alphland/dapps
```

## Usage

```typescript
import { dapps, DappInfo } from '@alphland/dapps';

// Get all dApps
console.log(dapps);

// Filter by tag
const defiDapps = dapps.filter(dapp => dapp.tags.includes('DeFi'));

// Find a specific dApp
const ayin = dapps.find(dapp => dapp.url === 'ayin');

// Get verified dApps
const verifiedDapps = dapps.filter(dapp => dapp.verified);

// Get dApps with audits
const auditedDapps = dapps.filter(dapp => dapp.audits.length > 0);
```

## Data Structure

Each dApp contains the following information:

- **name**: Name of the dApp
- **description**: Full description
- **short_description**: One-liner description
- **tags**: Categories (DeFi, NFTs, Games, etc.)
- **verified**: Whether contracts are verified on Alephium
- **audits**: List of security audits
- **contracts**: Smart contract addresses
- **tokens**: Token information
- **links**: Social media and documentation links
- **media**: Logos, banners, and preview images
- **teamInfo**: Team and project information

## Available Tags

- `Onramps`
- `Bridges`
- `DeFi`
- `Games`
- `NFTs`
- `Social`
- `DAOs`
- `Infrastructure`
- `Wallets`
- `Security`
- `Hashrate`
- `Stats`
- `ComingSoon`

## TypeScript Support

This package includes full TypeScript type definitions.

```typescript
import type { DappInfo, Audit, Contract, Links, Media } from '@alphland/dapps';
```

## Data Source

The data is sourced from the [Alphland repository](https://github.com/xbabyx/alphland) and is updated regularly.

## Contributing

To add or update a dApp, please submit a PR to the [main repository](https://github.com/xbabyx/alphland).

## License

MIT
