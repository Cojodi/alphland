"use client";

import { useState } from "react";
import {
  X,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { apiClient, BountySubmission } from "@/lib/api-client";
import { notificationService } from "../services/notificationService";

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: BountySubmission | null;
  bountyTitle: string;
  onSuccess?: () => void;
}

export function SubmissionReviewModal({
  isOpen,
  onClose,
  submission,
  bountyTitle,
  onSuccess,
}: SubmissionReviewModalProps) {
  const [reviewAction, setReviewAction] = useState<
    "approved" | "rejected" | "revision_requested" | null
  >(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!submission || !reviewAction) {
      setError("Please select a review action");
      return;
    }

    if (reviewAction === "approved" && !transactionHash.trim()) {
      setError("Please provide a transaction hash for approved submissions");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update submission status
      await apiClient.updateSubmission(submission.id, {
        status: reviewAction,
        reviewer_notes: reviewerNotes.trim() || undefined,
        transaction_hash: transactionHash.trim() || undefined,
      });

      // Send notification to submitter
      if (reviewAction === "approved") {
        await notificationService.notifySubmissionApproved(
          submission.submitted_by,
          submission.bounty_id,
          bountyTitle,
        );
      } else if (reviewAction === "rejected") {
        await notificationService.notifySubmissionRejected(
          submission.submitted_by,
          submission.bounty_id,
          bountyTitle,
          reviewerNotes,
        );
      }

      // Reset form
      setReviewAction(null);
      setReviewerNotes("");
      setTransactionHash("");

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
              {bountyTitle}
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

            <div className="flex items-center gap-3">
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
