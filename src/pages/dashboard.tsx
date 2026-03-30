import Layout from "../components/Layout";
import { useEffect, useState, useCallback } from "react";
import type { DashboardStats } from "./api/dashboard-stats";

const POLL_INTERVAL_MS = 24 * 60 * 60_000; // 24 hours

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatCount(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface StatCardProps {
  label: string;
  value: string | null;
  sub?: string;
  loading: boolean;
}

function StatCard({ label, value, sub, loading }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-6 flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
        {label}
      </p>
      {loading ? (
        <div className="h-8 w-28 bg-smoked-white dark:bg-white/5 rounded animate-pulse" />
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

  return (
    <Layout
      title="Alephium Dashboard"
      description="Public dashboard for Alephium — TVL, active addresses, and dApp ecosystem stats."
      canonical="https://alph.land/dashboard"
    >
      <div className="container max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">
                Alephium Dashboard
              </h1>
              <p className="text-sm text-light-charcoal dark:text-white/50 mt-1">
                Public ecosystem metrics — refreshes every 24 hours
              </p>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-xs text-light-charcoal dark:text-white/40 mt-3">
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

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Total Value Locked"
            value={data?.tvlUsd != null ? formatUsd(data.tvlUsd) : null}
            sub="Source: DeFi Llama"
            loading={loading}
          />
          <StatCard
            label="Listed dApps"
            value={data != null ? String(data.dappCount) : null}
            sub="Tracked on alph.land"
            loading={loading}
          />
          <StatCard
            label="Weekly Active Addresses"
            value={
              data?.activeAddresses7d != null
                ? formatCount(data.activeAddresses7d)
                : null
            }
            sub="Last 7 days · Alephium explorer"
            loading={loading}
          />
          <StatCard
            label="Monthly Active Addresses"
            value={
              data?.activeAddresses30d != null
                ? formatCount(data.activeAddresses30d)
                : null
            }
            sub="Last 30 days · Alephium explorer"
            loading={loading}
          />
        </div>

        {/* Footer note */}
        <p className="text-xs text-center text-light-charcoal dark:text-white/30 mt-10">
          TVL data from{" "}
          <a
            href="https://defillama.com/chain/Alephium"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            DeFi Llama
          </a>
          . Address data from the Alephium public explorer backend.
        </p>
      </div>
    </Layout>
  );
}
