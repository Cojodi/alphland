"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
} from "lucide-react";
import { apiClient, BountySubmission } from "@/lib/api-client";
import { notificationService } from "../services/notificationService";
import { Bounty, TieredReward } from "../types/bounty.types";
import { generateTieredRewards } from "../utils/rewardCalculator";

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: BountySubmission | null;
  bounty: Bounty | null;
  onSuccess?: () => void;
}

export function SubmissionReviewModal({
  isOpen,
  onClose,
  submission,
  bounty,
  onSuccess,
}: SubmissionReviewModalProps) {
  const [reviewAction, setReviewAction] = useState<
    "approved" | "rejected" | "revision_requested" | null
  >(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [closeBounty, setCloseBounty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userWalletAddress, setUserWalletAddress] = useState<string | null>(
    null,
  );
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Calculate tiered rewards if applicable
  const tieredRewards: TieredReward[] | undefined =
    bounty?.reward_type === "tiered" && bounty.tier_count
      ? generateTieredRewards(bounty.reward, bounty.tier_count)
      : undefined;

  // Get USD amount for the selected tier or fixed reward
  const getUSDAmount = (): number => {
    if (bounty?.reward_type === "tiered" && selectedTier && tieredRewards) {
      const tier = tieredRewards.find((t) => t.position === selectedTier);
      return tier
        ? tier.usd_equivalent ||
            tier.amount * (bounty.reward.usd_equivalent / bounty.reward.amount)
        : 0;
    }
    return bounty?.reward.usd_equivalent || 0;
  };

  // Fetch user wallet address when submission changes
  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (!submission?.submitted_by) {
        setUserWalletAddress(null);
        return;
      }

      setLoadingWallet(true);
      try {
        const response = await fetch(`/api/users/${submission.submitted_by}`);
        if (response.ok) {
          const data = await response.json();
          setUserWalletAddress(data.user?.wallet_address || null);
        }
      } catch (err) {
        console.error("Failed to fetch user wallet address:", err);
        setUserWalletAddress(null);
      } finally {
        setLoadingWallet(false);
      }
    };

    if (isOpen && submission) {
      fetchWalletAddress();
    }
  }, [isOpen, submission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!submission || !reviewAction || !bounty) {
      setError("Please select a review action");
      return;
    }

    if (reviewAction === "approved") {
      if (!transactionHash.trim()) {
        setError("Please provide a transaction hash for approved submissions");
        return;
      }

      if (!rewardAmount.trim() || isNaN(parseFloat(rewardAmount))) {
        setError("Please provide a valid ALPH reward amount");
        return;
      }

      if (bounty.reward_type === "tiered" && !selectedTier) {
        setError("Please select a tier placement for this submission");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare reviewer notes with reward info
      let finalReviewerNotes = reviewerNotes.trim();
      if (reviewAction === "approved") {
        const tierInfo =
          bounty.reward_type === "tiered" && selectedTier
            ? `Tier ${selectedTier} placement. `
            : "";
        const usdAmount = getUSDAmount();
        const rewardInfo = `${tierInfo}Reward: ${rewardAmount} ALPH (for $${usdAmount.toFixed(2)} USD bounty)`;
        finalReviewerNotes = finalReviewerNotes
          ? `${finalReviewerNotes}\n\n${rewardInfo}`
          : rewardInfo;
      }

      // Update submission status
      await apiClient.updateSubmission(submission.id, {
        status: reviewAction,
        reviewer_notes: finalReviewerNotes || undefined,
        transaction_hash: transactionHash.trim() || undefined,
      });

      // Update bounty_overview with ALPH amount
      if (reviewAction === "approved" && rewardAmount) {
        try {
          await fetch("/api/bounty-overview/update-alph", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              alph_amount: parseFloat(rewardAmount),
            }),
          });
        } catch (err) {
          console.error("Failed to update bounty overview:", err);
          // Don't fail the whole operation if this fails
        }
      }

      // Close bounty if requested and this is the last spot
      if (reviewAction === "approved" && closeBounty) {
        // TODO: Add API call to close bounty
        // await apiClient.updateBounty(bounty.id, { status: "closed" });
      }

      // Send notification to submitter
      if (reviewAction === "approved") {
        await notificationService.notifySubmissionApproved(
          submission.submitted_by,
          submission.bounty_id,
          bounty.title,
          parseFloat(rewardAmount),
          bounty.reward.token,
        );
      } else if (reviewAction === "rejected") {
        await notificationService.notifySubmissionRejected(
          submission.submitted_by,
          submission.bounty_id,
          bounty.title,
          reviewerNotes,
        );
      }

      // Reset form
      setReviewAction(null);
      setReviewerNotes("");
      setTransactionHash("");
      setRewardAmount("");
      setSelectedTier(null);
      setCloseBounty(false);

      // Call success callback
      onSuccess?.();

      // Close modal
      onClose();
    } catch (err) {
      console.error("Failed to update submission:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update submission. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !submission) return null;

  const extractTitle = (description: string | null): string => {
    if (!description) return "Submission";

    // Try to extract title from markdown bold syntax
    const titleMatch = description.match(/^\*\*(.+?)\*\*/);
    if (titleMatch) {
      return titleMatch[1];
    }

    // Fallback to first line
    const firstLine = description.split("\n")[0];
    return firstLine.substring(0, 50) + (firstLine.length > 50 ? "..." : "");
  };

  const extractDescription = (description: string | null): string => {
    if (!description) return "";

    // Remove title if it exists
    let text = description.replace(/^\*\*(.+?)\*\*\n*/, "");

    return text.trim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-hero-dark rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-grey dark:border-dark-charcoal sticky top-0 bg-white dark:bg-hero-dark z-10">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white">
              Review Submission
            </h2>
            <p className="text-sm text-light-charcoal dark:text-lightgrey mt-1">
              {bounty?.title || "Bounty"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-smoked-white dark:hover:bg-light-black rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-light-charcoal dark:text-lightgrey" />
          </button>
        </div>

        {/* Submission Details */}
        <div className="p-6 space-y-6">
          {/* Submission Info */}
          <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
            <h3 className="font-semibold text-black dark:text-white mb-2">
              {extractTitle(submission.description)}
            </h3>

            {submission.description && (
              <div className="text-sm text-light-charcoal dark:text-lightgrey whitespace-pre-wrap mb-3">
                {extractDescription(submission.description)}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-light-charcoal dark:text-lightgrey">
                Submitted by:{" "}
                <span className="font-medium">{submission.submitted_by}</span>
              </span>
              <span>•</span>
              <span className="text-sm text-light-charcoal dark:text-lightgrey">
                {new Date(
                  Number(submission.created_at) * 1000,
                ).toLocaleDateString()}
              </span>
            </div>

            {/* Wallet Address */}
            {loadingWallet ? (
              <div className="mt-3 p-3 bg-smoked-white dark:bg-light-black rounded-lg">
                <p className="text-xs text-light-charcoal dark:text-lightgrey">
                  Loading wallet address...
                </p>
              </div>
            ) : userWalletAddress ? (
              <div className="mt-3 p-3 bg-orange/5 border border-orange/20 rounded-lg">
                <p className="text-xs font-semibold text-black dark:text-white mb-1">
                  ALPH Wallet Address:
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-orange font-mono break-all flex-1">
                    {userWalletAddress}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(userWalletAddress);
                      // Optionally show a toast notification
                    }}
                    className="p-1.5 hover:bg-orange/10 rounded transition-colors flex-shrink-0"
                    title="Copy address"
                  >
                    <Copy className="w-3.5 h-3.5 text-orange" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-smoked-white dark:bg-light-black rounded-lg">
                <p className="text-xs text-light-charcoal dark:text-lightgrey">
                  ⚠ No wallet address on file. User needs to add their wallet
                  address to their profile.
                </p>
              </div>
            )}

            {submission.submission_url && (
              <a
                href={submission.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-orange hover:text-orange/80 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View Submission
              </a>
            )}
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Review Action */}
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-3">
                Review Decision <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction("approved")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    reviewAction === "approved"
                      ? "border-accessible-green bg-accessible-green/10"
                      : "border-border-grey dark:border-dark-charcoal hover:border-accessible-green"
                  }`}
                >
                  <CheckCircle
                    className={`w-6 h-6 mx-auto mb-2 ${
                      reviewAction === "approved"
                        ? "text-accessible-green"
                        : "text-light-charcoal dark:text-lightgrey"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      reviewAction === "approved"
                        ? "text-accessible-green"
                        : "text-black dark:text-white"
                    }`}
                  >
                    Approve
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction("revision_requested")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    reviewAction === "revision_requested"
                      ? "border-orange bg-orange/10"
                      : "border-border-grey dark:border-dark-charcoal hover:border-orange"
                  }`}
                >
                  <AlertCircle
                    className={`w-6 h-6 mx-auto mb-2 ${
                      reviewAction === "revision_requested"
                        ? "text-orange"
                        : "text-light-charcoal dark:text-lightgrey"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      reviewAction === "revision_requested"
                        ? "text-orange"
                        : "text-black dark:text-white"
                    }`}
                  >
                    Request Changes
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction("rejected")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    reviewAction === "rejected"
                      ? "border-red-500 bg-red-500/10"
                      : "border-border-grey dark:border-dark-charcoal hover:border-red-500"
                  }`}
                >
                  <XCircle
                    className={`w-6 h-6 mx-auto mb-2 ${
                      reviewAction === "rejected"
                        ? "text-red-500"
                        : "text-light-charcoal dark:text-lightgrey"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      reviewAction === "rejected"
                        ? "text-red-500"
                        : "text-black dark:text-white"
                    }`}
                  >
                    Reject
                  </span>
                </button>
              </div>
            </div>

            {/* Reviewer Notes */}
            <div>
              <label
                htmlFor="reviewer_notes"
                className="block text-sm font-semibold text-black dark:text-white mb-2"
              >
                Feedback{" "}
                {reviewAction === "rejected" && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <textarea
                id="reviewer_notes"
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Provide feedback to the submitter..."
                rows={4}
                className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 resize-none"
                required={reviewAction === "rejected"}
              />
            </div>

            {/* Tier Selection (only for approved + tiered bounties) */}
            {reviewAction === "approved" &&
              bounty?.reward_type === "tiered" &&
              tieredRewards && (
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-3">
                    Select Tier Placement{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {tieredRewards.map((tier) => {
                      const tierUSD =
                        tier.usd_equivalent ||
                        tier.amount *
                          (bounty.reward.usd_equivalent / bounty.reward.amount);
                      return (
                        <button
                          key={tier.position}
                          type="button"
                          onClick={() => {
                            setSelectedTier(tier.position);
                            setRewardAmount(""); // Let sponsor fill in the ALPH amount
                          }}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            selectedTier === tier.position
                              ? "border-orange bg-orange/10"
                              : "border-border-grey dark:border-dark-charcoal hover:border-orange"
                          }`}
                        >
                          <div className="text-center">
                            <div
                              className={`text-lg font-bold mb-2 ${
                                selectedTier === tier.position
                                  ? "text-orange"
                                  : "text-black dark:text-white"
                              }`}
                            >
                              {tier.position === 1
                                ? "1st"
                                : tier.position === 2
                                  ? "2nd"
                                  : tier.position === 3
                                    ? "3rd"
                                    : `${tier.position}th`}
                            </div>
                            <div className="text-sm font-semibold text-accessible-green">
                              ${tierUSD.toFixed(2)} USD
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Reward Amount (only for approved) */}
            {reviewAction === "approved" && (
              <div>
                <label
                  htmlFor="reward_amount"
                  className="block text-sm font-semibold text-black dark:text-white mb-2"
                >
                  Payment Amount (ALPH) <span className="text-red-500">*</span>
                </label>

                {/* Show USD amount to pay */}
                <div className="mb-3 p-3 bg-accessible-green/10 border border-accessible-green/20 rounded-lg">
                  <p className="text-sm text-light-charcoal dark:text-lightgrey">
                    Bounty Value:{" "}
                    <span className="font-bold text-accessible-green text-base">
                      ${getUSDAmount().toFixed(2)} USD
                    </span>
                  </p>
                  <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1">
                    Enter the amount of ALPH you are sending for this USD value
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    id="reward_amount"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 pr-16 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-light-charcoal dark:text-lightgrey">
                    ALPH
                  </span>
                </div>

                {bounty?.reward_type === "tiered" && !selectedTier && (
                  <p className="text-xs text-orange mt-2">
                    ⚠ Please select a tier placement above first
                  </p>
                )}
              </div>
            )}

            {/* Transaction Hash (only for approved) */}
            {reviewAction === "approved" && (
              <div>
                <label
                  htmlFor="transaction_hash"
                  className="block text-sm font-semibold text-black dark:text-white mb-2"
                >
                  Transaction Hash <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="transaction_hash"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 font-mono"
                  required
                />
                <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1">
                  Provide the Alephium transaction hash for the reward payment
                </p>
              </div>
            )}

            {/* Close Bounty Option (only for approved + single reward bounty) */}
            {reviewAction === "approved" && bounty?.reward_type === "fixed" && (
              <div className="p-4 bg-orange/5 border border-orange/20 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={closeBounty}
                    onChange={(e) => setCloseBounty(e.target.checked)}
                    className="mt-1 w-4 h-4 text-orange bg-smoked-white dark:bg-light-black border-border-grey dark:border-dark-charcoal rounded focus:ring-2 focus:ring-orange/50"
                  />
                  <div>
                    <span className="text-sm font-semibold text-black dark:text-white block mb-1">
                      Close this bounty after approval
                    </span>
                    <span className="text-xs text-light-charcoal dark:text-lightgrey">
                      Since this is a single-reward bounty, you can close it
                      after accepting this submission to prevent further
                      submissions.
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-border-grey dark:border-dark-charcoal text-black dark:text-white rounded-lg hover:bg-smoked-white dark:hover:bg-light-black transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reviewAction}
                className="flex-1 px-6 py-3 bg-orange hover:bg-orange/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
