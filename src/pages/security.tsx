import Layout from "../components/Layout";
import { useEffect, useState, useCallback } from "react";
import type {
  BridgeSecurityData,
  BridgeTokenStatus,
  BridgeWithdrawal,
} from "./api/bridge-security";

const POLL_INTERVAL_MS = 60_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatUsd(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function formatAmount(v: number, decimals = 4): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PulseDot({ color }: { color: "green" | "red" | "yellow" | "grey" }) {
  const map = {
    green: "bg-accessible-green",
    red: "bg-danger-red",
    yellow: "bg-yellow-400",
    grey: "bg-light-charcoal dark:bg-white/30",
  };
  return (
    <span className="relative flex h-3 w-3 flex-shrink-0">
      {color !== "grey" && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${map[color]} opacity-60`}
        />
      )}
      <span
        className={`relative inline-flex h-3 w-3 rounded-full ${map[color]}`}
      />
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: "healthy" | "warning" | "critical" | "unknown";
}) {
  const configs = {
    healthy: {
      dot: "green" as const,
      bg: "bg-accessible-green/10 border-accessible-green/30 text-accessible-green",
      label: "Healthy",
    },
    warning: {
      dot: "yellow" as const,
      bg: "bg-yellow-400/10 border-yellow-400/30 text-yellow-600 dark:text-yellow-400",
      label: "Warning",
    },
    critical: {
      dot: "red" as const,
      bg: "bg-danger-red/10 border-danger-red/30 text-danger-red",
      label: "Critical",
    },
    unknown: {
      dot: "grey" as const,
      bg: "bg-smoked-white dark:bg-white/5 border-border-grey dark:border-white/10 text-light-charcoal dark:text-white/40",
      label: "Unknown",
    },
  };
  const c = configs[status];
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.bg}`}
    >
      <PulseDot color={c.dot} />
      <span className="text-sm font-semibold">{c.label}</span>
    </div>
  );
}

function OverallBanner({ data }: { data: BridgeSecurityData }) {
  if (data.overallStatus === "critical") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl border bg-danger-red/5 border-danger-red/30 text-danger-red mb-6">
        <span className="text-xl leading-none mt-0.5">🚨</span>
        <div>
          <p className="text-sm font-bold">Critical Anomaly Detected</p>
          <p className="text-xs mt-0.5 opacity-80">
            Wrapped token supply significantly exceeds locked collateral. This
            may indicate unauthorized minting.
          </p>
        </div>
      </div>
    );
  }
  if (data.overallStatus === "warning") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl border bg-yellow-400/5 border-yellow-400/30 text-yellow-600 dark:text-yellow-400 mb-6">
        <span className="text-xl leading-none mt-0.5">⚠️</span>
        <div>
          <p className="text-sm font-bold">Supply Discrepancy Warning</p>
          <p className="text-xs mt-0.5 opacity-80">
            One or more wrapped token supplies are above the expected collateral
            threshold.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function Skeleton({ w = "w-20", h = "h-4" }: { w?: string; h?: string }) {
  return (
    <span
      className={`inline-block ${w} ${h} bg-smoked-white dark:bg-white/5 rounded animate-pulse`}
    />
  );
}

function TokenRow({
  token,
  loading,
  ethAvailable,
}: {
  token: BridgeTokenStatus;
  loading: boolean;
  ethAvailable: boolean;
}) {
  const statusColor = {
    healthy: "text-accessible-green",
    warning: "text-yellow-500 dark:text-yellow-400",
    critical: "text-danger-red",
    unknown: "text-light-charcoal dark:text-white/40",
  }[token.status];

  const statusIcon = {
    healthy: "✓",
    warning: "⚠",
    critical: "✕",
    unknown: "?",
  }[token.status];

  const rowBg =
    token.status === "critical"
      ? "border-danger-red/40 bg-danger-red/5"
      : token.status === "warning"
        ? "border-yellow-400/40 bg-yellow-400/5"
        : "border-border-grey dark:border-white/10";

  return (
    <div
      className={`rounded-xl border p-4 bg-white dark:bg-hero-dark transition-all ${rowBg}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-black dark:text-white font-mono">
            {token.symbol}
          </span>
          {!loading && token.status !== "unknown" && (
            <span className={`text-sm font-bold ${statusColor}`}>
              {statusIcon}
            </span>
          )}
        </div>
        {loading ? (
          <Skeleton w="w-20" h="h-5" />
        ) : token.alphSupplyUsd != null ? (
          <span className="text-xs font-mono text-light-charcoal dark:text-white/50">
            {formatUsd(token.alphSupplyUsd)} wrapped
          </span>
        ) : null}
      </div>

      <div
        className={`grid gap-3 text-xs ${ethAvailable ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Alephium side */}
        <div className="space-y-0.5">
          <p className="text-light-charcoal dark:text-white/40 uppercase tracking-wider text-[10px]">
            Alephium supply
          </p>
          {loading ? (
            <Skeleton w="w-24" />
          ) : token.alphSupply != null ? (
            <p className="font-mono font-semibold text-black dark:text-white">
              {formatAmount(token.alphSupply)}{" "}
              <span className="text-light-charcoal dark:text-white/40 font-normal">
                w{token.symbol}
              </span>
            </p>
          ) : (
            <p className="text-light-charcoal dark:text-white/30">—</p>
          )}
        </div>

        {/* Ethereum side — only shown when API key is configured */}
        {ethAvailable && (
          <div className="space-y-0.5">
            <p className="text-light-charcoal dark:text-white/40 uppercase tracking-wider text-[10px]">
              ETH locked
            </p>
            {loading ? (
              <Skeleton w="w-24" />
            ) : token.ethLocked != null ? (
              <p className="font-mono font-semibold text-black dark:text-white">
                {formatAmount(token.ethLocked)}{" "}
                <span className="text-light-charcoal dark:text-white/40 font-normal">
                  {token.symbol}
                </span>
              </p>
            ) : (
              <p className="text-light-charcoal dark:text-white/30">—</p>
            )}
          </div>
        )}
      </div>

      {/* Discrepancy bar */}
      {!loading && ethAvailable && token.discrepancyPct !== null && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-light-charcoal dark:text-white/40">
              Supply vs collateral
            </span>
            <span
              className={`text-[10px] font-mono font-semibold ${statusColor}`}
            >
              {token.discrepancyPct > 0 ? "+" : ""}
              {token.discrepancyPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-smoked-white dark:bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                token.status === "critical"
                  ? "bg-danger-red"
                  : token.status === "warning"
                    ? "bg-yellow-400"
                    : "bg-accessible-green"
              }`}
              style={{
                width: `${Math.min(100, Math.max(3, Math.abs(token.discrepancyPct)))}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function WithdrawalsSection({
  withdrawals,
  withdrawalAlert,
  ethDataAvailable,
}: {
  withdrawals: BridgeWithdrawal[];
  withdrawalAlert: boolean;
  ethDataAvailable: boolean;
}) {
  if (!ethDataAvailable) {
    return (
      <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-3">
          Recent Bridge Withdrawals
        </p>
        <div className="flex items-start gap-3 text-xs text-light-charcoal dark:text-white/50">
          <span className="text-base leading-none">ℹ️</span>
          <span>
            Requires{" "}
            <code className="font-mono bg-smoked-white dark:bg-white/5 px-1 rounded">
              ETHERSCAN_API_KEY
            </code>{" "}
            — add it to{" "}
            <code className="font-mono bg-smoked-white dark:bg-white/5 px-1 rounded">
              .env.local
            </code>{" "}
            to monitor outgoing transfers from the ETH bridge contract.
          </span>
        </div>
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-2">
          Recent Bridge Withdrawals
        </p>
        <p className="text-xs text-light-charcoal dark:text-white/30">
          No recent outgoing transfers found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Alert banner */}
      {withdrawalAlert && (
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-danger-red/5 border-danger-red/30 text-danger-red">
          <span className="text-xl leading-none mt-0.5">🚨</span>
          <div>
            <p className="text-sm font-bold">Suspicious Withdrawal Cluster</p>
            <p className="text-xs mt-0.5 opacity-80">
              Multiple large withdrawals detected within a 10-minute window —
              consistent with a bridge drain attack.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
              Recent Bridge Withdrawals
            </p>
            <p className="text-[10px] text-light-charcoal dark:text-white/30 mt-0.5">
              Last 20 outgoing ERC-20 transfers · no fixed time window
            </p>
          </div>
          <a
            href={`https://etherscan.io/address/0x579a3bDE631c3d8068CbFE3dc45B0F14EC18dD43#tokentxns`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-orange hover:underline"
          >
            View all on Etherscan ↗
          </a>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[80px_1fr_1fr_100px_60px] gap-2 px-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/30">
          <span>Time</span>
          <span>Amount</span>
          <span>Recipient</span>
          <span>Tx</span>
          <span className="text-right">Flags</span>
        </div>

        <div className="divide-y divide-border-grey dark:divide-white/5">
          {withdrawals.map((w) => {
            return (
              <div
                key={w.txHash}
                className={`grid grid-cols-[80px_1fr_1fr_100px_60px] gap-2 items-center px-5 py-2.5 text-xs transition-colors ${
                  w.isDense && w.isLarge
                    ? "bg-danger-red/5"
                    : w.isDense
                      ? "bg-yellow-400/5"
                      : w.isLarge
                        ? "bg-orange/5"
                        : "hover:bg-smoked-white dark:hover:bg-white/3"
                }`}
              >
                {/* Time */}
                <span className="text-light-charcoal dark:text-white/40 font-mono">
                  {timeAgo(w.timestamp)}
                </span>

                {/* Amount */}
                <div className="min-w-0">
                  <span className="font-mono font-semibold text-black dark:text-white">
                    {formatAmount(w.amount, 4)}{" "}
                    <span className="text-light-charcoal dark:text-white/40 font-normal">
                      {w.token}
                    </span>
                  </span>
                  {w.amountUsd != null && (
                    <span className="text-light-charcoal dark:text-white/40 ml-1.5">
                      {formatUsd(w.amountUsd)}
                    </span>
                  )}
                </div>

                {/* Recipient */}
                <a
                  href={`https://etherscan.io/address/${w.recipient}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-light-charcoal dark:text-white/50 hover:text-orange transition-colors truncate"
                >
                  {shortAddr(w.recipient)}
                </a>

                {/* Tx hash */}
                <a
                  href={`https://etherscan.io/tx/${w.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-light-charcoal dark:text-white/50 hover:text-orange transition-colors truncate"
                >
                  {shortAddr(w.txHash)}
                </a>

                {/* Flags */}
                <div className="flex gap-1 justify-end flex-wrap">
                  {w.isLarge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-orange/10 text-orange">
                      LARGE
                    </span>
                  )}
                  {w.isDense && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-danger-red/10 text-danger-red">
                      CLUSTER
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExplainerCard() {
  return (
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-3">
        How This Monitor Works
      </p>
      <div className="space-y-2 text-xs text-light-charcoal dark:text-white/60 leading-relaxed">
        <p>
          <span className="text-black dark:text-white font-semibold">
            Core invariant:{" "}
          </span>
          Wrapped tokens on Alephium should never exceed the collateral locked
          in the Ethereum bridge contract. A surplus means tokens were minted
          without a corresponding lock — the exact attack vector used in the
          2026-05-30 exploit.
        </p>
        <p>
          <span className="text-black dark:text-white font-semibold">
            Supply data{" "}
          </span>
          comes from the Alephium Node API — each wrapped token contract&apos;s{" "}
          <code className="font-mono bg-smoked-white dark:bg-white/5 px-1 rounded text-[10px]">
            mutFields[0]
          </code>{" "}
          holds the U256 total supply.
        </p>
        <p>
          <span className="text-black dark:text-white font-semibold">
            Collateral data{" "}
          </span>
          comes from Etherscan querying the ERC-20 balances held by the Ethereum
          bridge proxy{" "}
          <a
            href="https://etherscan.io/address/0x579a3bDE631c3d8068CbFE3dc45B0F14EC18dD43"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange hover:underline font-mono"
          >
            0x579a…dD43
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const [data, setData] = useState<BridgeSecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/bridge-security");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: BridgeSecurityData = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <Layout
      title="Bridge Security Monitor"
      description="Real-time Alephium TokenBridge security monitor — wrapped token supply vs locked collateral, guardian status, and incident history."
      canonical="https://alph.land/security"
    >
      <div className="container max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Bridge Security Monitor
            </h1>
            <p className="text-sm text-light-charcoal dark:text-white/50 mt-1">
              Alephium TokenBridge · supply vs collateral
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {data && data.overallStatus !== "unknown" && (
              <StatusBadge status={data.overallStatus} />
            )}
            <div className="flex items-center gap-2 bg-smoked-white dark:bg-white/5 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
              </span>
              <span className="text-xs text-light-charcoal dark:text-white/40">
                {lastUpdated
                  ? `Updated ${formatTime(lastUpdated.getTime())}`
                  : "Loading…"}
              </span>
            </div>
          </div>
        </div>

        {/* Active incident banner */}
        {data && <OverallBanner data={data} />}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-light-charcoal dark:text-white/40">
            <div className="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mb-3" />
            <p>Fetching bridge security data…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-10 border border-danger-red/20 rounded-xl text-danger-red mb-6">
            <p className="font-semibold">Unable to fetch security data</p>
            <p className="text-sm opacity-70 mt-1">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 text-sm underline hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && (
          <div className="space-y-8">
            {/* Token health grid */}
            <section className="animate-fade-up">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-3">
                Wrapped Token Supply Health
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(data?.tokens ?? placeholderTokens).map((token) => (
                  <TokenRow
                    key={token.symbol}
                    token={token}
                    loading={loading || !data}
                    ethAvailable={
                      data?.tokens.some((t) => t.ethLocked !== null) ?? false
                    }
                  />
                ))}
              </div>
            </section>

            {/* Withdrawals */}
            {data && (
              <section
                className="animate-fade-up"
                style={{ animationDelay: "60ms" }}
              >
                <WithdrawalsSection
                  withdrawals={data.withdrawals}
                  withdrawalAlert={data.withdrawalAlert}
                  ethDataAvailable={data.ethDataAvailable}
                />
              </section>
            )}

            {/* Explainer */}
            <section
              className="animate-fade-up"
              style={{ animationDelay: "180ms" }}
            >
              <ExplainerCard />
            </section>

            {/* Footer */}
            <p className="text-xs text-center text-light-charcoal dark:text-white/30">
              Supply data from{" "}
              <a
                href="https://node.mainnet.alephium.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                Alephium Node API
              </a>
              {" · "}Collateral data from{" "}
              <a
                href="https://etherscan.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                Etherscan
              </a>
              {" · "}Prices from{" "}
              <a
                href="https://coingecko.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                CoinGecko
              </a>
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Placeholder skeleton data while loading
const placeholderTokens: BridgeTokenStatus[] = [
  "USDT",
  "USDC",
  "WETH",
  "WBTC",
].map((symbol) => ({
  symbol,
  alphTokenId: "",
  alphSupplyRaw: null,
  alphSupply: null,
  alphSupplyUsd: null,
  ethLockedRaw: null,
  ethLocked: null,
  ethLockedUsd: null,
  discrepancyPct: null,
  status: "unknown" as const,
  priceUsd: null,
}));
