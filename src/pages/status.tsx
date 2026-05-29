import Layout from "../components/Layout";
import { useEffect, useState, useCallback } from "react";

const POLL_INTERVAL_MS = 30_000;

// ── Types matching the worker response ──────────────────────────────────────
type ServiceStatus = {
  name: string;
  up: boolean;
  latency: number;
};

type ChainStatus = {
  fromGroup: number;
  toGroup: number;
  lastBlockTimestamp: number | null;
  secondsSinceBlock: number | null;
  delayed: boolean;
};

type HashrateInfo = {
  currentHps: number;
  currentFormatted: string;
  trend1h: number | null;
  trend24h: number | null;
  trendDirection: "up" | "down" | "stable" | null;
};

type AlertItem = {
  id: string;
  type:
    | "block_delay"
    | "explorer_sync_lag"
    | "hashrate_anomaly"
    | "service_down";
  message: string;
  severity: "warning" | "critical";
};

type NetworkStatusData = {
  services: ServiceStatus[];
  hashrate: HashrateInfo;
  chains: ChainStatus[];
  alerts: AlertItem[];
  checkedAt: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}h ${rem}m`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PulseDot({ color }: { color: "green" | "red" | "yellow" }) {
  const colorMap = {
    green: "bg-accessible-green",
    red: "bg-danger-red",
    yellow: "bg-yellow-400",
  };
  return (
    <span className="relative flex h-3 w-3">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorMap[color]} opacity-60`}
      />
      <span
        className={`relative inline-flex h-3 w-3 rounded-full ${colorMap[color]}`}
      />
    </span>
  );
}

function ServiceCard({ svc }: { svc: ServiceStatus }) {
  return (
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <PulseDot color={svc.up ? "green" : "red"} />
        <div className="min-w-0">
          <p className="font-semibold text-black dark:text-white text-sm truncate">
            {svc.name}
          </p>
          <p
            className={`text-xs mt-0.5 ${svc.up ? "text-accessible-green" : "text-danger-red"}`}
          >
            {svc.up ? "Operational" : "Unreachable"}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-xs bg-smoked-white dark:bg-white/5 text-light-charcoal dark:text-white/50 px-2 py-0.5 rounded-full font-mono">
          {svc.latency}ms
        </span>
      </div>
    </div>
  );
}

function TrendBadge({
  pct,
  label,
  threshold,
}: {
  pct: number | null;
  label: string;
  threshold: number;
}) {
  if (pct === null) return null;
  const isAlert = Math.abs(pct) >= threshold;
  const isUp = pct > 0;
  const color = isAlert
    ? isUp
      ? "text-orange"
      : "text-danger-red"
    : "text-light-charcoal dark:text-white/50";
  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs font-mono font-medium ${color}`}>
        {pct > 0 ? "+" : ""}
        {pct.toFixed(1)}%
      </span>
      <span className="text-[10px] text-light-charcoal dark:text-white/30">
        {label}
      </span>
    </div>
  );
}

function HashrateCard({ hr }: { hr: HashrateInfo }) {
  const arrow =
    hr.trendDirection === "up" ? "↑" : hr.trendDirection === "down" ? "↓" : "→";
  const arrowColor =
    hr.trendDirection === "up"
      ? "text-accessible-green"
      : hr.trendDirection === "down"
        ? "text-danger-red"
        : "text-light-charcoal";

  return (
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-5">
      <p className="text-xs text-light-charcoal dark:text-white/50 uppercase tracking-wider mb-2">
        Network Hashrate
      </p>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-black dark:text-white font-mono">
          {hr.currentFormatted}
        </span>
        <span className={`text-lg font-semibold ${arrowColor}`}>{arrow}</span>
      </div>
      <div className="flex gap-4">
        <TrendBadge pct={hr.trend1h} label="vs 1h ago" threshold={5} />
        <TrendBadge pct={hr.trend24h} label="vs 24h ago" threshold={15} />
      </div>
    </div>
  );
}

function ChainGrid({
  chains,
  alerts,
}: {
  chains: ChainStatus[];
  alerts: AlertItem[];
}) {
  return (
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-5">
      <p className="text-xs text-light-charcoal dark:text-white/50 uppercase tracking-wider mb-4">
        Time From Last Block — All 16 Chains
      </p>
      <div className="grid grid-cols-5 gap-1 mb-2">
        <div className="text-center text-[10px] text-light-charcoal dark:text-white/30">
          ↓ From \ To →
        </div>
        {[0, 1, 2, 3].map((g) => (
          <div
            key={g}
            className="text-center text-[10px] font-mono text-light-charcoal dark:text-white/40"
          >
            G{g}
          </div>
        ))}
      </div>
      {[0, 1, 2, 3].map((from) => (
        <div key={from} className="grid grid-cols-5 gap-1 mb-1">
          <div className="flex items-center justify-center">
            <span className="text-[10px] font-mono text-light-charcoal dark:text-white/40">
              G{from}
            </span>
          </div>
          {[0, 1, 2, 3].map((to) => {
            const chain = chains.find(
              (c) => c.fromGroup === from && c.toGroup === to,
            );
            if (!chain) return <div key={to} />;
            const isDelayed = chain.delayed;
            const isUnknown = chain.secondsSinceBlock === null;
            const isExplorerLag = alerts.some(
              (a) =>
                a.type === "explorer_sync_lag" &&
                a.id === `explorer_sync_lag_${from}_${to}`,
            );
            const bgColor =
              isDelayed && !isExplorerLag
                ? "bg-danger-red/10 border-danger-red/40 text-danger-red"
                : isDelayed || isUnknown
                  ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-500 dark:text-yellow-400"
                  : "bg-accessible-green/10 border-accessible-green/40 text-accessible-green";
            const label =
              chain.secondsSinceBlock !== null
                ? formatDuration(chain.secondsSinceBlock)
                : "?";
            const tooltip = isExplorerLag
              ? `Explorer sync lag — node has a recent block`
              : chain.lastBlockTimestamp
                ? `Last block: ${formatTime(chain.lastBlockTimestamp)}`
                : "No recent block found";
            return (
              <div
                key={to}
                className={`rounded-md border text-center py-1.5 px-1 ${bgColor}`}
                title={tooltip}
              >
                <span className="text-[11px] font-mono font-medium leading-none block">
                  {label}
                </span>
                {isExplorerLag && (
                  <span className="text-[9px] leading-none block opacity-70">
                    sync lag
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <p className="text-[10px] text-light-charcoal dark:text-white/30 mt-3">
        Rows = chainFrom, Columns = chainTo. Red = block delay, Yellow =
        explorer sync lag or unknown
      </p>
    </div>
  );
}

function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            alert.severity === "critical"
              ? "bg-danger-red/5 border-danger-red/30 text-danger-red"
              : "bg-yellow-400/5 border-yellow-400/30 text-yellow-600 dark:text-yellow-400"
          }`}
        >
          <span className="text-lg leading-none mt-0.5">
            {alert.severity === "critical" ? "🚨" : "⚠️"}
          </span>
          <div>
            <p className="text-sm font-semibold capitalize">
              {alert.type.replace(/_/g, " ")}
            </p>
            <p className="text-xs mt-0.5 opacity-80">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Overall status badge ──────────────────────────────────────────────────────
function OverallStatusBadge({ data }: { data: NetworkStatusData }) {
  const hasCritical = data.alerts.some((a) => a.severity === "critical");
  const hasWarning = data.alerts.some((a) => a.severity === "warning");
  const allUp = data.services.every((s) => s.up);

  if (hasCritical || !allUp) {
    return (
      <div className="flex items-center gap-2 bg-danger-red/10 border border-danger-red/30 text-danger-red px-4 py-2 rounded-full">
        <PulseDot color="red" />
        <span className="text-sm font-semibold">Service Disruption</span>
      </div>
    );
  }
  if (hasWarning) {
    return (
      <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-full">
        <PulseDot color="yellow" />
        <span className="text-sm font-semibold">Partial Degradation</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-accessible-green/10 border border-accessible-green/30 text-accessible-green px-4 py-2 rounded-full">
      <PulseDot color="green" />
      <span className="text-sm font-semibold">All Systems Operational</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StatusPage() {
  const [data, setData] = useState<NetworkStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/network-status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: NetworkStatusData = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <Layout
      title="Network Status"
      description="Real-time Alephium network status — public node health, explorer backend, hashrate, and per-chain block times."
      canonical="https://alph.land/status"
    >
      <div className="container max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">
                Alephium Network Status
              </h1>
              <p className="text-sm text-light-charcoal dark:text-white/50 mt-1">
                Auto-refreshes every 30 seconds
              </p>
            </div>
            {data && <OverallStatusBadge data={data} />}
          </div>
          {lastUpdated && (
            <p className="text-xs text-light-charcoal dark:text-white/40 mt-3">
              Last checked: {formatTime(lastUpdated.getTime())}
            </p>
          )}
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="text-center py-20 text-light-charcoal dark:text-white/40">
            <div className="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mb-3" />
            <p>Checking network status…</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-10 text-danger-red">
            <p className="font-semibold">Unable to fetch status</p>
            <p className="text-sm opacity-70 mt-1">{error}</p>
            <button
              onClick={fetchStatus}
              className="mt-4 text-sm underline text-orange hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Active Alerts */}
            {data.alerts.length > 0 && <AlertBanner alerts={data.alerts} />}

            {/* Mainnet Services */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-3">
                Services
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.services
                  .filter((s) => !s.name.toLowerCase().includes("testnet"))
                  .map((svc) => (
                    <ServiceCard key={svc.name} svc={svc} />
                  ))}
              </div>
            </section>

            {/* Hashrate */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-3">
                Metrics
              </h2>
              <HashrateCard hr={data.hashrate} />
            </section>

            {/* Chain Grid */}
            <section>
              <ChainGrid chains={data.chains} alerts={data.alerts} />
            </section>

            {/* Testnet Services */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-3">
                Testnet
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.services
                  .filter((s) => s.name.toLowerCase().includes("testnet"))
                  .map((svc) => (
                    <ServiceCard key={svc.name} svc={svc} />
                  ))}
              </div>
            </section>

            {/* Footer note */}
            <p className="text-xs text-center text-light-charcoal dark:text-white/30 pt-2">
              Data sourced from Alephium public mainnet node &amp; explorer.
              Alerts are pushed to Slack when anomalies are detected.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
