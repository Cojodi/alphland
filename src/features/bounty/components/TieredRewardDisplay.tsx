"use client";

import { TieredReward } from "../types";
import { formatRewardAmount, formatUSDAmount } from "../utils/rewardCalculator";
import { DollarSign, Clock } from "lucide-react";

interface TieredRewardDisplayProps {
  totalAmount: number;
  token: string;
  usdEquivalent: number;
  tiers?: TieredReward[];
  submissions: number;
  timeRemaining: string;
  skills?: string[];
  onSubmit?: () => void;
}

export function TieredRewardDisplay({
  totalAmount,
  token,
  usdEquivalent,
  tiers,
  submissions,
  timeRemaining,
  skills = [],
  onSubmit,
}: TieredRewardDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Total Prize */}
      <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-orange/10 dark:bg-orange/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange" />
            </div>
            <div>
              <h3 className="text-sm text-light-charcoal dark:text-lightgrey">
                Total Prizes
              </h3>
              <p className="text-2xl font-bold text-black dark:text-white">
                {formatRewardAmount(totalAmount, token)}
              </p>
              {/* <p className="text-sm text-light-charcoal dark:text-lightgrey">
                {formatUSDAmount(usdEquivalent)}
              </p> */}
            </div>
          </div>
        </div>

        {/* Prize Tiers */}
        {tiers && tiers.length > 0 && (
          <div className="space-y-3 mb-6">
            {tiers.slice(0, 5).map((tier, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-border-grey dark:border-dark-charcoal last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange/10 dark:bg-orange/20 flex items-center justify-center text-xs font-bold text-orange">
                    {tier.position}
                  </div>
                  <span className="text-sm text-black dark:text-white font-medium">
                    {formatRewardAmount(tier.amount, tier.token)}
                  </span>
                </div>
                <span className="text-xs text-light-charcoal dark:text-lightgrey">
                  {(tier.percentage * 100).toFixed(0)}%
                </span>
              </div>
            ))}
            {tiers.length > 5 && (
              <button className="w-full py-2 text-sm text-orange font-medium hover:text-orange/80 transition-colors">
                View {tiers.length - 5} more →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Submissions & Time Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-hero-dark rounded-lg p-4 border border-border-grey dark:border-dark-charcoal">
          <p className="text-xs text-light-charcoal dark:text-lightgrey uppercase tracking-wide font-medium mb-2">
            Submissions
          </p>
          <p className="text-2xl font-bold text-black dark:text-white">
            {submissions}
          </p>
        </div>
        <div className="bg-white dark:bg-hero-dark rounded-lg p-4 border border-border-grey dark:border-dark-charcoal">
          <p className="text-xs text-light-charcoal dark:text-lightgrey uppercase tracking-wide font-medium mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Remaining
          </p>
          <p className="text-lg font-bold text-black dark:text-white">
            {timeRemaining}
          </p>
        </div>
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <>
          <button
            onClick={onSubmit}
            className="w-full bg-accessible-green hover:bg-accessible-green/90 text-white py-6 text-base font-semibold rounded-lg transition-colors"
          >
            Submit Now
          </button>
          {/* <p className="text-xs text-light-charcoal dark:text-lightgrey text-center -mt-4">
            * Connect wallet to submit
          </p> */}
        </>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
          <h4 className="text-xs uppercase tracking-wide font-semibold text-black dark:text-white mb-3">
            Skills Needed
          </h4>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-smoked-white dark:bg-light-black text-light-charcoal dark:text-lightgrey text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
