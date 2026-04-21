import React, { useEffect, useState } from "react";
import Image from "next/image";
import Layout from "../components/Layout";
import { useDarkMode } from "../hooks/useDarkMode";
import type { TokenMarketData } from "./api/eco-market-data";
import type { OHLCVCandle } from "./api/eco-ohlcv";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKENS = [
  {
    name: "Alephium",
    symbol: "ALPH",
    address: "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq",
    color: "#02A697",
    logo: "/alephium-logo-round.png",
  },
  {
    name: "Ayin",
    symbol: "AYIN",
    address: "vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy",
    color: "#FF6B35",
    logo: null,
  },
  {
    name: "AlphPad",
    symbol: "APAD",
    address: "27HxXZJBTPjhHXwoF1Ue8sLMcSxYdxefoN2U6d8TKmZsm",
    color: "#6C5CE7",
    logo: "/dapps/alphpad/alphpad-logo.webp",
  },
  {
    name: "AlphBanX",
    symbol: "ABX",
    address: "258k9T6WqezTLdfGvHixXzK1yLATeSPuyhtcxzQ3V2pqV",
    color: "#ff5d51",
    logo: "/dapps/alphbanx/alphbanx-logo.webp",
  },
  {
    name: "Elexium",
    symbol: "EX",
    address: "28LgMeQGdvtXfsvWhpNNVx1DoSiz7TzrATv9qxMQP5is9",
    color: "#00B894",
    logo: "/dapps/elexium/elexium-logo.webp",
  },
  {
    name: "RalphBuilder",
    symbol: "BUILD",
    address: "27Pb61qBV1L168Nb8oEvVmy7m6K8sSGK9RRSngMxkuKpb",
    color: "#E17055",
    logo: "/dapps/ralphbuilder/ralphbuilder-logo.webp",
  },
  {
    name: "Aura",
    symbol: "AURA",
    address: "ywWQo64HBSMXcv3XBLrm8WjY2Co43BpYJPB3YoSDd4xX",
    color: "#A29BFE",
    logo: "/dapps/aura/logo.webp",
  },
  {
    name: "MyOnion.fun",
    symbol: "$ONION",
    address: "25yXCxAdnzMgHFVyF963hEYKGzt8hVQtqUXkoKGQKmcNs",
    color: "#55EFC4",
    logo: "/dapps/myonion/myonion-logo.webp",
  },
  {
    name: "Its 404ver",
    symbol: "TOP",
    address: "utDzMDHq8fygNzqZjCgRjhJbj1Rew14ExohxngeRKA1D",
    color: "#74B9FF",
    logo: null,
  },
];

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: 0 },
] as const;

type RangeLabel = (typeof RANGES)[number]["label"];
type Period = "24H" | "7D" | "30D";

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatPrice(v: number): string {
  if (v === 0) return "$0";
  if (v >= 1000)
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  if (v >= 0.0001) return `$${v.toFixed(6)}`;
  return `$${v.toExponential(3)}`;
}

function formatUsd(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function formatPct(v: number): string {
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

function formatDate(ts: number, days: number): string {
  const d = new Date(ts);
  if (days > 0 && days <= 30)
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

// ─── Candlestick shape ────────────────────────────────────────────────────────

function CandleShape(props: any) {
  const { x, y, width, height, payload } = props;
  if (!payload || width <= 0 || height <= 0) return null;

  const { open, high, low, close } = payload as OHLCVCandle;
  const range = high - low;
  const isGreen = close >= open;
  const color = isGreen ? "#00B894" : "#ff5d51";
  const cx = x + width / 2;

  if (range === 0) {
    return (
      <line
        x1={cx}
        y1={y}
        x2={cx}
        y2={y + height}
        stroke={color}
        strokeWidth={2}
      />
    );
  }

  const openPx = y + (height * (high - open)) / range;
  const closePx = y + (height * (high - close)) / range;
  const bodyTop = Math.min(openPx, closePx);
  const bodyH = Math.max(1, Math.abs(closePx - openPx));
  const bodyW = Math.max(2, width * 0.6);
  const bodyX = x + (width - bodyW) / 2;

  return (
    <g>
      <line
        x1={cx}
        y1={y}
        x2={cx}
        y2={bodyTop}
        stroke={color}
        strokeWidth={1}
      />
      <rect x={bodyX} y={bodyTop} width={bodyW} height={bodyH} fill={color} />
      <line
        x1={cx}
        y1={bodyTop + bodyH}
        x2={cx}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
}

function CandleTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d: OHLCVCandle = payload[0].payload;
  const isGreen = d.close >= d.open;
  return (
    <div className="bg-black/90 text-white rounded-lg px-3 py-2 text-xs font-mono shadow-lg">
      <div className="text-white/50 mb-1">
        {new Date(d.ts).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-white/50">O</span>
        <span>{formatPrice(d.open)}</span>
        <span className="text-white/50">H</span>
        <span className="text-accessible-green">{formatPrice(d.high)}</span>
        <span className="text-white/50">L</span>
        <span className="text-orange">{formatPrice(d.low)}</span>
        <span className="text-white/50">C</span>
        <span className={isGreen ? "text-accessible-green" : "text-orange"}>
          {formatPrice(d.close)}
        </span>
      </div>
      {d.volume > 0 && (
        <div className="mt-1 text-white/50">Vol {formatUsd(d.volume)}</div>
      )}
    </div>
  );
}

// ─── Stats panel ──────────────────────────────────────────────────────────────

function StatItem({
  label,
  value,
  positive,
}: {
  label: string;
  value: string | null;
  positive?: boolean | null;
}) {
  const cls =
    positive === true
      ? "text-accessible-green"
      : positive === false
        ? "text-orange"
        : "text-black dark:text-white";
  return (
    <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-white/10 rounded-lg px-3 py-2.5">
      <p className="text-xs text-light-charcoal dark:text-white/40 mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-semibold font-mono ${cls}`}>{value ?? "—"}</p>
    </div>
  );
}

function StatsPanel({ token }: { token: TokenMarketData }) {
  const pos = (v: number | null) => (v == null ? null : v >= 0);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 mb-3">
        Market Stats
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        <StatItem
          label="Market Cap"
          value={token.market_cap != null ? formatUsd(token.market_cap) : null}
        />
        <StatItem
          label="Liquidity"
          value={token.liquidity != null ? formatUsd(token.liquidity) : null}
        />
        <StatItem
          label="Vol 24h"
          value={token.volume != null ? formatUsd(token.volume) : null}
        />
        <StatItem
          label="Vol 7d"
          value={token.volume_7d != null ? formatUsd(token.volume_7d) : null}
        />
        <StatItem
          label="Change 24h"
          value={
            token.price_change_24h != null
              ? formatPct(token.price_change_24h)
              : null
          }
          positive={pos(token.price_change_24h)}
        />
        <StatItem
          label="Change 7d"
          value={
            token.price_change_7d != null
              ? formatPct(token.price_change_7d)
              : null
          }
          positive={pos(token.price_change_7d)}
        />
        <StatItem
          label="Change 30d"
          value={
            token.price_change_1m != null
              ? formatPct(token.price_change_1m)
              : null
          }
          positive={pos(token.price_change_1m)}
        />
        <StatItem
          label="Change 1y"
          value={
            token.price_change_1y != null
              ? formatPct(token.price_change_1y)
              : null
          }
          positive={pos(token.price_change_1y)}
        />
        <StatItem
          label="ATH"
          value={token.ath != null ? formatPrice(token.ath) : null}
        />
        <StatItem
          label="ATL"
          value={token.atl != null ? formatPrice(token.atl) : null}
        />
        {token.rank != null && (
          <StatItem label="Rank" value={`#${token.rank}`} />
        )}
      </div>
    </div>
  );
}

// ─── Expanded chart + stats panel ────────────────────────────────────────────

interface ChartPanelProps {
  token: TokenMarketData;
  color: string;
  candles: OHLCVCandle[];
  loading: boolean;
  fetchedAt: number | null;
  range: RangeLabel;
  onRangeChange: (r: RangeLabel) => void;
  isDark: boolean;
}

function ChartPanel({
  token,
  color,
  candles,
  loading,
  fetchedAt,
  range,
  onRangeChange,
  isDark,
}: ChartPanelProps) {
  const tickColor = isDark ? "#8F8D8C" : "#5c5b59";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const rangeObj = RANGES.find((r) => r.label === range)!;

  return (
    <div className="px-4 lg:px-6 py-5 bg-smoked-white dark:bg-white/[0.02] border-t border-border-grey dark:border-white/10">
      {/* Range selector + timestamp */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: color }}
          />
          <span className="text-sm font-semibold text-black dark:text-white">
            {token.name}
          </span>
          {token.price != null && (
            <span className="text-sm font-mono text-light-charcoal dark:text-white/50">
              {formatPrice(token.price)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={(e) => {
                  e.stopPropagation();
                  onRangeChange(r.label);
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  range === r.label
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-white dark:bg-light-black border border-border-grey dark:border-white/10 text-light-charcoal dark:text-lightgrey hover:border-clay"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {fetchedAt && (
            <span className="text-xs text-light-charcoal dark:text-white/30">
              Updated{" "}
              {new Date(fetchedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Candlestick chart */}
      <div className="h-64 mb-5">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-clay border-t-transparent rounded-full animate-spin" />
          </div>
        ) : candles.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={candles}
              margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            >
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
                minTickGap={60}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={formatPrice}
                tick={{ fontSize: 9, fill: tickColor }}
                tickLine={false}
                axisLine={false}
                width={60}
                orientation="right"
              />
              <Tooltip
                content={<CandleTooltip />}
                cursor={{ stroke: gridColor, strokeWidth: 1 }}
              />
              <Bar
                dataKey={(d: OHLCVCandle) => [d.low, d.high]}
                shape={<CandleShape />}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-light-charcoal dark:text-white/40">
            No chart data available
          </div>
        )}
      </div>

      {/* Market stats */}
      <StatsPanel token={token} />
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ prices, color }: { prices: number[]; color: string }) {
  if (prices.length < 2) return <div className="w-20 h-8" />;
  const W = 80,
    H = 32,
    pad = 2;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices
    .map((p, i) => {
      const x = pad + (i / (prices.length - 1)) * (W - 2 * pad);
      const y = H - pad - ((p - min) / range) * (H - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EcoTokenExplorer() {
  const [marketTokens, setMarketTokens] = useState<TokenMarketData[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [expandedAddress, setExpanded] = useState<string | null>(null);
  const [candles, setCandles] = useState<OHLCVCandle[]>([]);
  const [loadingOHLCV, setLoadingOHLCV] = useState(false);
  const [chartRange, setChartRange] = useState<RangeLabel>("30D");
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>("24H");
  const [query, setQuery] = useState("");
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const { currentTheme } = useDarkMode();
  const isDark = currentTheme === "dark";

  // Load market data once
  useEffect(() => {
    fetch("/api/eco-market-data")
      .then((r) => r.json())
      .then((json) => {
        setMarketTokens(json.tokens ?? []);
        setLoadingMarket(false);
      })
      .catch(() => setLoadingMarket(false));
  }, []);

  // Fetch sparkline data for all tokens when period changes
  useEffect(() => {
    const ms =
      period === "24H"
        ? 24 * 3600_000
        : period === "7D"
          ? 7 * 24 * 3600_000
          : 30 * 24 * 3600_000;
    const fromMs = Date.now() - ms;

    Promise.all(
      TOKENS.map(({ address }) =>
        fetch(`/api/eco-price-history?address=${address}&from=${fromMs}`)
          .then((r) => r.json())
          .then((json) => {
            const ph: [number, number][] = json?.data?.price_history ?? [];
            return { address, prices: ph.map(([, p]) => p) };
          })
          .catch(() => ({ address, prices: [] as number[] })),
      ),
    ).then((results) => {
      const map: Record<string, number[]> = {};
      results.forEach(({ address, prices }) => {
        map[address] = prices;
      });
      setSparklines(map);
    });
  }, [period]);

  // Fetch OHLCV whenever expanded token or chart range changes
  useEffect(() => {
    if (!expandedAddress) return;
    setLoadingOHLCV(true);
    setCandles([]);

    const rangeObj = RANGES.find((r) => r.label === chartRange)!;
    const params = new URLSearchParams({ address: expandedAddress });
    if (rangeObj.days > 0) {
      params.set("from", String(Date.now() - rangeObj.days * 24 * 3600_000));
    }

    fetch(`/api/eco-ohlcv?${params}`)
      .then((r) => r.json())
      .then((json) => {
        setCandles(json.candles ?? []);
        setFetchedAt(json.fetchedAt ?? null);
        setLoadingOHLCV(false);
      })
      .catch(() => setLoadingOHLCV(false));
  }, [expandedAddress, chartRange]);

  function handleRowClick(address: string) {
    setExpanded(address === expandedAddress ? null : address);
  }

  function getPeriodChange(token: TokenMarketData): number | null {
    if (period === "24H") return token.price_change_24h;
    if (period === "7D") return token.price_change_7d;
    return token.price_change_1m;
  }

  const filtered = query.trim()
    ? marketTokens.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.symbol.toLowerCase().includes(query.toLowerCase()),
      )
    : marketTokens;

  const displayTokens: TokenMarketData[] = !loadingMarket
    ? filtered
    : TOKENS.map((t) => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        price: null,
        market_cap: null,
        liquidity: null,
        volume: null,
        volume_7d: null,
        price_change_24h: null,
        price_change_7d: null,
        price_change_1m: null,
        price_change_1y: null,
        rank: null,
        ath: null,
        atl: null,
      }));

  return (
    <Layout
      title="Eco Token Explorer"
      description="Market data and price charts for Alephium ecosystem tokens."
    >
      <div className="container max-w-7xl mx-auto px-4 py-8 mb-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Eco Token Explorer
          </h1>
          <p className="mt-1 text-sm text-light-charcoal dark:text-white/50">
            Market data and price charts for Alephium ecosystem tokens
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          {/* Search */}
          <div className="relative">
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
              className="pl-9 pr-8 py-2 text-sm rounded-lg border border-border-grey dark:border-dark-charcoal bg-white dark:bg-hero-dark text-black dark:text-white placeholder-light-charcoal focus:outline-none focus:ring-1 focus:ring-clay w-56"
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

          {/* Period toggle */}
          <div className="flex rounded-lg border border-border-grey dark:border-dark-charcoal overflow-hidden">
            {(["24H", "7D", "30D"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                  period === p
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-white dark:bg-hero-dark text-light-charcoal dark:text-white/50 hover:bg-smoked-white dark:hover:bg-white/5"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="border border-border-grey dark:border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-smoked-white dark:bg-white/[0.03] border-b border-border-grey dark:border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40 w-10">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
                    Token
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
                    {period}
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
                    Mkt Cap
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
                    Liquidity
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
                    Vol 24h
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-light-charcoal dark:text-white/40">
                    {period} Chart
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {loadingMarket
                  ? Array.from({ length: 9 }).map((_, i) => (
                      <tr
                        key={i}
                        className="border-b border-border-grey dark:border-white/5"
                      >
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 bg-smoked-white dark:bg-white/5 rounded animate-pulse" />
                          </td>
                        ))}
                        <td />
                      </tr>
                    ))
                  : displayTokens.map((token, idx) => {
                      const meta = TOKENS.find(
                        (t) => t.address === token.address,
                      );
                      if (!meta) return null;
                      const pctVal = getPeriodChange(token);
                      const isExpanded = expandedAddress === token.address;

                      return (
                        <React.Fragment key={token.address}>
                          <tr
                            onClick={() => handleRowClick(token.address)}
                            className={`border-b border-border-grey dark:border-white/5 cursor-pointer transition-colors hover:bg-smoked-white dark:hover:bg-white/5 ${
                              isExpanded
                                ? "bg-smoked-white dark:bg-white/5"
                                : ""
                            }`}
                          >
                            {/* Rank */}
                            <td className="px-4 py-4 text-sm text-light-charcoal dark:text-white/40 w-10">
                              {token.rank ?? idx + 1}
                            </td>

                            {/* Token */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {meta.logo ? (
                                  <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                                    <Image
                                      src={meta.logo}
                                      alt={meta.name}
                                      width={32}
                                      height={32}
                                      className="rounded-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <span
                                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                                    style={{ background: meta.color }}
                                  >
                                    {meta.symbol
                                      .replace("$", "")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-black dark:text-white leading-tight">
                                    {meta.name}
                                  </div>
                                  <div className="text-xs text-light-charcoal dark:text-white/40">
                                    {meta.symbol}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="px-4 py-4 text-right font-mono text-sm text-black dark:text-white">
                              {token.price != null
                                ? formatPrice(token.price)
                                : "—"}
                            </td>

                            {/* Period % */}
                            <td
                              className={`px-4 py-4 text-right text-sm font-medium ${
                                pctVal == null
                                  ? "text-light-charcoal dark:text-white/40"
                                  : pctVal >= 0
                                    ? "text-accessible-green"
                                    : "text-orange"
                              }`}
                            >
                              {pctVal != null ? formatPct(pctVal) : "—"}
                            </td>

                            {/* Mkt Cap */}
                            <td className="hidden sm:table-cell px-4 py-4 text-right text-sm font-mono text-black dark:text-white">
                              {token.market_cap != null
                                ? formatUsd(token.market_cap)
                                : "—"}
                            </td>

                            {/* Liquidity */}
                            <td className="hidden md:table-cell px-4 py-4 text-right text-sm font-mono text-black dark:text-white">
                              {token.liquidity != null
                                ? formatUsd(token.liquidity)
                                : "—"}
                            </td>

                            {/* Vol 24h */}
                            <td className="hidden md:table-cell px-4 py-4 text-right text-sm font-mono text-black dark:text-white">
                              {token.volume != null
                                ? formatUsd(token.volume)
                                : "—"}
                            </td>

                            {/* Sparkline */}
                            <td className="hidden lg:table-cell px-4 py-4 text-right">
                              {(() => {
                                const prices = sparklines[token.address];
                                if (!prices || prices.length < 2) {
                                  return (
                                    <div className="w-20 h-8 ml-auto bg-smoked-white dark:bg-white/5 rounded animate-pulse" />
                                  );
                                }
                                const isUp =
                                  prices[prices.length - 1] >= prices[0];
                                return (
                                  <div className="flex justify-end">
                                    <Sparkline
                                      prices={prices}
                                      color={isUp ? "#00B894" : "#ff5d51"}
                                    />
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Chevron */}
                            <td className="px-3 py-4 text-center">
                              <svg
                                className={`w-4 h-4 text-light-charcoal dark:text-white/40 transition-transform duration-200 mx-auto ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </td>
                          </tr>

                          {/* Expanded row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="p-0">
                                <ChartPanel
                                  token={token}
                                  color={meta.color}
                                  candles={candles}
                                  loading={loadingOHLCV}
                                  fetchedAt={fetchedAt}
                                  range={chartRange}
                                  onRangeChange={setChartRange}
                                  isDark={isDark}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {!loadingMarket && displayTokens.length === 0 && (
            <div className="py-16 text-center text-sm text-light-charcoal dark:text-white/40">
              No tokens found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-light-charcoal dark:text-white/30">
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
