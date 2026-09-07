import { describe, expect, it } from "vitest";
import {
  TIER_PERCENTAGES_10,
  TIER_PERCENTAGES_3,
  TIER_PERCENTAGES_5,
  formatRewardAmount,
  formatUSDAmount,
  generateTieredRewards,
} from "@/features/bounty/utils/rewardCalculator";
import type { Reward } from "@/features/bounty/types";

const baseReward: Reward = { amount: 1000, token: "ALPH", usd_equivalent: 500 };

describe("tier percentage tables", () => {
  const sum = (tiers: { percentage: number }[]) =>
    tiers.reduce((acc, t) => acc + t.percentage, 0);

  it("TIER_PERCENTAGES_3 sums to 1.0", () => {
    expect(sum(TIER_PERCENTAGES_3)).toBeCloseTo(1.0);
  });

  it("TIER_PERCENTAGES_5 sums to 1.0", () => {
    expect(sum(TIER_PERCENTAGES_5)).toBeCloseTo(1.0);
  });

  it("TIER_PERCENTAGES_10 sums to 1.0", () => {
    expect(sum(TIER_PERCENTAGES_10)).toBeCloseTo(1.0);
  });
});

describe("generateTieredRewards", () => {
  it("returns the correct number of tiers", () => {
    expect(generateTieredRewards(baseReward, 3)).toHaveLength(3);
    expect(generateTieredRewards(baseReward, 5)).toHaveLength(5);
    expect(generateTieredRewards(baseReward, 10)).toHaveLength(10);
  });

  it("defaults to 5 tiers", () => {
    expect(generateTieredRewards(baseReward)).toHaveLength(5);
  });

  it("positions are sequential starting from 1", () => {
    const tiers = generateTieredRewards(baseReward, 3);
    expect(tiers.map((t) => t.position)).toEqual([1, 2, 3]);
  });

  it("first place gets the largest reward", () => {
    const tiers = generateTieredRewards(baseReward, 5);
    const amounts = tiers.map((t) => t.amount);
    expect(amounts[0]).toBeGreaterThan(amounts[1]);
    expect(amounts[1]).toBeGreaterThan(amounts[2]);
  });

  it("reward amounts sum close to the total", () => {
    const tiers = generateTieredRewards(baseReward, 5);
    const total = tiers.reduce((acc, t) => acc + t.amount, 0);
    // Math.round per tier means total may be off by a few units
    expect(Math.abs(total - baseReward.amount)).toBeLessThanOrEqual(5);
  });

  it("inherits the token from the base reward", () => {
    const tiers = generateTieredRewards(baseReward, 3);
    tiers.forEach((t) => expect(t.token).toBe("ALPH"));
  });

  it("usd_equivalent amounts are proportional", () => {
    const tiers = generateTieredRewards(baseReward, 3);
    expect(tiers[0].usd_equivalent).toBeGreaterThan(tiers[1].usd_equivalent);
  });
});

describe("formatRewardAmount", () => {
  it("formats with token suffix", () => {
    expect(formatRewardAmount(1000, "ALPH")).toBe("1,000 ALPH");
  });

  it("handles zero", () => {
    expect(formatRewardAmount(0, "ALPH")).toBe("0 ALPH");
  });
});

describe("formatUSDAmount", () => {
  it("formats with dollar sign", () => {
    expect(formatUSDAmount(500)).toBe("$500");
    expect(formatUSDAmount(1000)).toBe("$1,000");
  });

  it("handles zero", () => {
    expect(formatUSDAmount(0)).toBe("$0");
  });
});
