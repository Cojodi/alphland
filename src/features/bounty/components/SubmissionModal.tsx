"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { notificationService } from "../services/notificationService";
import { normalizeUrl } from "../utils/validators";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bountyId: string;
  bountyTitle: string;
  userId: string;
  username?: string;
  sponsorUserId?: string;
  onSuccess?: () => void;
}

export function SubmissionModal({
  isOpen,
  onClose,
  bountyId,
  bountyTitle,
  userId,
  username,
  sponsorUserId,
  onSuccess,
}: SubmissionModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    submission_url: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError("Please provide a title for your submission");
      return;
    }

    if (!formData.submission_url.trim()) {
      setError("Please provide a submission URL");
      return;
    }

    // Validate URL format
    try {
      new URL(formData.submission_url);
    } catch {
      setError("Please provide a valid URL");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create submission with title and notes combined in description
      const descriptionWithNotes = formData.notes
        ? `${formData.description}\n\n**Notes:**\n${formData.notes}`
        : formData.description;

      const result = await apiClient.createSubmission({
        bounty_id: bountyId,
        submitted_by: userId,
        submission_url: formData.submission_url,
        description: `**${formData.title}**\n\n${descriptionWithNotes}`,
      });

      // Notify sponsor if available
      if (sponsorUserId) {
        await notificationService.notifyNewSubmission(
          sponsorUserId,
          bountyId,
          bountyTitle,
          username,
          result.submission?.id,
        );
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        submission_url: "",
        notes: "",
      });

      // Call success callback
      onSuccess?.();

      // Close modal
      onClose();
    } catch (err) {
      console.error("Failed to create submission:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-hero-dark rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-grey dark:border-dark-charcoal sticky top-0 bg-white dark:bg-hero-dark z-10">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white">
              Submit Your Work
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-black dark:text-white mb-2"
            >
              Submission Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., My Awesome Project"
              className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-black dark:text-white mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your submission and how it meets the bounty requirements..."
              rows={4}
              className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 resize-none"
            />
          </div>

          {/* Submission URL */}
          <div>
            <label
              htmlFor="submission_url"
              className="block text-sm font-semibold text-black dark:text-white mb-2"
            >
              Submission URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="submission_url"
              name="submission_url"
              value={formData.submission_url}
              onChange={handleChange}
              onBlur={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  submission_url: normalizeUrl(e.target.value),
                }))
              }
              placeholder="https://github.com/username/repo or https://demo.example.com"
              className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50"
              required
            />
            <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1">
              Link to your GitHub repo, live demo, or documentation
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-black dark:text-white mb-2"
            >
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information you'd like to share with the sponsor..."
              rows={3}
              className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 resize-none"
            />
          </div>

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
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-accessible-green hover:bg-accessible-green/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Work"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
