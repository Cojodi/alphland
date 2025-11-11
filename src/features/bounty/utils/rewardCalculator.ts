// Reward calculation utilities
import { Reward, TieredReward } from "../types";

export const DEFAULT_TIER_PERCENTAGES = [
  { position: 1, percentage: 0.4 }, // 40%
  { position: 2, percentage: 0.25 }, // 25%
  { position: 3, percentage: 0.15 }, // 15%
  { position: 4, percentage: 0.1 }, // 10%
  { position: 5, percentage: 0.1 }, // 10%
];

export function generateTieredRewards(
  reward: Reward,
  tierCount: number = 5
): TieredReward[] {
  const totalAmount = reward.amount;
  const percentages = DEFAULT_TIER_PERCENTAGES.slice(0, tierCount);

  return percentages.map((tier) => ({
    position: tier.position,
    percentage: tier.percentage,
    amount: Math.round(totalAmount * tier.percentage),
    token: reward.token,
    usd_equivalent: Math.round(reward.usd_equivalent * tier.percentage),
  }));
}

export function formatRewardAmount(amount: number, token: string): string {
  return `${amount.toLocaleString()} ${token}`;
}

export function formatUSDAmount(amount: number): string {
  return `$${amount.toLocaleString()}`;
}
