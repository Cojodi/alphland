import Layout from "../components/Layout";
import { useEffect, useRef, useState, useCallback } from "react";
import type { DashboardStats } from "./api/dashboard-stats";

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number | null, duration = 900): number | null {
  const [value, setValue] = useState<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (target === null) {
      setValue(null);
      return;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(eased * target);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
      else setValue(target);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

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

// ─── Live indicator ───────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accessible-green opacity-60" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-accessible-green" />
    </span>
  );
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

  // Only include segments with a non-zero value
  const active = segments.filter((s) => s.value > 0);
  const segTotal = active.reduce((sum, s) => sum + s.value, 0);
  if (!segTotal) return null;
  // Available pixels after reserving a GAP between each segment
  const available = C - active.length * GAP;
  // Natural proportional arc lengths — use segment sum, not the external total prop,
  // so proportions are always correct regardless of what totalAlph the API returns.
  const natural = active.map((s) => (s.value / segTotal) * available);
  // Boost any segment below MIN_ARC; subtract the excess from larger segments
  const MIN_ARC = 1;
  const smallBudget = natural.reduce(
    (sum, n) => (n < MIN_ARC ? sum + MIN_ARC : sum),
    0,
  );
  const largePropSum = natural.reduce(
    (sum, n) => (n >= MIN_ARC ? sum + n : sum),
    0,
  );
  const largeBudget = available - smallBudget;
  const draws = natural.map((n) =>
    n < MIN_ARC
      ? MIN_ARC
      : largePropSum > 0
        ? (n / largePropSum) * largeBudget
        : MIN_ARC,
  );
  // Compute rotations from visual positions (not value-proportional, avoids mutation-in-map issues)
  let pos = 0;
  const arcs = active.map((seg, i) => {
    const rotation = (pos / C) * 360 - 90;
    pos += draws[i] + GAP;
    return { color: seg.color, draw: draws[i], space: C - draws[i], rotation };
  });

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
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={arc.color}
          strokeWidth={SW}
          strokeDasharray={`${arc.draw} ${arc.space}`}
          transform={`rotate(${arc.rotation} ${CX} ${CY})`}
        />
      ))}
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
          style={{
            width:
              value != null && value > 0
                ? `max(3px, ${fraction * 100}%)`
                : "0%",
            background: color,
          }}
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
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
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
      className={`bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-5 flex flex-col gap-1 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200${
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
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl px-5 py-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
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

  // Count-up animations for key metrics
  const animPrice = useCountUp(data?.alphPrice ?? null, 800);
  const animMcap = useCountUp(data?.marketCap ?? null, 1100);
  const animFdv = useCountUp(data?.fdv ?? null, 1100);
  const animTvl = useCountUp(data?.tvlUsd ?? null, 900);
  const animTxs = useCountUp(data?.totalTransactions ?? null, 1400);
  const animHashrateRaw = useCountUp(data?.hashrate ?? null, 1000);
  const animHashrate =
    animHashrateRaw != null ? formatHashrate(animHashrateRaw) : null;
  const animBurned = useCountUp(data?.burnedAlph24h ?? null, 1000);
  const animDexVol = useCountUp(data?.dexVolume24h ?? null, 900);

  return (
    <Layout
      title="Alephium Dashboard"
      description="Public dashboard for Alephium — TVL, active addresses, supply, transactions, and ecosystem stats."
      canonical="https://alph.land/dashboard"
    >
      <div className="container max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4 animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Alephium Dashboard
            </h1>
            <p className="text-sm text-light-charcoal dark:text-white/50 mt-1">
              Public ecosystem metrics
            </p>
          </div>
          <div className="flex items-center gap-2 bg-smoked-white dark:bg-white/5 px-3 py-1.5 rounded-full">
            <LiveDot />
            <span className="text-xs text-light-charcoal dark:text-white/40">
              {lastUpdated
                ? `Updated ${formatTime(lastUpdated.getTime())}`
                : "Loading…"}
            </span>
          </div>
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
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          <HeroCard
            label="ALPH Price"
            primary={animPrice != null ? formatPrice(animPrice) : null}
            secondary="Source: DIA Data"
            loading={loading}
          />
          <HeroCard
            label="Market Cap"
            primary={animMcap != null ? formatUsd(animMcap) : null}
            secondary={
              data?.circulatingAlph != null && data?.totalAlph != null
                ? `${pct(data.circulatingAlph, data.totalAlph)} circulating`
                : undefined
            }
            loading={loading}
          />
          <HeroCard
            label="FDV"
            primary={animFdv != null ? formatUsd(animFdv) : null}
            secondary="Price × Total supply"
            loading={loading}
          />
          <HeroCard
            label="Total Value Locked"
            primary={animTvl != null ? formatUsd(animTvl) : null}
            secondary="Source: DeFi Llama"
            loading={loading}
          />
        </div>

        {/* ── Chain Metrics ── */}
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <Section title="Chain Metrics" cols={5}>
            <StatCard
              label="Total Transactions"
              value={animTxs != null ? formatCount(animTxs) : null}
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
              value={animHashrate?.num ?? null}
              unit={animHashrate?.unit ?? hr?.unit}
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
        </div>

        {/* ── Tokenomics ── */}
        <div
          className="mb-10 animate-fade-up"
          style={{ animationDelay: "180ms" }}
        >
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
                value={animBurned != null ? formatAlph(animBurned) : null}
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
                value={animDexVol != null ? formatUsd(animDexVol) : null}
                sub="Source: DeFi Llama"
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* ── Adoption ── */}
        <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
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
        </div>

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
