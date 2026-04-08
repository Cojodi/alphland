import Layout from "../components/Layout";
import { useEffect, useState, useCallback } from "react";
import type { DashboardStats } from "./api/dashboard-stats";

const POLL_INTERVAL_MS = 5 * 60_000;

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatUsd(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function formatAlph(v: number, decimals = 2): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(decimals)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(decimals)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(decimals)}K`;
  return v.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function formatCount(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toLocaleString();
}

function formatHashrate(hs: number): { num: string; unit: string } {
  if (hs >= 1e18) return { num: (hs / 1e18).toFixed(2), unit: "EH/s" };
  if (hs >= 1e15) return { num: (hs / 1e15).toFixed(2), unit: "PH/s" };
  if (hs >= 1e12) return { num: (hs / 1e12).toFixed(2), unit: "TH/s" };
  if (hs >= 1e9) return { num: (hs / 1e9).toFixed(2), unit: "GH/s" };
  return { num: hs.toFixed(0), unit: "H/s" };
}

function formatPrice(v: number): string {
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

function formatFee(alph: number): string {
  if (alph === 0) return "0 ALPH";
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

function pct(part: number, whole: number): string {
  if (!whole) return "0%";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

// ─── Supply Ring (pure SVG donut) ────────────────────────────────────────────

const SUPPLY_COLORS = {
  circulating: "#ff5d51",
  locked: "#60a5fa",
  reserved: "#9ca3af",
};

interface RingSegment {
  value: number;
  color: string;
}

function SupplyRing({
  segments,
  total,
}: {
  segments: RingSegment[];
  total: number;
}) {
  const R = 55;
  const CX = 75;
  const CY = 75;
  const SW = 14;
  const C = 2 * Math.PI * R;
  const GAP = 3;

  if (!total) return null;

  let cumulative = 0;

  return (
    <svg
      width="150"
      height="150"
      viewBox="0 0 150 150"
      className="flex-shrink-0"
    >
      {/* background track */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth={SW}
        className="text-border-grey dark:text-white/5"
      />
      {segments.map((seg, i) => {
        const fraction = seg.value / total;
        const draw = Math.max(0, fraction * C - GAP);
        const space = C - draw;
        const rotation = (cumulative / total) * 360 - 90;
        cumulative += seg.value;
        if (draw <= 0) return null;
        return (
          <circle
            key={i}
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={SW}
            strokeDasharray={`${draw} ${space}`}
            transform={`rotate(${rotation} ${CX} ${CY})`}
          />
        );
      })}
    </svg>
  );
}

// ─── Supply breakdown row ─────────────────────────────────────────────────────

function SupplyRow({
  label,
  value,
  total,
  color,
  loading,
}: {
  label: string;
  value: number | null;
  total: number | null;
  color: string;
  loading: boolean;
}) {
  const fraction = value != null && total ? Math.min(1, value / total) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-xs text-light-charcoal dark:text-white/50">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          {label}
        </span>
        {loading ? (
          <span className="h-3 w-16 bg-smoked-white dark:bg-white/5 rounded animate-pulse inline-block" />
        ) : (
          <span className="text-xs font-mono font-semibold text-black dark:text-white">
            {value != null ? formatAlph(value) : "—"}
            {value != null && total ? (
              <span className="text-light-charcoal dark:text-white/40 font-normal ml-1">
                {pct(value, total)}
              </span>
            ) : null}
          </span>
        )}
      </div>
      <div className="h-1 rounded-full bg-smoked-white dark:bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${fraction * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Supply Card ─────────────────────────────────────────────────────────────

function SupplyCard({
  data,
  loading,
}: {
  data: DashboardStats | null;
  loading: boolean;
}) {
  const { circulatingAlph, lockedAlph, reservedAlph, totalAlph } = data ?? {};

  const segments: RingSegment[] = [
    { value: circulatingAlph ?? 0, color: SUPPLY_COLORS.circulating },
    { value: lockedAlph ?? 0, color: SUPPLY_COLORS.locked },
    { value: reservedAlph ?? 0, color: SUPPLY_COLORS.reserved },
  ];

  return (
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-5">
        Supply
      </p>
      <div className="flex items-center gap-6">
        {/* Ring chart */}
        <div className="relative flex-shrink-0">
          {loading || !totalAlph ? (
            <div className="w-[150px] h-[150px] rounded-full bg-smoked-white dark:bg-white/5 animate-pulse" />
          ) : (
            <>
              <SupplyRing segments={segments} total={totalAlph} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-light-charcoal dark:text-white/40 uppercase tracking-wider">
                  Total
                </span>
                <span className="text-sm font-bold text-black dark:text-white font-mono">
                  {formatAlph(totalAlph, 1)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-3 min-w-0">
          <SupplyRow
            label="Circulating"
            value={circulatingAlph ?? null}
            total={totalAlph ?? null}
            color={SUPPLY_COLORS.circulating}
            loading={loading}
          />
          <SupplyRow
            label="Locked (contracts)"
            value={lockedAlph ?? null}
            total={totalAlph ?? null}
            color={SUPPLY_COLORS.locked}
            loading={loading}
          />
          <SupplyRow
            label="Reserved"
            value={reservedAlph ?? null}
            total={totalAlph ?? null}
            color={SUPPLY_COLORS.reserved}
            loading={loading}
          />
          {!loading && circulatingAlph != null && totalAlph != null && (
            <p className="text-xs text-light-charcoal dark:text-white/40 pt-1">
              {pct(circulatingAlph, totalAlph)} is circulating
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | null;
  unit?: string;
  sub?: string;
  loading: boolean;
  tbc?: boolean;
  accent?: boolean;
}

function StatCard({
  label,
  value,
  unit,
  sub,
  loading,
  tbc,
  accent,
}: StatCardProps) {
  return (
    <div
      className={`bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-5 flex flex-col gap-1${
        accent ? " border-l-[3px] border-l-orange" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
        {label}
      </p>
      <div className="mt-1">
        {loading ? (
          <div className="h-7 w-28 bg-smoked-white dark:bg-white/5 rounded animate-pulse" />
        ) : tbc ? (
          <span className="text-lg font-bold text-light-charcoal dark:text-white/30 font-mono">
            TBC
          </span>
        ) : (
          <p className="text-2xl font-bold text-black dark:text-white font-mono leading-tight">
            {value ?? "N/A"}
          </p>
        )}
        {unit && !loading && !tbc && (
          <p className="text-sm text-light-charcoal dark:text-white/40 mt-0.5">
            {unit}
          </p>
        )}
      </div>
      {sub && (
        <p className="text-xs text-light-charcoal dark:text-white/30 mt-1">
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Hero Card (top row) ──────────────────────────────────────────────────────

function HeroCard({
  label,
  primary,
  secondary,
  loading,
}: {
  label: string;
  primary: string | null;
  secondary?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-2">
        {label}
      </p>
      {loading ? (
        <div className="h-7 w-24 bg-smoked-white dark:bg-white/5 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-black dark:text-white font-mono">
          {primary ?? "N/A"}
        </p>
      )}
      {secondary && !loading && (
        <p className="text-xs text-light-charcoal dark:text-white/40 mt-1">
          {secondary}
        </p>
      )}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
  cols = 4,
}: {
  title: string;
  children: React.ReactNode;
  cols?: 3 | 4 | 5;
}) {
  const colClass =
    cols === 5
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
      : cols === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="mb-10">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-3">
        {title}
      </h2>
      <div className={`grid ${colClass} gap-4`}>{children}</div>
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

  const hr = data?.hashrate != null ? formatHashrate(data.hashrate) : null;

  return (
    <Layout
      title="Alephium Dashboard"
      description="Public dashboard for Alephium — TVL, active addresses, supply, transactions, and ecosystem stats."
      canonical="https://alph.land/dashboard"
    >
      <div className="container max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Alephium Dashboard
            </h1>
            <p className="text-sm text-light-charcoal dark:text-white/50 mt-1">
              Public ecosystem metrics
            </p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-light-charcoal dark:text-white/40 bg-smoked-white dark:bg-white/5 px-3 py-1.5 rounded-full">
              Last updated: {formatTime(lastUpdated.getTime())}
            </span>
          )}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-8 text-danger-red mb-6 border border-danger-red/20 rounded-xl">
            <p className="font-semibold">Unable to fetch stats</p>
            <p className="text-sm opacity-70 mt-1">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-3 text-sm underline hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Price / Market hero ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <HeroCard
            label="ALPH Price"
            primary={
              data?.alphPrice != null ? formatPrice(data.alphPrice) : null
            }
            secondary="Source: DIA Data"
            loading={loading}
          />
          <HeroCard
            label="Market Cap"
            primary={data?.marketCap != null ? formatUsd(data.marketCap) : null}
            secondary={
              data?.circulatingAlph != null && data?.totalAlph != null
                ? `${pct(data.circulatingAlph, data.totalAlph)} circulating`
                : undefined
            }
            loading={loading}
          />
          <HeroCard
            label="FDV"
            primary={data?.fdv != null ? formatUsd(data.fdv) : null}
            secondary="Price × Total supply"
            loading={loading}
          />
          <HeroCard
            label="Total Value Locked"
            primary={data?.tvlUsd != null ? formatUsd(data.tvlUsd) : null}
            secondary="Source: DeFi Llama"
            loading={loading}
          />
        </div>

        {/* ── Chain Metrics ── */}
        <Section title="Chain Metrics" cols={5}>
          <StatCard
            label="Total Transactions"
            value={
              data?.totalTransactions != null
                ? formatCount(data.totalTransactions)
                : null
            }
            sub="All-time"
            loading={loading}
          />
          <StatCard
            label="Avg Block Time"
            value={
              data?.avgBlockTimeMs != null
                ? (data.avgBlockTimeMs / 1000).toFixed(1)
                : null
            }
            unit="seconds · of all shards"
            loading={loading}
          />
          <StatCard
            label="Hashrate"
            value={hr?.num ?? null}
            unit={hr?.unit}
            loading={loading}
          />
          <StatCard
            label="Blocks / Second"
            value={
              data?.blocksPerSecond != null
                ? data.blocksPerSecond.toFixed(2)
                : null
            }
            unit="blocks/s · 16 shards"
            loading={loading}
          />
          <StatCard
            label="Avg Tx Fee"
            value={
              data?.avgTxFeeAlph != null ? formatFee(data.avgTxFeeAlph) : null
            }
            sub="User txs · 15-min sample"
            loading={loading}
          />
        </Section>

        {/* ── Tokenomics ── */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-3">
            Tokenomics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Supply ring + breakdown */}
            <SupplyCard data={data} loading={loading} />

            {/* Burn / staked / locked / DEX vol */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Burned ALPH (24h)"
                value={
                  data?.burnedAlph24h != null
                    ? formatAlph(data.burnedAlph24h)
                    : null
                }
                unit="ALPH"
                sub="Est. from tx fees"
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
                unit={
                  data?.lockedAlph != null && data?.circulatingAlph != null
                    ? `${pct(data.lockedAlph, data.circulatingAlph)} of circulating`
                    : "ALPH"
                }
                sub="In smart contracts"
                loading={loading}
              />
              <StatCard
                label="DEX Volume (24h)"
                value={
                  data?.dexVolume24h != null
                    ? formatUsd(data.dexVolume24h)
                    : null
                }
                sub="Source: DeFi Llama"
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* ── Adoption ── */}
        <Section title="Adoption" cols={3}>
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
        <p className="text-xs text-center text-light-charcoal dark:text-white/30 mt-6">
          Chain data from{" "}
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
