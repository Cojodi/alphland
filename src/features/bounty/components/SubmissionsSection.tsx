"use client";

import { useState, useEffect } from "react";
import { apiClient, BountySubmission } from "@/lib/api-client";
import {
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const SUBMISSIONS_PER_PAGE = 10;

interface SubmissionsSectionProps {
  userId: string;
}

export function SubmissionsSection({ userId }: SubmissionsSectionProps) {
  const [submissions, setSubmissions] = useState<BountySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const { submissions: data } =
          await apiClient.getSubmissionsByUser(userId);
        // Sort by created_at descending (newest first)
        const sorted = data.sort(
          (a: BountySubmission, b: BountySubmission) =>
            Number(b.created_at) - Number(a.created_at),
        );
        setSubmissions(sorted);
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
        setError("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [userId]);

  // Pagination logic
  const totalPages = Math.ceil(submissions.length / SUBMISSIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * SUBMISSIONS_PER_PAGE;
  const paginatedSubmissions = submissions.slice(
    startIndex,
    startIndex + SUBMISSIONS_PER_PAGE,
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-accessible-green" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "revision_requested":
        return <AlertCircle className="w-5 h-5 text-orange" />;
      default:
        return (
          <Clock className="w-5 h-5 text-light-charcoal dark:text-lightgrey" />
        );
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "revision_requested":
        return "Revision Requested";
      default:
        return "Pending Review";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-accessible-green bg-accessible-green/10 border-accessible-green/20";
      case "rejected":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "revision_requested":
        return "text-orange bg-orange/10 border-orange/20";
      default:
        return "text-light-charcoal dark:text-lightgrey bg-smoked-white dark:bg-light-black border-border-grey dark:border-dark-charcoal";
    }
  };

  const formatDate = (timestamp: string | number) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  const extractNotes = (description: string | null): string | null => {
    if (!description) return null;
    const notesMatch = description.match(/\*\*Notes:\*\*\n([\s\S]+)$/);
    return notesMatch ? notesMatch[1].trim() : null;
  };

  if (loading) {
    return (
      <section className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
        <h2 className="text-xl font-bold text-black dark:text-white mb-4">
          My Submissions
        </h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-smoked-white dark:bg-light-black rounded-lg"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
        <h2 className="text-xl font-bold text-black dark:text-white mb-4">
          My Submissions
        </h2>
        <p className="text-light-charcoal dark:text-lightgrey">{error}</p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
      <h2 className="text-xl font-bold text-black dark:text-white mb-4">
        My Submissions
        <span className="ml-2 text-sm font-normal text-light-charcoal dark:text-lightgrey">
          ({submissions.length})
        </span>
      </h2>

      {submissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-smoked-white dark:bg-light-black flex items-center justify-center">
            <Clock className="w-8 h-8 text-light-charcoal dark:text-lightgrey" />
          </div>
          <p className="text-light-charcoal dark:text-lightgrey mb-2">
            No submissions yet
          </p>
          <p className="text-sm text-light-charcoal dark:text-lightgrey">
            Start by submitting your work to bounties!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-border-grey dark:border-dark-charcoal rounded-lg p-4 hover:border-orange transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-black dark:text-white mb-2">
                      {extractTitle(submission.description)}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-light-charcoal dark:text-lightgrey mb-3">
                      <Link href={`/bounty/${submission.bounty_id}`}>
                        <a className="text-orange hover:underline">
                          {submission.bounty_title || submission.bounty_id}
                        </a>
                      </Link>
                      <span>•</span>
                      <span>{formatDate(submission.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          submission.status,
                        )}`}
                      >
                        {getStatusIcon(submission.status)}
                        {getStatusText(submission.status)}
                      </div>

                      {submission.submission_url && (
                        <a
                          href={submission.submission_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-orange hover:text-orange/80 transition-colors"
                        >
                          View Work
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {extractNotes(submission.description) && (
                      <div className="mt-3 p-3 bg-smoked-white dark:bg-light-black rounded-lg">
                        <p className="text-xs font-semibold text-black dark:text-white mb-1">
                          Additional Notes:
                        </p>
                        <p className="text-sm text-light-charcoal dark:text-lightgrey">
                          {extractNotes(submission.description)}
                        </p>
                      </div>
                    )}

                    {submission.feedback && (
                      <div className="mt-3 p-3 bg-smoked-white dark:bg-light-black rounded-lg">
                        <p className="text-xs font-semibold text-black dark:text-white mb-1">
                          Reviewer Notes:
                        </p>
                        <p className="text-sm text-light-charcoal dark:text-lightgrey">
                          {submission.feedback}
                        </p>
                      </div>
                    )}

                    {submission.transaction_hash && (
                      <div className="mt-3 p-3 bg-accessible-green/5 border border-accessible-green/20 rounded-lg">
                        <p className="text-xs font-semibold text-accessible-green mb-1">
                          Payment Transaction:
                        </p>
                        <a
                          href={`https://explorer.alephium.org/transactions/${submission.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-accessible-green hover:text-accessible-green/80 transition-colors font-mono break-all flex items-center gap-1"
                        >
                          {submission.transaction_hash.slice(0, 16)}...
                          {submission.transaction_hash.slice(-16)}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border-grey dark:border-dark-charcoal">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border-grey dark:border-dark-charcoal hover:border-orange disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-light-charcoal dark:text-lightgrey px-4">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border-grey dark:border-dark-charcoal hover:border-orange disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
