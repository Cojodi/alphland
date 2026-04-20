import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useDarkMode } from "../hooks/useDarkMode";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ─── Token list (ETH/BTC/USDT/USDC excluded) ─────────────────────────────────

const TOKENS = [
  {
    name: "Alephium",
    symbol: "ALPH",
    address: "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq",
    color: "#02A697",
  },
  {
    name: "Ayin",
    symbol: "AYIN",
    address: "vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy",
    color: "#FF6B35",
  },
  {
    name: "AlphPad",
    symbol: "APAD",
    address: "27HxXZJBTPjhHXwoF1Ue8sLMcSxYdxefoN2U6d8TKmZsm",
    color: "#6C5CE7",
  },
  {
    name: "AlphBanX",
    symbol: "ABX",
    address: "258k9T6WqezTLdfGvHixXzK1yLATeSPuyhtcxzQ3V2pqV",
    color: "#ff5d51",
  },
  {
    name: "Elexium",
    symbol: "EX",
    address: "28LgMeQGdvtXfsvWhpNNVx1DoSiz7TzrATv9qxMQP5is9",
    color: "#00B894",
  },
  {
    name: "RalphBuilder",
    symbol: "BUILD",
    address: "27Pb61qBV1L168Nb8oEvVmy7m6K8sSGK9RRSngMxkuKpb",
    color: "#E17055",
  },
  {
    name: "Aura",
    symbol: "AURA",
    address: "ywWQo64HBSMXcv3XBLrm8WjY2Co43BpYJPB3YoSDd4xX",
    color: "#A29BFE",
  },
  {
    name: "MyOnion.fun",
    symbol: "$ONION",
    address: "25yXCxAdnzMgHFVyF963hEYKGzt8hVQtqUXkoKGQKmcNs",
    color: "#55EFC4",
  },
  {
    name: "Its 404ver",
    symbol: "TOP",
    address: "utDzMDHq8fygNzqZjCgRjhJbj1Rew14ExohxngeRKA1D",
    color: "#74B9FF",
  },
  {
    name: "DOGE on Alephium",
    symbol: "DOGE",
    address: "vL7HkW7FL2dwBDXZZaE1wVaiQzeAX9XgsaiApGb5afHZ",
    color: "#C8A951",
  },
];

// ─── Time range options ───────────────────────────────────────────────────────

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: 0 },
] as const;

type RangeLabel = (typeof RANGES)[number]["label"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(v: number): string {
  if (v === 0) return "$0";
  if (v >= 1000)
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  if (v >= 0.0001) return `$${v.toFixed(6)}`;
  return `$${v.toExponential(3)}`;
}

function formatDate(ts: number, days: number): string {
  const d = new Date(ts);
  if (days <= 30) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function pctChange(data: [number, number][]): string | null {
  if (data.length < 2) return null;
  const first = data[0][1];
  const last = data[data.length - 1][1];
  if (!first) return null;
  const pct = ((last - first) / first) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

// ─── Token card ───────────────────────────────────────────────────────────────

interface ChartPoint {
  ts: number;
  price: number;
}

interface TokenCardProps {
  token: (typeof TOKENS)[number];
  range: RangeLabel;
  isDark: boolean;
}

function TokenCard({ token, range, isDark }: TokenCardProps) {
  const [raw, setRaw] = useState<[number, number][]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "empty" | "error">(
    "loading",
  );

  useEffect(() => {
    setStatus("loading");
    setRaw([]);

    const rangeObj = RANGES.find((r) => r.label === range)!;
    const fromTs =
      rangeObj.days === 0
        ? undefined
        : Math.floor(Date.now() / 1000) - rangeObj.days * 86400;

    const params = new URLSearchParams({ address: token.address });
    if (fromTs) params.set("from", String(fromTs));

    fetch(`/api/eco-price-history?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        const history: [number, number][] = json?.data?.price_history ?? [];
        if (!history.length) {
          setStatus("empty");
        } else {
          setRaw(history);
          setStatus("ok");
        }
      })
      .catch(() => setStatus("error"));
  }, [token.address, range]);

  const rangeObj = RANGES.find((r) => r.label === range)!;
  const chartData: ChartPoint[] = raw.map(([ts, price]) => ({ ts, price }));
  const currentPrice = raw.length ? raw[raw.length - 1][1] : null;
  const change = pctChange(raw);
  const isPositive = change ? change.startsWith("+") : null;

  // Explicit colors for SVG elements — "currentColor" is unreliable in recharts
  const tickColor = isDark ? "#8F8D8C" : "#5c5b59";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tooltipBg = isDark ? "#1F1F1F" : "#333333";

  return (
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal rounded-xl p-4 flex flex-col gap-3 shadow-box-image-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-black dark:text-white text-sm">
            {token.name}
          </div>
          <div className="text-xs text-light-charcoal dark:text-lightgrey">
            {token.symbol}
          </div>
        </div>
        <div className="text-right">
          {currentPrice !== null ? (
            <>
              <div className="font-mono text-sm font-semibold text-black dark:text-white">
                {formatPrice(currentPrice)}
              </div>
              {change && (
                <div
                  className={`text-xs font-medium ${
                    isPositive ? "text-accessible-green" : "text-orange"
                  }`}
                >
                  {change}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-light-charcoal">—</div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-28">
        {status === "loading" && (
          <div className="h-full flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-clay border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {status === "empty" && (
          <div className="h-full flex items-center justify-center text-xs text-light-charcoal dark:text-lightgrey">
            No data available
          </div>
        )}
        {status === "error" && (
          <div className="h-full flex items-center justify-center text-xs text-orange">
            Failed to load
          </div>
        )}
        {status === "ok" && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`grad-${token.symbol}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={token.color}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={token.color}
                    stopOpacity={0.03}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="ts"
                type="number"
                domain={["auto", "auto"]}
                scale="time"
                tickFormatter={(ts) => formatDate(ts, rangeObj.days)}
                tick={{ fontSize: 9, fill: tickColor }}
                tickLine={false}
                axisLine={false}
                minTickGap={50}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={formatPrice}
                tick={{ fontSize: 9, fill: tickColor }}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#fff",
                }}
                labelFormatter={(ts) =>
                  new Date(ts as number).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                }
                formatter={(val) => [formatPrice(Number(val)), "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={token.color}
                strokeWidth={2}
                fill={`url(#grad-${token.symbol})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EcoTokenPriceChart() {
  const [range, setRange] = useState<RangeLabel>("30D");
  const [query, setQuery] = useState("");
  const { currentTheme } = useDarkMode();
  const isDark = currentTheme === "dark";

  const filteredTokens = query.trim()
    ? TOKENS.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.symbol.toLowerCase().includes(query.toLowerCase()),
      )
    : TOKENS;

  return (
    <Layout
      title="Eco Token Explorer"
      description="Price history charts for Alephium ecosystem tokens powered by Mobula."
    >
      <div className="container px-4 mx-auto mb-16 lg:mb-32 mt-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Eco Token Explorer
          </h1>
          <p className="mt-1 text-sm text-light-charcoal dark:text-lightgrey">
            Historical price data for Alephium ecosystem tokens
          </p>
        </div>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-charcoal pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search token..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-border-grey dark:border-dark-charcoal bg-white dark:bg-hero-dark text-black dark:text-white placeholder-light-charcoal focus:outline-none focus:ring-1 focus:ring-clay"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-light-charcoal hover:text-black dark:hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          {/* Range selector */}
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r.label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  range === r.label
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-smoked-white dark:bg-light-black text-light-charcoal dark:text-lightgrey hover:bg-border-grey dark:hover:bg-dark-charcoal"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Token grid */}
        {filteredTokens.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTokens.map((token) => (
              <TokenCard
                key={token.address}
                token={token}
                range={range}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-light-charcoal dark:text-lightgrey">
            No tokens found for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-light-charcoal dark:text-lightgrey">
          Data powered by{" "}
          <a
            href="https://mobula.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-black dark:hover:text-white"
          >
            Mobula
          </a>
        </p>
      </div>
    </Layout>
  );
}
