import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  berlinParts,
  fetchAlphPrice,
  getAlphPrice,
  maybeRefreshDailyPrice,
  refreshAlphPrice,
  resolveRewardInput,
  revalueBounties,
  RateUnavailableError,
  REFRESH_HOUR_BERLIN,
} from "@/worker/price";

/** In-memory stand-in for the indexer_state KV table. */
function makeEnv(seed: Record<string, string> = {}) {
  const state = new Map(Object.entries(seed));

  const DB = {
    prepare(sql: string) {
      let args: any[] = [];
      const builder = {
        bind(...a: any[]) {
          args = a;
          return builder;
        },
        async first() {
          if (sql.includes("SELECT value FROM indexer_state")) {
            const v = state.get(args[0]);
            return v === undefined ? null : { value: v };
          }
          return null;
        },
        async run() {
          if (sql.includes("INSERT INTO indexer_state")) {
            state.set(args[0], args[1]);
          }
          return { success: true };
        },
      };
      return builder;
    },
  };

  return { env: { DB } as any, state };
}

/** A CoinPaprika-shaped body — the first source in the chain. */
const okResponse = (usd: number, lastUpdated: number | null = 1785160310) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({
      quotes: { USD: { price: usd } },
      ...(lastUpdated === null
        ? {}
        : { last_updated: new Date(lastUpdated * 1000).toISOString() }),
    }),
  }) as any;

/** A CoinGecko-shaped body — the second source. */
const geckoResponse = (usd: number, lastUpdated: number | null = 1785160310) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({
      alephium:
        lastUpdated === null ? { usd } : { usd, last_updated_at: lastUpdated },
    }),
  }) as any;

/** An upstream refusal, e.g. CoinGecko's shared-IP 429. */
const errResponse = (status: number, body = "") =>
  ({ ok: false, status, text: async () => body }) as any;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("berlinParts — DST correctness", () => {
  it("maps 07:00 UTC to 08:00 Berlin in winter (CET, UTC+1)", () => {
    // 2026-01-15 07:00 UTC
    const { date, hour } = berlinParts(new Date("2026-01-15T07:00:00Z"));
    expect(hour).toBe(8);
    expect(date).toBe("2026-01-15");
  });

  it("maps 06:00 UTC to 08:00 Berlin in summer (CEST, UTC+2)", () => {
    // 2026-07-15 06:00 UTC
    const { date, hour } = berlinParts(new Date("2026-07-15T06:00:00Z"));
    expect(hour).toBe(8);
    expect(date).toBe("2026-07-15");
  });

  it("does NOT report 08:00 Berlin at 07:00 UTC during summer", () => {
    // The naive "always 07:00 UTC" schedule would fire an hour late in summer.
    expect(berlinParts(new Date("2026-07-15T07:00:00Z")).hour).toBe(9);
  });

  it("rolls the Berlin date over before UTC midnight", () => {
    // 23:30 UTC is already the next day in Berlin.
    expect(berlinParts(new Date("2026-07-15T23:30:00Z")).date).toBe(
      "2026-07-16",
    );
  });

  it("reports hour 0, never 24, at Berlin midnight", () => {
    expect(berlinParts(new Date("2026-07-15T22:00:00Z")).hour).toBe(0);
  });
});

describe("fetchAlphPrice", () => {
  it("parses a well-formed response from the primary source", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse(0.03890974)),
    );
    const { env } = makeEnv();

    const result = await fetchAlphPrice(env);
    expect(result.usd).toBeCloseTo(0.03890974);
    expect(result.source_updated_at).toBe(1785160310);
    expect(result.source).toBe("coinpaprika");
  });

  it("stops at the first source that answers", async () => {
    const spy = vi.fn(async () => okResponse(0.04));
    vi.stubGlobal("fetch", spy);

    await fetchAlphPrice(makeEnv().env);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("falls back to the next source when one refuses", async () => {
    // The live failure: CoinGecko 429s on the shared Worker egress IP.
    const spy = vi
      .fn()
      .mockResolvedValueOnce(errResponse(503, "paprika down"))
      .mockResolvedValueOnce(geckoResponse(0.041));
    vi.stubGlobal("fetch", spy);

    const result = await fetchAlphPrice(makeEnv().env);
    expect(result.usd).toBeCloseTo(0.041);
    expect(result.source).toBe("coingecko");
  });

  it("falls through to the last source when both aggregators fail", async () => {
    const spy = vi
      .fn()
      .mockResolvedValueOnce(errResponse(503))
      .mockResolvedValueOnce(errResponse(429, "rate limited"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ symbol: "ALPHUSDT", price: "0.0381" }),
      } as any);
    vi.stubGlobal("fetch", spy);

    const result = await fetchAlphPrice(makeEnv().env);
    expect(result.usd).toBeCloseTo(0.0381);
    expect(result.source).toBe("mexc");
    expect(result.source_updated_at).toBeNull();
  });

  it("keeps going when a source throws rather than refusing", async () => {
    const spy = vi
      .fn()
      .mockRejectedValueOnce(new Error("network unreachable"))
      .mockResolvedValueOnce(geckoResponse(0.042));
    vi.stubGlobal("fetch", spy);

    expect((await fetchAlphPrice(makeEnv().env)).source).toBe("coingecko");
  });

  it("reports every source's error when all of them fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => errResponse(429, "rate limited")),
    );

    await expect(fetchAlphPrice(makeEnv().env)).rejects.toThrow(
      /all price sources failed[\s\S]*coinpaprika[\s\S]*coingecko[\s\S]*mexc/,
    );
  });

  it("sends the demo key header to CoinGecko only, and only when configured", async () => {
    // Reached only after the primary fails, so fail it deliberately.
    const spy = vi
      .fn()
      .mockResolvedValueOnce(errResponse(503))
      .mockResolvedValueOnce(geckoResponse(0.04));
    vi.stubGlobal("fetch", spy);

    await fetchAlphPrice({
      DB: null,
      COINGECKO_API_KEY: "cg-demo-123",
    } as any);
    expect(
      spy.mock.calls[0]?.[1]?.headers["x-cg-demo-api-key"],
    ).toBeUndefined();
    expect(spy.mock.calls[1]?.[1]?.headers["x-cg-demo-api-key"]).toBe(
      "cg-demo-123",
    );

    const spy2 = vi
      .fn()
      .mockResolvedValueOnce(errResponse(503))
      .mockResolvedValueOnce(geckoResponse(0.04));
    vi.stubGlobal("fetch", spy2);

    await fetchAlphPrice({ DB: null } as any);
    expect(
      spy2.mock.calls[1]?.[1]?.headers["x-cg-demo-api-key"],
    ).toBeUndefined();
  });

  it("sends a descriptive User-Agent", async () => {
    const spy = vi.fn(async (_url: string, _init: any) => okResponse(0.04));
    vi.stubGlobal("fetch", spy);

    await fetchAlphPrice(makeEnv().env);
    expect(spy.mock.calls[0]?.[1]?.headers["User-Agent"]).toMatch(/alphland/);
  });

  it("throws on a rate-limit response rather than storing garbage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({ ok: false, status: 429, text: async () => "rate limited" }) as any,
      ),
    );
    await expect(fetchAlphPrice(makeEnv().env)).rejects.toThrow("429");
  });

  it("rejects a zero / missing / non-numeric price", async () => {
    const bodies = [
      { quotes: { USD: { price: 0 } } },
      { quotes: { USD: {} } },
      {},
      { quotes: { USD: { price: "0.04" } } },
    ];
    for (const body of bodies) {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          async () =>
            ({ ok: true, status: 200, json: async () => body }) as any,
        ),
      );
      await expect(fetchAlphPrice(makeEnv().env)).rejects.toThrow(
        /no usable price/,
      );
    }
  });

  it("tolerates a missing last_updated_at", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse(0.04, null)),
    );
    const result = await fetchAlphPrice(makeEnv().env);
    expect(result.source_updated_at).toBeNull();
  });
});

describe("getAlphPrice", () => {
  it("returns null when nothing has been stored yet", async () => {
    expect(await getAlphPrice(makeEnv().env)).toBeNull();
  });

  it("returns null on corrupt JSON instead of throwing", async () => {
    const { env } = makeEnv({ alph_usd_price: "{not json" });
    expect(await getAlphPrice(env)).toBeNull();
  });

  it("returns null on a stored non-positive price", async () => {
    const { env } = makeEnv({
      alph_usd_price: JSON.stringify({ usd: 0, run_date: "2026-07-15" }),
    });
    expect(await getAlphPrice(env)).toBeNull();
  });
});

describe("maybeRefreshDailyPrice — scheduling and idempotency", () => {
  it("fetches at 08:00 Berlin", async () => {
    vi.setSystemTime(new Date("2026-07-15T06:00:00Z")); // 08:00 CEST
    const spy = vi.fn(async () => okResponse(0.0389));
    vi.stubGlobal("fetch", spy);
    const { env, state } = makeEnv();

    await maybeRefreshDailyPrice(env);

    expect(spy).toHaveBeenCalledTimes(1);
    const stored = JSON.parse(state.get("alph_usd_price")!);
    expect(stored.usd).toBeCloseTo(0.0389);
    expect(stored.run_date).toBe("2026-07-15");
  });

  it("fetches exactly once across a full day of hourly runs", async () => {
    const spy = vi.fn(async () => okResponse(0.0389));
    vi.stubGlobal("fetch", spy);
    const { env } = makeEnv();

    for (let utcHour = 0; utcHour < 24; utcHour++) {
      vi.setSystemTime(
        new Date(`2026-07-15T${String(utcHour).padStart(2, "0")}:00:00Z`),
      );
      await maybeRefreshDailyPrice(env);
    }

    // First run at/after 08:00 Berlin wins; the rest are no-ops for that date.
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("skips every hour before 08:00 Berlin", async () => {
    const spy = vi.fn(async () => okResponse(0.0389));
    vi.stubGlobal("fetch", spy);
    const { env } = makeEnv();

    // 00:00–07:00 Berlin on a summer day is 22:00–05:00 UTC.
    for (const utc of ["2026-07-14T22:00:00Z", "2026-07-15T05:00:00Z"]) {
      vi.setSystemTime(new Date(utc));
      await maybeRefreshDailyPrice(env);
    }

    expect(spy).not.toHaveBeenCalled();
  });

  it("does not re-fetch if the cron double-fires within the same hour", async () => {
    vi.setSystemTime(new Date("2026-07-15T06:00:00Z"));
    const spy = vi.fn(async () => okResponse(0.0389));
    vi.stubGlobal("fetch", spy);
    const { env } = makeEnv();

    await maybeRefreshDailyPrice(env);
    await maybeRefreshDailyPrice(env);
    await maybeRefreshDailyPrice(env);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("fetches again the next day", async () => {
    const spy = vi.fn(async () => okResponse(0.0389));
    vi.stubGlobal("fetch", spy);
    const { env } = makeEnv();

    vi.setSystemTime(new Date("2026-07-15T06:00:00Z"));
    await maybeRefreshDailyPrice(env);
    vi.setSystemTime(new Date("2026-07-16T06:00:00Z"));
    await maybeRefreshDailyPrice(env);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("keeps the previous rate and does not throw when CoinGecko fails", async () => {
    const { env, state } = makeEnv({
      alph_usd_price: JSON.stringify({
        usd: 0.05,
        fetched_at: 1,
        source_updated_at: null,
        run_date: "2026-07-14",
        source: "coingecko",
      }),
    });

    vi.setSystemTime(new Date("2026-07-15T06:00:00Z"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 429 }) as any),
    );

    await expect(maybeRefreshDailyPrice(env)).resolves.toBeUndefined();

    // Last known good rate survives untouched.
    expect(JSON.parse(state.get("alph_usd_price")!).usd).toBe(0.05);
  });

  it("retries at 09:00 after the 08:00 fetch fails", async () => {
    const { env, state } = makeEnv();

    vi.setSystemTime(new Date("2026-07-15T06:00:00Z")); // 08:00 Berlin
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 429 }) as any),
    );
    await maybeRefreshDailyPrice(env);
    expect(state.has("alph_usd_price")).toBe(false);

    // One CoinGecko blip must not cost the whole day.
    vi.setSystemTime(new Date("2026-07-15T07:00:00Z")); // 09:00 Berlin
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse(0.0389)),
    );
    await maybeRefreshDailyPrice(env);

    const stored = JSON.parse(state.get("alph_usd_price")!);
    expect(stored.usd).toBeCloseTo(0.0389);
    expect(stored.run_date).toBe("2026-07-15");
  });

  it("stops retrying once the day's fetch has succeeded", async () => {
    const { env } = makeEnv();
    const spy = vi.fn(async () => okResponse(0.0389));
    vi.stubGlobal("fetch", spy);

    for (const utc of [
      "2026-07-15T06:00:00Z", // 08:00 — succeeds
      "2026-07-15T07:00:00Z", // 09:00
      "2026-07-15T12:00:00Z", // 14:00
    ]) {
      vi.setSystemTime(new Date(utc));
      await maybeRefreshDailyPrice(env);
    }

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("backfills immediately on a first deploy later in the day", async () => {
    // Fresh DB, worker deployed at 17:00 Berlin: take a rate now rather than
    // serving no USD figure until tomorrow morning.
    const { env, state } = makeEnv();
    vi.setSystemTime(new Date("2026-07-15T15:00:00Z"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse(0.0389)),
    );

    await maybeRefreshDailyPrice(env);
    expect(state.has("alph_usd_price")).toBe(true);
  });
});

describe("refreshAlphPrice — manual/god path", () => {
  it("writes a record regardless of the hour", async () => {
    vi.setSystemTime(new Date("2026-07-15T15:00:00Z")); // 17:00 Berlin
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse(0.042)),
    );
    const { env, state } = makeEnv();

    const record = await refreshAlphPrice(env);

    expect(record.usd).toBeCloseTo(0.042);
    // Records whichever source answered, not a hardcoded name.
    expect(record.source).toBe("coinpaprika");
    expect(JSON.parse(state.get("alph_usd_price")!).usd).toBeCloseTo(0.042);
  });

  it("propagates failures to the caller so the endpoint can 502", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({ ok: false, status: 500, text: async () => "upstream" }) as any,
      ),
    );
    await expect(refreshAlphPrice(makeEnv().env)).rejects.toThrow("500");
  });
});

describe("REFRESH_HOUR_BERLIN", () => {
  it("is 08:00 as specified", () => {
    expect(REFRESH_HOUR_BERLIN).toBe(8);
  });
});

/** Env whose stored rate is fixed, for reward-resolution tests. */
function envAtRate(usd: number | null) {
  return makeEnv(
    usd === null
      ? {}
      : {
          alph_usd_price: JSON.stringify({
            usd,
            fetched_at: 1,
            source_updated_at: null,
            run_date: "2026-07-15",
            source: "coingecko",
          }),
        },
  ).env;
}

describe("resolveRewardInput — reward_amount is always ALPH", () => {
  it("keeps ALPH authoritative and derives USD", async () => {
    const r = await resolveRewardInput(envAtRate(0.04), {
      denomination: "alph",
      reward_amount: 500,
    });

    expect(r.denomination).toBe("alph");
    expect(r.reward_amount).toBe(500); // untouched
    expect(r.reward_usd).toBeCloseTo(20); // 500 × 0.04
    expect(r.target_usd).toBeNull();
  });

  it("keeps USD authoritative and derives an ALPH amount", async () => {
    const r = await resolveRewardInput(envAtRate(0.04), {
      denomination: "usd",
      target_usd: 1000,
    });

    expect(r.denomination).toBe("usd");
    expect(r.target_usd).toBe(1000); // untouched
    expect(r.reward_usd).toBe(1000);
    expect(r.reward_amount).toBeCloseTo(25000); // 1000 / 0.04
  });

  it("never puts a USD figure into reward_amount", async () => {
    // The old schema's core bug: a $1000 bounty stored reward_amount = 1000.
    const r = await resolveRewardInput(envAtRate(0.04), {
      denomination: "usd",
      target_usd: 1000,
    });
    expect(r.reward_amount).not.toBe(1000);
  });

  it("defaults to ALPH denomination when unspecified", async () => {
    const r = await resolveRewardInput(envAtRate(0.04), { reward_amount: 7 });
    expect(r.denomination).toBe("alph");
    expect(r.reward_amount).toBe(7);
  });

  it("treats any unrecognised denomination as ALPH rather than guessing", async () => {
    const r = await resolveRewardInput(envAtRate(0.04), {
      denomination: "EUR",
      reward_amount: 7,
    });
    expect(r.denomination).toBe("alph");
  });

  it("rejects negative and non-numeric amounts, naming the right field", async () => {
    await expect(
      resolveRewardInput(envAtRate(0.04), {
        denomination: "alph",
        reward_amount: -1,
      }),
    ).rejects.toThrow("reward_amount");

    await expect(
      resolveRewardInput(envAtRate(0.04), {
        denomination: "usd",
        target_usd: "abc",
      }),
    ).rejects.toThrow("target_usd");
  });

  it("accepts zero (an unpaid / placeholder bounty)", async () => {
    const r = await resolveRewardInput(envAtRate(0.04), { reward_amount: 0 });
    expect(r.reward_amount).toBe(0);
    expect(r.reward_usd).toBe(0);
  });

  it("still resolves an ALPH reward when no rate is cached yet", async () => {
    // First deploy, before the price job has ever run: the sponsor's own
    // number is authoritative, so the bounty saves; the daily job fills in
    // reward_usd on its next run.
    const alph = await resolveRewardInput(envAtRate(null), {
      denomination: "alph",
      reward_amount: 500,
    });
    expect(alph.reward_amount).toBe(500);
    expect(alph.reward_usd).toBeNull();
    expect(alph.token_usd_at_valuation).toBeNull();
  });

  it("refuses a USD reward with no rate rather than storing 0 ALPH", async () => {
    // bounties.reward_amount is NOT NULL and there is no honest ALPH figure
    // to write; storing 0 would render as "0 ALPH" on the bounty page.
    await expect(
      resolveRewardInput(envAtRate(null), {
        denomination: "usd",
        target_usd: 1000,
      }),
    ).rejects.toThrow(RateUnavailableError);
  });

  it("never returns a reward_amount the NOT NULL column would reject", async () => {
    for (const body of [
      { denomination: "alph", reward_amount: 500 },
      { denomination: "usd", target_usd: 1000 },
      { reward_amount: 0 },
    ]) {
      const r = await resolveRewardInput(envAtRate(0.04), body);
      expect(r.reward_amount).not.toBeNull();
      expect(Number.isFinite(r.reward_amount)).toBe(true);
    }
  });

  it("ignores reward_currency — denomination is the only signal", async () => {
    // The pre-025 shim read {reward_currency:'USD', reward_amount:100} as
    // $100. It is gone, so the field is inert and reward_amount is taken at
    // face value in ALPH. Passed through a variable because the parameter type
    // no longer names reward_currency at all.
    const stale = { reward_currency: "USD", reward_amount: 100 };
    const r = await resolveRewardInput(envAtRate(0.04), stale);

    expect(r.denomination).toBe("alph");
    expect(r.reward_amount).toBe(100);
    expect(r.target_usd).toBeNull();
  });

  it("defaults to ALPH when denomination is absent", async () => {
    const r = await resolveRewardInput(envAtRate(0.04), {
      reward_amount: 500,
    });
    expect(r.denomination).toBe("alph");
    expect(r.reward_amount).toBe(500);
  });

  it("round-trips a USD bounty back to the same USD figure", async () => {
    const rate = 0.03897934;
    const r = await resolveRewardInput(envAtRate(rate), {
      denomination: "usd",
      target_usd: 100,
    });
    expect((r.reward_amount as number) * rate).toBeCloseTo(100, 6);
  });
});

describe("revalueBounties", () => {
  /** Captures the UPDATE statements so we can assert on the SQL semantics. */
  function captureEnv() {
    const runs: { sql: string; args: any[] }[] = [];
    const DB = {
      prepare(sql: string) {
        let args: any[] = [];
        const b = {
          bind(...a: any[]) {
            args = a;
            return b;
          },
          async run() {
            runs.push({ sql, args });
            return { meta: { changes: 1 } };
          },
          async first() {
            return null;
          },
        };
        return b;
      },
    };
    return { env: { DB } as any, runs };
  }

  it("updates the derived side of each denomination", async () => {
    const { env, runs } = captureEnv();
    await revalueBounties(env, 0.04);

    const alph = runs.find((r) => r.sql.includes("denomination = 'alph'"))!;
    const usd = runs.find((r) => r.sql.includes("denomination = 'usd'"))!;

    // ALPH-denominated: USD recomputed, ALPH left alone.
    expect(alph.sql).toContain("reward_usd = reward_amount * ?");
    expect(alph.sql).not.toContain("SET reward_amount =");

    // USD-denominated: ALPH recomputed, USD pinned to the promise.
    expect(usd.sql).toContain("reward_amount = target_usd / ?");
    expect(usd.sql).toContain("reward_usd = target_usd");
  });

  it("only touches open bounties, so settled figures cannot drift", async () => {
    const { env, runs } = captureEnv();
    await revalueBounties(env, 0.04);
    for (const r of runs) expect(r.sql).toContain("status = 'open'");
  });

  it("skips rows missing their authoritative value", async () => {
    const { env, runs } = captureEnv();
    await revalueBounties(env, 0.04);
    expect(
      runs.find((r) => r.sql.includes("denomination = 'alph'"))!.sql,
    ).toContain("reward_amount IS NOT NULL");
    expect(
      runs.find((r) => r.sql.includes("denomination = 'usd'"))!.sql,
    ).toContain("target_usd IS NOT NULL");
  });

  it("returns the number of rows revalued", async () => {
    const { env } = captureEnv();
    expect(await revalueBounties(env, 0.04)).toBe(2); // 1 per statement
  });

  it("refuses a zero or negative rate instead of dividing by it", async () => {
    // target_usd / 0 would write Infinity into every USD-denominated bounty.
    const { env } = captureEnv();
    for (const bad of [0, -1, NaN]) {
      await expect(revalueBounties(env, bad)).rejects.toThrow(/unusable rate/);
    }
  });
});
