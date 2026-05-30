/**
 * GET /api/bridge-security
 *
 * Monitors the Alephium TokenBridge health from both sides:
 * - Alephium side: wrapped token supplies + bridge contract token holdings
 * - Ethereum side: bridge contract collateral balances via Etherscan
 *
 * The core security invariant: wrapped supply on Alephium ≤ locked collateral on Ethereum.
 * A discrepancy > threshold signals a potential exploit (e.g. forged VAA minting).
 */
import type { NextApiRequest, NextApiResponse } from "next";

const ALPH_NODE = "https://node.mainnet.alephium.org";
const ETHERSCAN_API = "https://api.etherscan.io/v2/api?chainid=1";

// Alephium bridge contracts
const ALPH_BRIDGE_ADDRESS = "23Fj7xr1pxWfYLixz3aBC3u5dUJVpAjXArbpiYWxeGjQT";

// Ethereum TokenBridge — proxy is the canonical address, implementation executes transfers
const ETH_BRIDGE_ADDRESS = "0x579a3bDE631c3d8068CbFE3dc45B0F14EC18dD43";
const ETH_BRIDGE_IMPL = "0x0F843945075DF4EA9C8a21f0e0CcFD5eB073eEAb";

// Wrapped tokens on Alephium (bridged from ETH side)
const BRIDGE_TOKENS = [
  {
    symbol: "USDT",
    alphTokenId: "zSRgc7goAYUgYsEBYdAzogyyeKv3ne3uvWb3VDtxnaEK",
    ethTokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimalsAlph: 6,
    decimalsEth: 6,
    coingeckoId: "tether",
  },
  {
    symbol: "USDC",
    alphTokenId: "22Nb9JajRpAh9A2fWNgoKt867PA6zNyi541rtoraDfKXV",
    ethTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimalsAlph: 6,
    decimalsEth: 6,
    coingeckoId: "usd-coin",
  },
  {
    symbol: "WETH",
    alphTokenId: "vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb",
    ethTokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimalsAlph: 18,
    decimalsEth: 18,
    coingeckoId: "weth",
  },
  {
    symbol: "WBTC",
    alphTokenId: "xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR",
    ethTokenAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimalsAlph: 8,
    decimalsEth: 8,
    coingeckoId: "wrapped-bitcoin",
  },
];

// Supply anomaly threshold: flag if Alph supply > ETH locked by more than this %
const DISCREPANCY_WARNING_PCT = 5;
const DISCREPANCY_CRITICAL_PCT = 20;

export type BridgeTokenStatus = {
  symbol: string;
  alphTokenId: string;
  // Alephium side: how many wrapped tokens exist
  alphSupplyRaw: string | null;
  alphSupply: number | null;
  alphSupplyUsd: number | null;
  // Ethereum side: how many tokens are locked in the bridge
  ethLockedRaw: string | null;
  ethLocked: number | null;
  ethLockedUsd: number | null;
  // Health
  discrepancyPct: number | null;
  status: "healthy" | "warning" | "critical" | "unknown";
  priceUsd: number | null;
};

export type BridgeWithdrawal = {
  txHash: string;
  timestamp: number;
  token: string;
  amount: number;
  amountUsd: number | null;
  recipient: string;
  isLarge: boolean; // amountUsd > $10K
  isDense: boolean; // part of 3+ withdrawals within 10 minutes
};

export type BridgeSecurityData = {
  tokens: BridgeTokenStatus[];
  withdrawals: BridgeWithdrawal[];
  withdrawalAlert: boolean;
  ethBridgeAddress: string;
  alphBridgeAddress: string;
  overallStatus: "healthy" | "warning" | "critical" | "unknown";
  ethDataAvailable: boolean;
  checkedAt: number;
};

async function fetchJSON<T>(
  url: string,
  timeoutMs = 8000,
): Promise<{ ok: boolean; data: T | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, data: null };
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    clearTimeout(timer);
    return { ok: false, data: null };
  }
}

// Fetch wrapped token total supply from the Alephium node contract state.
// For bridged tokens in this Wormhole fork, mutFields[0] is the U256 total supply.
async function fetchAlphTokenSupply(tokenId: string): Promise<string | null> {
  type ContractState = {
    mutFields: Array<{ type: string; value: string }>;
  };
  const result = await fetchJSON<ContractState>(
    `${ALPH_NODE}/contracts/${tokenId}/state`,
  );
  if (!result.ok || !result.data) return null;
  const first = result.data.mutFields?.[0];
  if (first?.type === "U256") return first.value;
  return null;
}

// Fetch Ethereum ERC-20 balance of an address via Etherscan
async function fetchEthTokenBalance(
  tokenAddress: string,
  holderAddress: string,
  apiKey: string,
): Promise<string | null> {
  type EtherscanBalance = { status: string; result: string };
  const url = `${ETHERSCAN_API}&module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${holderAddress}&tag=latest&apikey=${apiKey}`;
  const result = await fetchJSON<EtherscanBalance>(url);
  if (!result.ok || result.data?.status !== "1") return null;
  return result.data.result;
}

// Fetch token prices from Coingecko (free tier, no key needed)
async function fetchTokenPrices(
  ids: string[],
): Promise<Record<string, number>> {
  type CgPrices = Record<string, { usd: number }>;
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
  const result = await fetchJSON<CgPrices>(url, 10000);
  if (!result.ok || !result.data) return {};
  const prices: Record<string, number> = {};
  for (const [id, val] of Object.entries(result.data)) {
    if (val?.usd) prices[id] = val.usd;
  }
  return prices;
}

// Fetch recent outgoing ERC-20 transfers from the ETH bridge contract.
// Queries each token contract individually filtered to the bridge address —
// this is more reliable than querying the bridge address directly, which can
// be buried under incoming deposits in the generic tokentx endpoint.
async function fetchRecentWithdrawals(
  apiKey: string,
  prices: Record<string, number>,
): Promise<BridgeWithdrawal[]> {
  type EtherscanTx = {
    hash: string;
    timeStamp: string;
    from: string;
    to: string;
    contractAddress: string;
    value: string;
    tokenSymbol: string;
    tokenDecimal: string;
  };
  type EtherscanResponse = { status: string; result: EtherscanTx[] | string };

  const bridgeAddresses = new Set([
    ETH_BRIDGE_ADDRESS.toLowerCase(),
    ETH_BRIDGE_IMPL.toLowerCase(),
  ]);

  // Query each token contract sequentially — parallel calls exhaust the free-tier rate limit.
  const perTokenResults: EtherscanTx[][] = [];
  for (const token of BRIDGE_TOKENS) {
    const url = `${ETHERSCAN_API}&module=account&action=tokentx&contractaddress=${token.ethTokenAddress}&address=${ETH_BRIDGE_ADDRESS}&sort=desc&page=1&offset=20&apikey=${apiKey}`;
    const result = await fetchJSON<EtherscanResponse>(url, 12000);
    if (
      result.ok &&
      result.data?.status === "1" &&
      Array.isArray(result.data.result)
    ) {
      perTokenResults.push(result.data.result as EtherscanTx[]);
    } else {
      perTokenResults.push([]);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  // Merge, deduplicate, keep only outgoing (from == bridge)
  const seen = new Set<string>();
  const outgoing: EtherscanTx[] = [];
  for (const txns of perTokenResults) {
    for (const tx of txns) {
      if (seen.has(tx.hash)) continue;
      seen.add(tx.hash);
      if (bridgeAddresses.has(tx.from.toLowerCase())) {
        outgoing.push(tx);
      }
    }
  }

  outgoing.sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp));

  const tokenMap = new Map(
    BRIDGE_TOKENS.map((t) => [t.ethTokenAddress.toLowerCase(), t]),
  );

  const withdrawals: BridgeWithdrawal[] = outgoing.slice(0, 20).map((tx) => {
    const token = tokenMap.get(tx.contractAddress.toLowerCase());
    const decimals = token
      ? token.decimalsEth
      : parseInt(tx.tokenDecimal) || 18;
    const amount = Number(BigInt(tx.value)) / Math.pow(10, decimals);
    const symbol = token?.symbol ?? tx.tokenSymbol;
    const priceUsd = token ? (prices[token.coingeckoId] ?? null) : null;
    const amountUsd = priceUsd != null ? amount * priceUsd : null;

    return {
      txHash: tx.hash,
      timestamp: parseInt(tx.timeStamp) * 1000,
      token: symbol,
      amount,
      amountUsd,
      recipient: tx.to,
      isLarge: amountUsd != null ? amountUsd > 10_000 : false,
      isDense: false,
    };
  });

  // Dense detection: flag any withdrawal in a cluster of 3+ within 10 min
  const TEN_MIN_MS = 10 * 60 * 1000;
  for (let i = 0; i < withdrawals.length; i++) {
    const cluster = withdrawals.filter(
      (w) => Math.abs(w.timestamp - withdrawals[i].timestamp) <= TEN_MIN_MS,
    );
    if (cluster.length >= 3) withdrawals[i].isDense = true;
  }

  return withdrawals;
}

function classifyDiscrepancy(
  pct: number | null,
): "healthy" | "warning" | "critical" | "unknown" {
  if (pct === null) return "unknown";
  if (pct >= DISCREPANCY_CRITICAL_PCT) return "critical";
  if (pct >= DISCREPANCY_WARNING_PCT) return "warning";
  return "healthy";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BridgeSecurityData | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const etherscanKey = process.env.ETHERSCAN_API_KEY ?? "";
  const ethDataAvailable = etherscanKey.length > 0;

  // Phase 1: fetch prices + all Alephium supplies in parallel (no rate limits)
  const coingeckoIds = BRIDGE_TOKENS.map((t) => t.coingeckoId);
  const [prices, alphSupplies] = await Promise.all([
    fetchTokenPrices(coingeckoIds),
    Promise.all(BRIDGE_TOKENS.map((t) => fetchAlphTokenSupply(t.alphTokenId))),
  ]);

  // Phase 2: fetch ETH locked balances sequentially — Etherscan free tier is 5 req/s,
  // staggering by 250ms keeps us safely under the limit across all calls in this handler.
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const ethLockedRaws: (string | null)[] = [];
  if (ethDataAvailable) {
    for (const token of BRIDGE_TOKENS) {
      ethLockedRaws.push(
        await fetchEthTokenBalance(
          token.ethTokenAddress,
          ETH_BRIDGE_ADDRESS,
          etherscanKey,
        ),
      );
      await delay(250);
    }
  } else {
    ethLockedRaws.push(...BRIDGE_TOKENS.map(() => null));
  }

  // Phase 3: fetch withdrawals (also uses Etherscan — runs after phase 2)
  const withdrawals = ethDataAvailable
    ? await fetchRecentWithdrawals(etherscanKey, prices)
    : [];

  // Build token status rows from already-fetched data
  const tokenData: BridgeTokenStatus[] = BRIDGE_TOKENS.map((token, i) => {
    const alphSupplyRaw = alphSupplies[i];
    const ethLockedRaw = ethLockedRaws[i];
    const priceUsd = prices[token.coingeckoId] ?? null;

    const alphSupply =
      alphSupplyRaw != null
        ? Number(BigInt(alphSupplyRaw)) / Math.pow(10, token.decimalsAlph)
        : null;

    const ethLocked =
      ethLockedRaw != null
        ? Number(BigInt(ethLockedRaw)) / Math.pow(10, token.decimalsEth)
        : null;

    const alphSupplyUsd =
      alphSupply != null && priceUsd != null ? alphSupply * priceUsd : null;
    const ethLockedUsd =
      ethLocked != null && priceUsd != null ? ethLocked * priceUsd : null;

    let discrepancyPct: number | null = null;
    if (alphSupply !== null && ethLocked !== null && ethLocked > 0) {
      discrepancyPct = ((alphSupply - ethLocked) / ethLocked) * 100;
    } else if (alphSupply !== null && ethLocked === 0 && alphSupply > 0) {
      discrepancyPct = 100;
    }

    return {
      symbol: token.symbol,
      alphTokenId: token.alphTokenId,
      alphSupplyRaw,
      alphSupply,
      alphSupplyUsd,
      ethLockedRaw,
      ethLocked,
      ethLockedUsd,
      discrepancyPct,
      status: classifyDiscrepancy(discrepancyPct),
      priceUsd,
    };
  });

  const tokens = tokenData;
  const withdrawalAlert = withdrawals.some((w) => w.isDense && w.isLarge);

  const overallStatus: "healthy" | "warning" | "critical" | "unknown" =
    tokens.some((t) => t.status === "critical")
      ? "critical"
      : tokens.some((t) => t.status === "warning")
        ? "warning"
        : tokens.every((t) => t.status === "unknown")
          ? "unknown"
          : "healthy";

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    tokens,
    withdrawals,
    withdrawalAlert,
    ethBridgeAddress: ETH_BRIDGE_ADDRESS,
    alphBridgeAddress: ALPH_BRIDGE_ADDRESS,
    overallStatus,
    ethDataAvailable,
    checkedAt: Date.now(),
  });
}
