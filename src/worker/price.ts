/**
 * ALPH/USD price feed.
 *
 * Single source of truth for the USD side of every bounty amount. Bounties
 * store token amounts; USD is always derived from a snapshot of this rate,
 * never typed in by hand.
 *
 * The rate is refreshed once a day at 08:00 Europe/Berlin. The worker's cron
 * fires hourly, so the scheduled handler calls maybeRefreshDailyPrice() every
 * hour and this module decides whether it is actually time to fetch.
 */

type D1Database = any;

interface PriceEnv {
  DB: D1Database;
  COINGECKO_API_KEY?: string;
}

export type AlphPriceSource = "coinpaprika" | "coingecko" | "mexc";

/** Row stored in indexer_state under key 'alph_usd_price'. */
export interface AlphPrice {
  /** USD per 1 ALPH. */
  usd: number;
  /** When we fetched it (unix seconds). */
  fetched_at: number;
  /** The upstream's own last-updated time (unix seconds), if it provides one. */
  source_updated_at: number | null;
  /** Berlin-local date of the run that wrote this row, 'YYYY-MM-DD'. */
  run_date: string;
  /** Which upstream actually answered — sources are tried in order. */
  source: AlphPriceSource;
}

const STATE_KEY = "alph_usd_price";

/**
 * Every request needs a descriptive User-Agent. Workers' fetch() sends none by
 * default, and CoinGecko answers anonymous requests with a 403 telling you so.
 */
const USER_AGENT = "alphland-price-bot (+https://alph.land)";

interface PriceSource {
  name: AlphPriceSource;
  url: string;
  /** Returns null when the body parsed but held no usable price. */
  parse(body: any): { usd: number; source_updated_at: number | null } | null;
}

/**
 * Keyless price sources, tried in order until one answers.
 *
 * Why a chain rather than one source with an API key: CoinGecko's keyless
 * tier rate-limits per client IP, and a Worker's egress IP is shared with
 * everyone else on that Cloudflare edge — so the quota is routinely spent by
 * strangers before our once-a-day call arrives, and no amount of retrying
 * fixes it. Every source here works without signup.
 *
 * CoinPaprika leads because it is the least contended of the aggregators;
 * CoinGecko stays as second so we still prefer it whenever it is reachable.
 * MEXC is a single venue quoting ALPH/USDT rather than a volume-weighted USD
 * aggregate, so it is last resort only — close enough to keep the site
 * working, not the number we would choose.
 */
const PRICE_SOURCES: PriceSource[] = [
  {
    name: "coinpaprika",
    url: "https://api.coinpaprika.com/v1/tickers/alph-alephium",
    parse: (b) => {
      const usd = b?.quotes?.USD?.price;
      if (typeof usd !== "number") return null;
      const t = Date.parse(b?.last_updated ?? "");
      return {
        usd,
        source_updated_at: Number.isFinite(t) ? Math.floor(t / 1000) : null,
      };
    },
  },
  {
    name: "coingecko",
    url:
      "https://api.coingecko.com/api/v3/simple/price" +
      "?ids=alephium&vs_currencies=usd&include_last_updated_at=true",
    parse: (b) => {
      const usd = b?.alephium?.usd;
      if (typeof usd !== "number") return null;
      const t = b?.alephium?.last_updated_at;
      return { usd, source_updated_at: typeof t === "number" ? t : null };
    },
  },
  {
    name: "mexc",
    url: "https://api.mexc.com/api/v3/ticker/price?symbol=ALPHUSDT",
    parse: (b) => {
      const usd = Number(b?.price);
      return Number.isFinite(usd) ? { usd, source_updated_at: null } : null;
    },
  },
];

/** Hour of the Berlin day at which the daily refresh runs. */
export const REFRESH_HOUR_BERLIN = 8;

/**
 * Berlin-local date and hour for a given instant, DST-correct.
 *
 * Cloudflare cron schedules are UTC only, and Berlin is UTC+1 in winter but
 * UTC+2 in summer — so "08:00 Berlin" is not a fixed UTC hour. Rather than
 * schedule two crons and hope, we let the hourly cron fire and ask Intl what
 * the local wall-clock time actually is.
 */
export function berlinParts(at: Date = new Date()): {
  date: string;
  hour: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(at);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  // 'en-CA' gives ISO-ordered date parts; hour is 00-23 because hour12: false.
  // Intl can emit "24" for midnight in some ICU versions — normalise it.
  const hour = Number(get("hour")) % 24;

  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour };
}

/** Read the cached rate. Returns null if we have never fetched one. */
export async function getAlphPrice(env: PriceEnv): Promise<AlphPrice | null> {
  const row = (await env.DB.prepare(
    `SELECT value FROM indexer_state WHERE key = ?`,
  )
    .bind(STATE_KEY)
    .first()) as { value: string } | null;

  if (!row?.value) return null;

  try {
    const parsed = JSON.parse(row.value) as AlphPrice;
    return Number.isFinite(parsed?.usd) && parsed.usd > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Fetch the current ALPH/USD rate, trying each keyless source in turn.
 *
 * Only throws when every source failed, and then the message carries all of
 * their errors — one upstream being down looks nothing like all of them being
 * down, and the difference decides whether anyone needs to act.
 */
export async function fetchAlphPrice(env: PriceEnv): Promise<{
  usd: number;
  source_updated_at: number | null;
  source: AlphPriceSource;
}> {
  const failures: string[] = [];

  for (const src of PRICE_SOURCES) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    };
    // Harmless on the other sources' requests, so only sent where it means
    // something. A demo key raises CoinGecko's limit if one is ever set.
    if (src.name === "coingecko" && env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = env.COINGECKO_API_KEY;
    }

    try {
      const res = await fetch(src.url, { headers });

      if (!res.ok) {
        // Include the body: upstreams say why they refused, and a bare status
        // makes a policy rejection look identical to an IP block.
        const detail = (await res.text()).slice(0, 200);
        failures.push(`${src.name} ${res.status}: ${detail}`);
        continue;
      }

      const parsed = src.parse(await res.json());
      if (!parsed || !Number.isFinite(parsed.usd) || parsed.usd <= 0) {
        failures.push(`${src.name}: no usable price in response`);
        continue;
      }

      if (failures.length > 0) {
        console.warn(
          `[price] fell back to ${src.name}: ${failures.join("; ")}`,
        );
      }
      return { ...parsed, source: src.name };
    } catch (err: any) {
      failures.push(`${src.name}: ${err?.message ?? err}`);
    }
  }

  throw new Error(`all price sources failed — ${failures.join("; ")}`);
}

/**
 * Fetch and persist the rate, unconditionally. Used by the daily job and by
 * the god-only manual refresh endpoint.
 */
export async function refreshAlphPrice(
  env: PriceEnv,
  runDate: string = berlinParts().date,
): Promise<AlphPrice> {
  const { usd, source_updated_at, source } = await fetchAlphPrice(env);

  const record: AlphPrice = {
    usd,
    fetched_at: Math.floor(Date.now() / 1000),
    source_updated_at,
    run_date: runDate,
    source,
  };

  await env.DB.prepare(
    `INSERT INTO indexer_state (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  )
    .bind(STATE_KEY, JSON.stringify(record))
    .run();

  return record;
}

export interface ResolvedReward {
  denomination: "alph" | "usd";
  /**
   * ALPH. Authoritative when denomination='alph', else derived.
   * Never null — bounties.reward_amount is NOT NULL.
   */
  reward_amount: number;
  /** USD. Authoritative when denomination='usd', else null. */
  target_usd: number | null;
  /** USD value of the whole bounty — comparable across denominations. */
  reward_usd: number | null;
  token_usd_at_valuation: number | null;
}

/**
 * Thrown when a USD-denominated reward cannot be converted because no rate
 * has been cached yet. Distinct from a validation error: the request is fine,
 * the server just cannot price it right now, so callers should answer 503.
 */
export class RateUnavailableError extends Error {
  constructor() {
    super(
      "ALPH price is temporarily unavailable, so a USD-denominated reward " +
        "cannot be converted. Retry shortly, or price the bounty in ALPH.",
    );
    this.name = "RateUnavailableError";
  }
}

/**
 * Turn a create/update request body into the reward columns.
 *
 * Callers send exactly one authoritative number:
 *   { denomination: 'alph', reward_amount: 500 }   -> "I pay 500 ALPH"
 *   { denomination: 'usd',  target_usd: 1000 }     -> "I pay $1000 worth"
 *
 * The other side is derived here from the cached rate. Throws a message
 * suitable for a 400 response on bad input.
 *
 * If no rate is cached yet, an ALPH-denominated reward still resolves — the
 * sponsor's own number is authoritative and reward_usd is simply left for the
 * next daily run to fill. A USD-denominated one cannot: reward_amount is NOT
 * NULL and there is no honest value to put in it, so this throws
 * RateUnavailableError for the caller to turn into a 503.
 */
export async function resolveRewardInput(
  env: PriceEnv,
  body: {
    denomination?: unknown;
    reward_amount?: unknown;
    target_usd?: unknown;
    /** Legacy field — see the compatibility note below. */
    reward_currency?: unknown;
  },
): Promise<ResolvedReward> {
  // Compatibility with the pre-025 client, which had no `denomination` and
  // instead signalled a USD-priced bounty with reward_currency='USD' while
  // putting the USD figure in reward_amount. Without this, a $100 bounty from
  // an old client would be stored as 100 ALPH (~$4). Drop once every deployed
  // client sends `denomination`.
  const legacyUsd =
    body.denomination === undefined &&
    typeof body.reward_currency === "string" &&
    body.reward_currency.toUpperCase() === "USD";

  const denomination =
    body.denomination === "usd" || legacyUsd ? "usd" : "alph";

  const raw =
    denomination === "usd"
      ? legacyUsd
        ? body.reward_amount // legacy clients put the USD figure here
        : body.target_usd
      : body.reward_amount;
  const field =
    denomination === "usd" && !legacyUsd ? "target_usd" : "reward_amount";

  const value = Number(raw ?? 0);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }

  const price = await getAlphPrice(env);
  const rate = price?.usd ?? null;

  if (denomination === "usd") {
    if (!rate) throw new RateUnavailableError();
    return {
      denomination,
      target_usd: value,
      reward_usd: value,
      reward_amount: value / rate,
      token_usd_at_valuation: rate,
    };
  }

  return {
    denomination,
    reward_amount: value,
    target_usd: null,
    reward_usd: rate ? value * rate : null,
    token_usd_at_valuation: rate,
  };
}

/**
 * Recompute the derived side of every bounty's reward at the given rate.
 *
 * bounties.reward_amount is always ALPH and bounties.reward_usd is always USD;
 * which of the two is authoritative depends on `denomination`:
 *
 *   denomination='alph' -> reward_amount is fixed, reward_usd  is derived
 *   denomination='usd'  -> target_usd    is fixed, reward_amount is derived
 *
 * Only bounties that can still pay out are touched. Once a bounty is closed,
 * completed or cancelled its figures are frozen, so historical totals stay
 * reproducible and do not drift with the ALPH price.
 */
export async function revalueBounties(
  env: PriceEnv,
  usd: number,
): Promise<number> {
  if (!Number.isFinite(usd) || usd <= 0) {
    throw new Error(`revalueBounties called with unusable rate: ${usd}`);
  }

  const now = Math.floor(Date.now() / 1000);

  const alphSide = await env.DB.prepare(
    `UPDATE bounties
        SET reward_usd = reward_amount * ?,
            token_usd_at_valuation = ?,
            valuation_updated_at = ?
      WHERE denomination = 'alph'
        AND status = 'open'
        AND reward_amount IS NOT NULL`,
  )
    .bind(usd, usd, now)
    .run();

  const usdSide = await env.DB.prepare(
    `UPDATE bounties
        SET reward_amount = target_usd / ?,
            reward_usd = target_usd,
            token_usd_at_valuation = ?,
            valuation_updated_at = ?
      WHERE denomination = 'usd'
        AND status = 'open'
        AND target_usd IS NOT NULL`,
  )
    .bind(usd, usd, now)
    .run();

  return (alphSide?.meta?.changes ?? 0) + (usdSide?.meta?.changes ?? 0);
}

/**
 * Called once per hour by the cron. Fetches when it is at or past 08:00 in
 * Berlin and we have not yet stored a rate for that Berlin date.
 *
 * Two consequences of the ">= 08:00, once per date" rule, both intended:
 *  - a double-delivered cron in the same hour will not re-fetch, because the
 *    first success already recorded today's date;
 *  - a failed 08:00 run retries at 09:00, 10:00, … instead of losing the whole
 *    day to one CoinGecko blip.
 *
 * Never throws: a price-feed outage must not break the address indexer that
 * shares this scheduled handler. The previous rate simply stays in place.
 */
export async function maybeRefreshDailyPrice(env: PriceEnv): Promise<void> {
  try {
    const { date, hour } = berlinParts();
    if (hour < REFRESH_HOUR_BERLIN) return;

    const existing = await getAlphPrice(env);
    if (existing?.run_date === date) return;

    const record = await refreshAlphPrice(env, date);
    // Log the hour we actually ran at, not the target — a value other than
    // 08 means an earlier attempt that day failed and this was a retry.
    console.log(
      `[price] ALPH/USD = ${record.usd} via ${record.source} (Berlin ${date} ${String(hour).padStart(2, "0")}:00)`,
    );

    // Revalue separately: if this fails we still keep the new rate, and the
    // next hourly run will not retry (today's date is already recorded), so
    // surface it loudly rather than silently serving stale bounty figures.
    try {
      const changed = await revalueBounties(env, record.usd);
      console.log(`[price] revalued ${changed} open bounties`);
    } catch (err: any) {
      console.error("[price] revaluation failed:", err?.message ?? err);
    }
  } catch (err: any) {
    // Keep serving the last known rate.
    console.error("[price] daily refresh failed:", err?.message ?? err);
  }
}
