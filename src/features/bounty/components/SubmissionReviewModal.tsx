"use client";

import React, { useState, useEffect } from "react";
import { X, ExternalLink, CheckCircle, XCircle, Copy } from "lucide-react";
import Link from "next/link";
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

const initialFormState = {
  reviewAction: null as "approved" | "rejected" | null,
  reviewerNotes: "",
  transactionHash: "",
  rewardAmount: "",
  selectedTier: null as number | null,
  closeBounty: false,
};

export function SubmissionReviewModal({
  isOpen,
  onClose,
  submission,
  bounty,
  onSuccess,
}: SubmissionReviewModalProps) {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<{
    show: boolean;
    action: "approved" | "rejected" | null;
  }>({ show: false, action: null });
  const [userWalletAddress, setUserWalletAddress] = useState<string | null>(
    null,
  );
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Calculate tiered rewards if applicable
  const tieredRewards: TieredReward[] | undefined =
    bounty?.reward_type === "tiered" && bounty.tier_count && bounty.reward
      ? generateTieredRewards(bounty.reward, bounty.tier_count)
      : undefined;

  // Get token amount for the selected tier or fixed reward
  const getTokenAmount = (): { amount: number; token: string } => {
    if (
      bounty?.reward_type === "tiered" &&
      form.selectedTier &&
      tieredRewards
    ) {
      const tier = tieredRewards.find((t) => t.position === form.selectedTier);
      return tier
        ? { amount: tier.amount, token: tier.token }
        : { amount: 0, token: bounty?.reward?.token || "ALPH" };
    }
    return {
      amount: bounty?.reward?.amount || 0,
      token: bounty?.reward?.token || "ALPH",
    };
  };

  // Fetch user wallet address when submission changes
  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (!submission?.user_id) {
        setUserWalletAddress(null);
        return;
      }

      setLoadingWallet(true);
      try {
        const response = await fetch(`/api/users/${submission.user_id}`);
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
    setTxError(null);

    if (!submission || !form.reviewAction || !bounty) {
      setError("Please select a review action");
      return;
    }

    if (form.reviewAction === "approved") {
      if (!form.transactionHash.trim()) {
        setError("Please provide a transaction hash for approved submissions");
        return;
      }

      if (!form.rewardAmount.trim() || isNaN(parseFloat(form.rewardAmount))) {
        setError("Please provide a valid ALPH reward amount");
        return;
      }

      if (bounty.reward_type === "tiered" && !form.selectedTier) {
        setError("Please select a tier placement for this submission");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare reviewer notes with reward info
      let finalReviewerNotes = form.reviewerNotes.trim();
      if (form.reviewAction === "approved") {
        const tierInfo =
          bounty.reward_type === "tiered" && form.selectedTier
            ? `Tier ${form.selectedTier} placement. `
            : "";
        // For ALPH bounties use the stored USD reference; for USD bounties use the bounty amount.
        // Avoid toLocaleString to keep the number parseable by the earnings regex.
        const usdBountyValue =
          bounty.reward.token === "ALPH"
            ? bounty.reward.usd_equivalent
            : getTokenAmount().amount;
        const rewardInfo = `${tierInfo}Reward: ${form.rewardAmount} ALPH (for ${usdBountyValue} USD bounty)`;
        finalReviewerNotes = finalReviewerNotes
          ? `${finalReviewerNotes}\n\n${rewardInfo}`
          : rewardInfo;
      }

      // Update submission status
      await apiClient.updateSubmission(submission.id, {
        status: form.reviewAction,
        reviewer_notes: finalReviewerNotes || undefined,
        transaction_hash: form.transactionHash.trim() || undefined,
      });

      // Close bounty if requested and this is the last spot
      if (form.reviewAction === "approved" && form.closeBounty) {
        console.log("Closing bounty:", bounty.id);
        const closeBountyResponse = await fetch(`/api/bounties/${bounty.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for authentication
          body: JSON.stringify({ status: "completed" }),
        });

        if (!closeBountyResponse.ok) {
          const errorText = await closeBountyResponse.text();
          console.error("Failed to close bounty:", errorText);
          // Don't throw error, just log it - submission was already approved
          console.warn(
            "Bounty could not be closed automatically, but submission was approved",
          );
        } else {
          console.log("Bounty closed successfully");
        }
      }

      // Send notification to submitter
      if (form.reviewAction === "approved") {
        await notificationService.notifySubmissionApproved(
          submission.user_id,
          submission.bounty_id,
          bounty.title,
          parseFloat(form.rewardAmount),
          bounty.reward?.token || "ALPH",
        );
      } else if (form.reviewAction === "rejected") {
        await notificationService.notifySubmissionRejected(
          submission.user_id,
          submission.bounty_id,
          bounty.title,
          form.reviewerNotes,
        );
      }

      // Show success state then reset form
      setSuccessState({ show: true, action: form.reviewAction });
      setForm(initialFormState);
    } catch (err) {
      console.error("Failed to update submission:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update submission. Please try again.";
      const isTxError =
        msg.includes("Transaction not found") ||
        msg.includes("not confirmed yet") ||
        msg.includes("does not contain a payment") ||
        msg.includes("tx hash");
      if (isTxError) {
        setTxError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setForm(initialFormState);
    setSuccessState({ show: false, action: null });
    setError(null);
    setTxError(null);
    onSuccess?.();
    onClose();
  };

  // Reset all form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setForm(initialFormState);
      setSuccessState({ show: false, action: null });
      setError(null);
    }
  }, [isOpen]);

  // Pre-populate form when opening an already-reviewed submission.
  // Runs only when a different submission is opened (keyed on submission.id),
  // not on every render or data refresh.
  useEffect(() => {
    if (!isOpen || !submission) return;
    const { status, transaction_hash, reviewer_notes } = submission;
    if (status === "approved" || status === "rejected") {
      setForm({
        ...initialFormState,
        reviewAction: status,
        transactionHash: transaction_hash || "",
        reviewerNotes: reviewer_notes || "",
      });
    } else if (status === "revision_requested") {
      // Legacy status: no longer selectable, but show saved notes
      setForm({ ...initialFormState, reviewerNotes: reviewer_notes || "" });
    } else {
      setForm(initialFormState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, submission?.id]);

  if (!isOpen || !submission || !bounty) return null;

  // Show success view
  if (successState.show) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-hero-dark rounded-lg max-w-md w-full p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              successState.action === "approved"
                ? "bg-accessible-green/20"
                : "bg-red-500/20"
            }`}
          >
            {successState.action === "approved" ? (
              <CheckCircle className="w-8 h-8 text-accessible-green" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
            {successState.action === "approved"
              ? "Submission Approved!"
              : "Submission Rejected"}
          </h2>
          <p className="text-light-charcoal dark:text-lightgrey mb-6">
            {successState.action === "approved"
              ? "The submitter has been notified and will receive their reward."
              : "The submitter has been notified of your decision."}
          </p>
          <button
            onClick={handleDone}
            className="w-full px-6 py-3 bg-orange hover:bg-orange/90 text-white rounded-lg transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const extractTitle = (description: string | null): string => {
    if (!description) return "Submission";

    // Try to extract title from markdown bold syntax
    const titleMatch = description.match(/^\*\*(.+?)\*\*/);
    if (titleMatch) {
      return titleMatch[1];
    }

    // Fallback to first line
    const firstLine = description.split("\n")[0];
    if (!firstLine) return "Submission";
    return firstLine.substring(0, 50) + (firstLine.length > 50 ? "..." : "");
  };

  const extractDescription = (description: string | null): string => {
    if (!description) return "";

    // Remove title if it exists
    let text = description.replace(/^\*\*(.+?)\*\*\n*/, "");

    return text.trim();
  };

  // Parse tier placement from reviewer_notes
  // Format: "Tier X placement. Reward: Y ALPH (...)"
  const parseTierFromNotes = (notes: string | null): number | null => {
    if (!notes) return null;
    const match = notes.match(/Tier (\d+) placement/);
    return match ? parseInt(match[1]) : null;
  };

  // Parse ALPH reward amount from reviewer_notes
  // Format: "Reward: Y ALPH (...)"
  const parseAlphRewardFromNotes = (notes: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/Reward:\s*([\d.]+)\s*ALPH/);
    return match ? `${match[1]} ALPH` : null;
  };

  const tierPosition = parseTierFromNotes(submission.reviewer_notes ?? null);
  const alphReward = parseAlphRewardFromNotes(
    submission.reviewer_notes ?? null,
  );

  const tierLabel = (pos: number) =>
    pos === 1
      ? "🥇 1st Place"
      : pos === 2
        ? "🥈 2nd Place"
        : pos === 3
          ? "🥉 3rd Place"
          : `${pos}th Place`;

  const isAlreadyReviewed =
    submission.status === "approved" || submission.status === "rejected";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-hero-dark rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
              <div className="text-sm text-light-charcoal dark:text-lightgrey">
                Submitted by:{" "}
                {submission.user_username ? (
                  <Link href={`/bounty/profile/${submission.user_username}`}>
                    <span className="font-medium text-orange hover:text-orange/80 transition-colors cursor-pointer">
                      @{submission.user_username}
                    </span>
                  </Link>
                ) : (
                  <span className="font-medium text-light-charcoal">
                    {`Anonymous (ID: ${submission.user_id?.substring(0, 8) || "unknown"}...)`}
                  </span>
                )}
              </div>
              <span className="text-sm text-light-charcoal dark:text-lightgrey">
                •
              </span>
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

          {/* Already Reviewed Banner */}
          {isAlreadyReviewed && (
            <div
              className={`rounded-lg p-4 border ${
                submission.status === "approved"
                  ? "bg-accessible-green/10 border-accessible-green/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {submission.status === "approved" ? (
                  <CheckCircle className="w-5 h-5 text-accessible-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <span
                  className={`font-bold text-base ${
                    submission.status === "approved"
                      ? "text-accessible-green"
                      : "text-red-500"
                  }`}
                >
                  {submission.status === "approved" ? "Approved" : "Rejected"}
                </span>
              </div>

              {submission.status === "approved" && (
                <div className="space-y-1.5 text-sm">
                  {tierPosition && (
                    <div className="flex items-center gap-2">
                      <span className="text-light-charcoal dark:text-lightgrey">
                        Placement:
                      </span>
                      <span className="font-semibold text-black dark:text-white">
                        {tierLabel(tierPosition)}
                      </span>
                    </div>
                  )}
                  {alphReward && (
                    <div className="flex items-center gap-2">
                      <span className="text-light-charcoal dark:text-lightgrey">
                        Reward Paid:
                      </span>
                      <span className="font-semibold text-accessible-green">
                        {alphReward}
                      </span>
                    </div>
                  )}
                  {submission.transaction_hash && (
                    <div className="flex items-start gap-2">
                      <span className="text-light-charcoal dark:text-lightgrey flex-shrink-0">
                        Tx Hash:
                      </span>
                      <a
                        href={`https://explorer.alephium.org/transactions/${submission.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-accessible-green hover:text-accessible-green/80 break-all flex items-center gap-1"
                      >
                        {submission.transaction_hash.slice(0, 16)}...
                        {submission.transaction_hash.slice(-16)}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-light-charcoal dark:text-lightgrey mt-3">
                You can update the review decision below if needed.
              </p>
            </div>
          )}

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
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, reviewAction: "approved" }))
                  }
                  className={`p-4 border-2 rounded-lg transition-all ${
                    form.reviewAction === "approved"
                      ? "border-accessible-green bg-accessible-green/10"
                      : "border-border-grey dark:border-dark-charcoal hover:border-accessible-green"
                  }`}
                >
                  <CheckCircle
                    className={`w-6 h-6 mx-auto mb-2 ${
                      form.reviewAction === "approved"
                        ? "text-accessible-green"
                        : "text-light-charcoal dark:text-lightgrey"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      form.reviewAction === "approved"
                        ? "text-accessible-green"
                        : "text-black dark:text-white"
                    }`}
                  >
                    Approve
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, reviewAction: "rejected" }))
                  }
                  className={`p-4 border-2 rounded-lg transition-all ${
                    form.reviewAction === "rejected"
                      ? "border-red-500 bg-red-500/10"
                      : "border-border-grey dark:border-dark-charcoal hover:border-red-500"
                  }`}
                >
                  <XCircle
                    className={`w-6 h-6 mx-auto mb-2 ${
                      form.reviewAction === "rejected"
                        ? "text-red-500"
                        : "text-light-charcoal dark:text-lightgrey"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      form.reviewAction === "rejected"
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
                {form.reviewAction === "rejected" && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <textarea
                id="reviewer_notes"
                value={form.reviewerNotes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    reviewerNotes: e.target.value,
                  }))
                }
                placeholder="Provide feedback to the submitter..."
                rows={4}
                className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 resize-none"
                required={form.reviewAction === "rejected"}
              />
            </div>

            {/* Tier Selection (only for approved + tiered bounties) */}
            {form.reviewAction === "approved" &&
              bounty?.reward_type === "tiered" &&
              tieredRewards && (
                <div>
                  <label
                    htmlFor="select_tier"
                    className="block text-sm font-semibold text-black dark:text-white mb-2"
                  >
                    Select Tier Placement{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-black dark:text-white mb-1 font-medium">
                    This is a{" "}
                    <span className="text-orange font-bold">
                      {tieredRewards.length}-tier
                    </span>{" "}
                    bounty with a total of{" "}
                    <span className="text-accessible-green font-bold">
                      {bounty.reward?.amount?.toLocaleString() || "0"}{" "}
                      {bounty.reward?.token || "ALPH"}
                    </span>
                  </p>
                  <p className="text-xs text-light-charcoal dark:text-lightgrey mb-4">
                    Click on a tier below to select the placement for this
                    submission:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {tieredRewards.map((tier) => {
                      return (
                        <button
                          key={tier.position}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              selectedTier: tier.position,
                              rewardAmount: "",
                            }));
                          }}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            form.selectedTier === tier.position
                              ? "border-orange bg-orange/20 shadow-md"
                              : "border-border-grey dark:border-dark-charcoal hover:border-orange bg-white dark:bg-hero-dark"
                          }`}
                        >
                          <div className="text-center">
                            <div
                              className={`text-lg font-bold mb-2 ${
                                form.selectedTier === tier.position
                                  ? "text-orange"
                                  : "text-black dark:text-white"
                              }`}
                            >
                              {tier.position === 1
                                ? "🥇 1st"
                                : tier.position === 2
                                  ? "🥈 2nd"
                                  : tier.position === 3
                                    ? "🥉 3rd"
                                    : `${tier.position}th`}
                            </div>
                            <div className="text-sm font-semibold text-accessible-green">
                              {tier.amount.toLocaleString()} {tier.token}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {form.selectedTier && (
                    <p className="text-xs text-accessible-green mt-3 font-medium">
                      ✓ Selected:{" "}
                      {form.selectedTier === 1
                        ? "1st"
                        : form.selectedTier === 2
                          ? "2nd"
                          : form.selectedTier === 3
                            ? "3rd"
                            : `${form.selectedTier}th`}{" "}
                      place
                    </p>
                  )}
                </div>
              )}

            {/* Reward Amount (only for approved) */}
            {form.reviewAction === "approved" && (
              <div>
                <label
                  htmlFor="reward_amount"
                  className="block text-sm font-semibold text-black dark:text-white mb-2"
                >
                  Payment Amount (ALPH) <span className="text-red-500">*</span>
                </label>

                {/* Show token amount to pay */}
                <div className="mb-3 p-3 bg-accessible-green/10 border border-accessible-green/20 rounded-lg">
                  <p className="text-sm text-light-charcoal dark:text-lightgrey">
                    Bounty Value:{" "}
                    <span className="font-bold text-accessible-green text-base">
                      {getTokenAmount().amount.toLocaleString()}{" "}
                      {getTokenAmount().token}
                    </span>
                  </p>
                  <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1">
                    Enter the amount of ALPH you are sending for this reward
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    id="reward_amount"
                    value={form.rewardAmount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        rewardAmount: e.target.value,
                      }))
                    }
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

                {bounty?.reward_type === "tiered" && !form.selectedTier && (
                  <p className="text-xs text-orange mt-2">
                    ⚠ Please select a tier placement above first
                  </p>
                )}
              </div>
            )}

            {/* Transaction Hash (only for approved) */}
            {form.reviewAction === "approved" && (
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
                  value={form.transactionHash}
                  onChange={(e) => {
                    setTxError(null);
                    setForm((prev) => ({
                      ...prev,
                      transactionHash: e.target.value,
                    }));
                  }}
                  placeholder="0x..."
                  className={`w-full px-4 py-3 bg-smoked-white dark:bg-light-black border rounded-lg text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 font-mono ${
                    txError
                      ? "border-red-500 focus:ring-red-500/50"
                      : "border-border-grey dark:border-dark-charcoal focus:ring-orange/50"
                  }`}
                  required
                />
                {txError ? (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {txError}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                      You can verify the transaction on{" "}
                      <a
                        href={`https://explorer.alephium.org/transactions/${form.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-80"
                      >
                        Alephium Explorer
                      </a>
                      .
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1">
                    Provide the Alephium transaction hash for the reward payment
                  </p>
                )}
              </div>
            )}

            {/* Close Bounty Option (only for approved + single reward bounty) */}
            {form.reviewAction === "approved" &&
              bounty?.reward_type === "fixed" && (
                <div className="p-4 bg-orange/5 border border-orange/20 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.closeBounty}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          closeBounty: e.target.checked,
                        }))
                      }
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
                disabled={isSubmitting || !form.reviewAction}
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
