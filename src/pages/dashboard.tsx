import Layout from "../components/Layout";
import { useEffect, useState, useCallback } from "react";
import type { DashboardStats } from "./api/dashboard-stats";

const POLL_INTERVAL_MS = 5 * 60_000; // 5 minutes (matches CDN cache)

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatAlph(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatCount(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatBlockTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatHashrate(hs: number): string {
  if (hs >= 1e18) return `${(hs / 1e18).toFixed(2)} EH/s`;
  if (hs >= 1e15) return `${(hs / 1e15).toFixed(2)} PH/s`;
  if (hs >= 1e12) return `${(hs / 1e12).toFixed(2)} TH/s`;
  if (hs >= 1e9) return `${(hs / 1e9).toFixed(2)} GH/s`;
  return `${hs.toFixed(0)} H/s`;
}

function formatBps(bps: number): string {
  return `${bps.toFixed(2)} blocks/s`;
}

function formatPrice(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

function formatFee(alph: number): string {
  if (alph < 0.0001) return `${(alph * 1e6).toFixed(2)} μALPH`;
  return `${alph.toFixed(6)} ALPH`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── StatCard ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | null;
  sub?: string;
  loading: boolean;
  tbc?: boolean; // show "TBC" badge instead of N/A
}

function StatCard({ label, value, sub, loading, tbc }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-6 flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
        {label}
      </p>
      {loading ? (
        <div className="h-8 w-28 bg-smoked-white dark:bg-white/5 rounded animate-pulse" />
      ) : tbc ? (
        <p className="text-xl font-bold text-light-charcoal dark:text-white/40 font-mono">
          TBC
        </p>
      ) : (
        <p className="text-3xl font-bold text-black dark:text-white font-mono">
          {value ?? "N/A"}
        </p>
      )}
      {sub && (
        <p className="text-xs text-light-charcoal dark:text-white/40">{sub}</p>
      )}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-3">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard-stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DashboardStats = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Derived display values
  const circulatingPct =
    data?.circulatingAlph != null && data?.totalAlph != null
      ? `${((data.circulatingAlph / data.totalAlph) * 100).toFixed(1)}% of total`
      : undefined;

  const lockedPct =
    data?.lockedAlph != null && data?.circulatingAlph != null
      ? `${((data.lockedAlph / data.circulatingAlph) * 100).toFixed(1)}% of circulating · In smart contracts`
      : "In smart contracts";

  return (
    <Layout
      title="Alephium Dashboard"
      description="Public dashboard for Alephium — TVL, active addresses, supply, transactions, and ecosystem stats."
      canonical="https://alph.land/dashboard"
    >
      <div className="container max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Alephium Dashboard
          </h1>
          <p className="text-sm text-light-charcoal dark:text-white/50 mt-1">
            Public ecosystem metrics — refreshes every 5 minutes
          </p>
          {lastUpdated && (
            <p className="text-xs text-light-charcoal dark:text-white/40 mt-2">
              Last updated: {formatTime(lastUpdated.getTime())}
            </p>
          )}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-10 text-danger-red mb-6">
            <p className="font-semibold">Unable to fetch stats</p>
            <p className="text-sm opacity-70 mt-1">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 text-sm underline text-orange hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {/* Section 1: Chain Metrics */}
        <Section title="Chain Metrics">
          <StatCard
            label="Total Transactions"
            value={
              data?.totalTransactions != null
                ? formatCount(data.totalTransactions)
                : null
            }
            sub="All-time · Alephium explorer"
            loading={loading}
          />
          <StatCard
            label="Avg Block Time"
            value={
              data?.avgBlockTimeMs != null
                ? formatBlockTime(data.avgBlockTimeMs)
                : null
            }
            sub="Average across all 16 shards"
            loading={loading}
          />
          <StatCard
            label="Hashrate"
            value={
              data?.hashrate != null ? formatHashrate(data.hashrate) : null
            }
            sub="Latest hourly · Alephium explorer"
            loading={loading}
          />
          <StatCard
            label="Blocks per Second"
            value={
              data?.blocksPerSecond != null
                ? formatBps(data.blocksPerSecond)
                : null
            }
            sub="Across all 16 shards"
            loading={loading}
          />
          <StatCard
            label="Avg Tx Fee"
            value={
              data?.avgTxFeeAlph != null ? formatFee(data.avgTxFeeAlph) : null
            }
            sub="User transactions · 15-min sample"
            loading={loading}
          />
        </Section>

        {/* Section 2: Tokenomics */}
        <Section title="Tokenomics">
          <StatCard
            label="ALPH Price"
            value={data?.alphPrice != null ? formatPrice(data.alphPrice) : null}
            sub="Source: DIA Data"
            loading={loading}
          />
          <StatCard
            label="Market Cap"
            value={data?.marketCap != null ? formatUsd(data.marketCap) : null}
            sub="Price × Circulating supply"
            loading={loading}
          />
          <StatCard
            label="FDV"
            value={data?.fdv != null ? formatUsd(data.fdv) : null}
            sub="Price × Total supply"
            loading={loading}
          />
          <StatCard
            label="Circulating Supply"
            value={
              data?.circulatingAlph != null
                ? formatAlph(data.circulatingAlph)
                : null
            }
            sub={circulatingPct ?? "ALPH"}
            loading={loading}
          />
          <StatCard
            label="Total Supply"
            value={data?.totalAlph != null ? formatAlph(data.totalAlph) : null}
            sub="ALPH"
            loading={loading}
          />
          <StatCard
            label="Burned ALPH (24h)"
            value={
              data?.burnedAlph24h != null
                ? formatAlph(data.burnedAlph24h)
                : null
            }
            sub="Est. from tx fees · 15-min sample"
            loading={loading}
          />
          <StatCard
            label="Staked ALPH"
            value={null}
            sub="% of circulating · Powfi"
            loading={loading}
            tbc
          />
          <StatCard
            label="Locked ALPH"
            value={
              data?.lockedAlph != null ? formatAlph(data.lockedAlph) : null
            }
            sub={lockedPct}
            loading={loading}
          />
        </Section>

        {/* Section 3: Adoption */}
        <Section title="Adoption">
          <StatCard
            label="Total Value Locked"
            value={data?.tvlUsd != null ? formatUsd(data.tvlUsd) : null}
            sub="Source: DeFi Llama"
            loading={loading}
          />
          <StatCard
            label="DEX Volume (24h)"
            value={
              data?.dexVolume24h != null ? formatUsd(data.dexVolume24h) : null
            }
            sub="Source: DeFi Llama"
            loading={loading}
          />
          <StatCard
            label="dApps"
            value={data != null ? String(data.dappCount) : null}
            sub="DeFi · NFTs · Games · Quests · Social"
            loading={loading}
          />
          <StatCard
            label="Weekly Active Addresses"
            value={
              data?.activeAddresses7d != null
                ? formatCount(data.activeAddresses7d)
                : null
            }
            sub="Unique senders · last 7 days"
            loading={loading}
          />
          <StatCard
            label="Monthly Active Addresses"
            value={
              data?.activeAddresses30d != null
                ? formatCount(data.activeAddresses30d)
                : null
            }
            sub="Unique senders · last 30 days"
            loading={loading}
          />
        </Section>

        {/* Footer */}
        <p className="text-xs text-center text-light-charcoal dark:text-white/30 mt-10">
          Supply & chain data from{" "}
          <a
            href="https://backend.mainnet.alephium.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            Alephium explorer API
          </a>
          {" · "}TVL & DEX volume from{" "}
          <a
            href="https://defillama.com/chain/Alephium"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            DeFi Llama
          </a>
          {" · "}Fee data from{" "}
          <a
            href="https://fees.notrustverify.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            notrustverify
          </a>
        </p>
      </div>
    </Layout>
  );
}
