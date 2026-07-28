import { describe, it, expect } from "vitest";
import {
  getBountyDisplayStatus,
  deadlinePassed,
  endDateMs,
  isAcceptingSubmissions,
} from "@/features/bounty/utils/bountyStatus";

const NOW = Date.parse("2026-07-28T12:00:00Z");
const FUTURE = Math.floor(Date.parse("2026-08-30T12:00:00Z") / 1000);
const PAST = Math.floor(Date.parse("2026-07-01T12:00:00Z") / 1000);

const live = {
  status: "open",
  is_published: 1,
  published_at: 1785000000,
  is_winners_announced: 0,
  end_date: FUTURE,
};

describe("endDateMs", () => {
  it("treats small numbers as unix seconds and large ones as milliseconds", () => {
    expect(endDateMs(PAST)).toBe(PAST * 1000);
    expect(endDateMs(PAST * 1000)).toBe(PAST * 1000);
  });

  it("parses ISO strings, which several client paths still send", () => {
    expect(endDateMs("2026-07-01T12:00:00Z")).toBe(PAST * 1000);
  });

  it("returns null for nothing usable rather than NaN", () => {
    for (const v of [null, undefined, "", "not a date"]) {
      expect(endDateMs(v as any)).toBeNull();
    }
  });
});

describe("deadlinePassed", () => {
  it("is false when there is no deadline at all", () => {
    // A missing deadline must not read as "expired" — that would push every
    // dateless draft straight to In Review.
    expect(deadlinePassed(null, NOW)).toBe(false);
  });

  it("is true exactly at the deadline", () => {
    expect(deadlinePassed(Math.floor(NOW / 1000), NOW)).toBe(true);
  });
});

describe("getBountyDisplayStatus", () => {
  it("reports Draft only when it was never published", () => {
    expect(
      getBountyDisplayStatus(
        { ...live, is_published: 0, published_at: null },
        undefined,
        NOW,
      ),
    ).toBe("Draft");
  });

  it("distinguishes Unpublished from Draft by published_at", () => {
    expect(
      getBountyDisplayStatus(
        { ...live, is_published: 0, published_at: 1785000000 },
        undefined,
        NOW,
      ),
    ).toBe("Unpublished");
  });

  it("is In Progress before the deadline and In Review after", () => {
    expect(getBountyDisplayStatus(live, undefined, NOW)).toBe("In Progress");
    expect(
      getBountyDisplayStatus({ ...live, end_date: PAST }, undefined, NOW),
    ).toBe("In Review");
  });

  it("reports Cancelled regardless of every other flag", () => {
    expect(
      getBountyDisplayStatus(
        {
          ...live,
          status: "cancelled",
          is_published: 0,
          is_winners_announced: 1,
        },
        { winnerCount: 3, paidCount: 3 },
        NOW,
      ),
    ).toBe("Cancelled");
  });

  it("hides a deleted bounty behind Cancelled too", () => {
    expect(
      getBountyDisplayStatus({ ...live, status: "deleted" }, undefined, NOW),
    ).toBe("Cancelled");
  });

  it("is Payment Pending once announced until every winner is paid", () => {
    const announced = { ...live, is_winners_announced: 1, end_date: PAST };
    expect(
      getBountyDisplayStatus(announced, { winnerCount: 3, paidCount: 0 }, NOW),
    ).toBe("Payment Pending");
    expect(
      getBountyDisplayStatus(announced, { winnerCount: 3, paidCount: 2 }, NOW),
    ).toBe("Payment Pending");
    expect(
      getBountyDisplayStatus(announced, { winnerCount: 3, paidCount: 3 }, NOW),
    ).toBe("Completed");
  });

  it("does not claim Completed when the counts are unknown", () => {
    // The worker's list payload has no payment counts. Guessing "Completed"
    // there would tell a user they have been paid when they have not.
    expect(
      getBountyDisplayStatus(
        { ...live, is_winners_announced: 1 },
        undefined,
        NOW,
      ),
    ).toBe("Payment Pending");
  });

  it("does not call an announced bounty with zero winners Completed", () => {
    expect(
      getBountyDisplayStatus(
        { ...live, is_winners_announced: 1 },
        { winnerCount: 0, paidCount: 0 },
        NOW,
      ),
    ).toBe("Payment Pending");
  });

  it("accepts booleans as well as SQLite's 0/1", () => {
    expect(
      getBountyDisplayStatus(
        { ...live, is_published: true, is_winners_announced: false },
        undefined,
        NOW,
      ),
    ).toBe("In Progress");
  });

  it("treats a missing is_published as unpublished, not as published", () => {
    // Reading a row from before migration 032 must not silently publish it.
    expect(
      getBountyDisplayStatus(
        { status: "open", end_date: FUTURE },
        undefined,
        NOW,
      ),
    ).toBe("Draft");
  });
});

describe("isAcceptingSubmissions", () => {
  it("is true only while live and before the deadline", () => {
    expect(isAcceptingSubmissions(live, NOW)).toBe(true);
    expect(isAcceptingSubmissions({ ...live, end_date: PAST }, NOW)).toBe(
      false,
    );
    expect(isAcceptingSubmissions({ ...live, is_published: 0 }, NOW)).toBe(
      false,
    );
    expect(isAcceptingSubmissions({ ...live, status: "cancelled" }, NOW)).toBe(
      false,
    );
  });
});
