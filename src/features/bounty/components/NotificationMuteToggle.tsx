"use client";

import { apiClient } from "@/lib/api-client";
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
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkMuteStatus = async () => {
      try {
        const result = await apiClient.checkNotificationMute(bountyId, userId);
        setIsMuted(result.muted);
      } catch (error) {
        console.error("Failed to check notification mute status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkMuteStatus();
  }, [bountyId, userId]);

  const handleToggle = async () => {
    setIsSaving(true);
    try {
      if (isMuted) {
        // Unmute notifications
        await apiClient.unmuteNotifications(bountyId, userId);
        setIsMuted(false);
      } else {
        // Mute notifications
        await apiClient.muteNotifications({
          user_id: userId,
          bounty_id: bountyId,
        });
        setIsMuted(true);
      }
    } catch (error) {
      console.error("Failed to update notification settings:", error);
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
        {/* Single toggle for all notifications */}
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="text-sm text-black dark:text-white">
              All Notifications
            </span>
          </div>
          <button
            onClick={handleToggle}
            disabled={isSaving}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              isMuted ? "bg-light-charcoal dark:bg-dark-charcoal" : "bg-orange"
            } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                isMuted ? "translate-x-0" : "translate-x-5"
              }`}
            />
          </button>
        </label>
      </div>

      <p className="text-xs text-light-charcoal dark:text-lightgrey">
        {isMuted
          ? "All notifications are muted for this bounty"
          : "You'll receive all notifications for this bounty"}
      </p>
    </div>
  );
}
