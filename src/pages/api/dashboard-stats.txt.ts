import type { NextApiRequest, NextApiResponse } from "next";
import { fetchDashboardStats } from "../../lib/dashboard-stats-fetcher";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const d = await fetchDashboardStats(process.env.INTERNAL_SECRET);

  const lines = [
    `# Alephium Dashboard — ${new Date(d.checkedAt).toUTCString()}`,
    ``,
    `## Price & Market`,
    `price_usd: ${d.alphPrice ?? "n/a"}`,
    `market_cap_usd: ${d.marketCap ?? "n/a"}`,
    `fdv_usd: ${d.fdv ?? "n/a"}`,
    `tvl_usd: ${d.tvlUsd ?? "n/a"}`,
    `dex_volume_24h_usd: ${d.dexVolume24h ?? "n/a"}`,
    ``,
    `## Supply`,
    `total_alph: ${d.totalAlph ?? "n/a"}`,
    `circulating_alph: ${d.circulatingAlph ?? "n/a"}`,
    `locked_alph: ${d.lockedAlph ?? "n/a"}`,
    `reserved_alph: ${d.reservedAlph ?? "n/a"}`,
    `burned_alph_24h: ${d.burnedAlph24h ?? "n/a"}`,
    ``,
    `## Chain`,
    `total_transactions: ${d.totalTransactions ?? "n/a"}`,
    `avg_block_time_ms: ${d.avgBlockTimeMs ?? "n/a"}`,
    `blocks_per_second: ${d.blocksPerSecond ?? "n/a"}`,
    `hashrate_hs: ${d.hashrate ?? "n/a"}`,
    `avg_tx_fee_alph: ${d.avgTxFeeAlph ?? "n/a"}`,
    ``,
    `## Adoption`,
    `dapp_count: ${d.dappCount}`,
    `active_addresses_7d: ${d.activeAddresses7d ?? "n/a"}`,
    `active_addresses_30d: ${d.activeAddresses30d ?? "n/a"}`,
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  res.status(200).send(lines);
}
