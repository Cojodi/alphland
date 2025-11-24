"use client";

import { apiClient, NotificationPreference } from "@/lib/api-client";
import { useState, useEffect } from "react";

interface NotificationMuteToggleProps {
  userId: string;
  bountyId: string;
  bountyTitle: string;
}

export function NotificationMuteToggle({
  userId,
  bountyId,
  bountyTitle,
}: NotificationMuteToggleProps) {
  const [preference, setPreference] = useState<NotificationPreference | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const result = await apiClient.getNotificationPreferenceForBounty(
          bountyId,
          userId
        );
        setPreference(result.preference);
      } catch (error) {
        console.error("Failed to load notification preference:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreference();
  }, [bountyId, userId]);

  const handleToggle = async (type: "comments" | "submissions") => {
    setIsSaving(true);
    try {
      const newMuteComments =
        type === "comments"
          ? preference?.mute_comments === 1
            ? false
            : true
          : preference?.mute_comments === 1;
      const newMuteSubmissions =
        type === "submissions"
          ? preference?.mute_submissions === 1
            ? false
            : true
          : preference?.mute_submissions === 1;

      const result = await apiClient.setNotificationPreference({
        user_id: userId,
        bounty_id: bountyId,
        mute_comments: newMuteComments,
        mute_submissions: newMuteSubmissions,
      });
      setPreference(result.preference);
    } catch (error) {
      console.error("Failed to update notification preference:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-light-charcoal dark:text-lightgrey">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading preferences...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-black dark:text-white">
        Notification Settings
      </h4>
      <p className="text-xs text-light-charcoal dark:text-lightgrey">
        Manage notifications for &quot;{bountyTitle}&quot;
      </p>

      <div className="space-y-2">
        {/* Comments Toggle */}
        <label className="flex items-center justify-between p-3 bg-smoked-white dark:bg-light-black rounded-lg cursor-pointer">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-light-charcoal dark:text-lightgrey"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm text-black dark:text-white">Comments</span>
          </div>
          <button
            onClick={() => handleToggle("comments")}
            disabled={isSaving}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              preference?.mute_comments === 1
                ? "bg-light-charcoal dark:bg-dark-charcoal"
                : "bg-orange"
            } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                preference?.mute_comments === 1
                  ? "translate-x-0"
                  : "translate-x-5"
              }`}
            />
          </button>
        </label>

        {/* Submissions Toggle */}
        <label className="flex items-center justify-between p-3 bg-smoked-white dark:bg-light-black rounded-lg cursor-pointer">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-light-charcoal dark:text-lightgrey"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm text-black dark:text-white">
              New Submissions
            </span>
          </div>
          <button
            onClick={() => handleToggle("submissions")}
            disabled={isSaving}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              preference?.mute_submissions === 1
                ? "bg-light-charcoal dark:bg-dark-charcoal"
                : "bg-orange"
            } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                preference?.mute_submissions === 1
                  ? "translate-x-0"
                  : "translate-x-5"
              }`}
            />
          </button>
        </label>
      </div>

      <p className="text-xs text-light-charcoal dark:text-lightgrey">
        {preference?.mute_comments === 1 || preference?.mute_submissions === 1
          ? "Some notifications are muted"
          : "You'll receive all notifications"}
      </p>
    </div>
  );
}
