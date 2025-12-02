/**
 * Notification Service
 * Handles creating notifications for various events in the bounty system
 */
import { apiClient } from "@/lib/api-client";

export type NotificationType =
  | "submission_accepted"
  | "submission_rejected"
  | "bounty_completed"
  | "comment_reply"
  | "comment_like"
  | "new_comment"
  | "new_submission"
  | "sponsor_approved"
  | "sponsor_rejected"
  | "general";

interface NotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a notification
 */
async function createNotification(data: NotificationData) {
  try {
    await apiClient.createNotification(data);
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Notify sponsor when their application is approved
 */
export async function notifySponsorApproved(
  userId: string,
  sponsorName: string,
) {
  await createNotification({
    user_id: userId,
    type: "sponsor_approved",
    title: "Sponsor Application Approved",
    message: `Congratulations! Your sponsor application for "${sponsorName}" has been approved. You can now create bounties.`,
    link: "/bounty/sponsor/dashboard",
  });
}

/**
 * Notify sponsor when their application is rejected
 */
export async function notifySponsorRejected(
  userId: string,
  sponsorName: string,
  reason?: string,
) {
  await createNotification({
    user_id: userId,
    type: "sponsor_rejected",
    title: "Sponsor Application Rejected",
    message: reason
      ? `Your sponsor application for "${sponsorName}" was rejected. Reason: ${reason}`
      : `Your sponsor application for "${sponsorName}" was rejected. Please contact support for more information.`,
    link: "/bounty/sponsor/create",
  });
}

/**
 * Notify user when their submission is approved
 */
export async function notifySubmissionApproved(
  userId: string,
  bountyId: string,
  bountyTitle: string,
  rewardAmount?: number,
  rewardCurrency?: string,
) {
  const rewardText =
    rewardAmount && rewardCurrency
      ? ` You've earned ${rewardAmount} ${rewardCurrency}!`
      : "";
  await createNotification({
    user_id: userId,
    type: "submission_accepted",
    title: "Submission Approved",
    message: `Your submission for "${bountyTitle}" has been approved!${rewardText}`,
    link: `/bounty/${bountyId}`,
  });
}

/**
 * Notify user when their submission is rejected
 */
export async function notifySubmissionRejected(
  userId: string,
  bountyId: string,
  bountyTitle: string,
  feedback?: string,
) {
  await createNotification({
    user_id: userId,
    type: "submission_rejected",
    title: "Submission Rejected",
    message: feedback
      ? `Your submission for "${bountyTitle}" was rejected. Feedback: ${feedback}`
      : `Your submission for "${bountyTitle}" was rejected.`,
    link: `/bounty/${bountyId}`,
  });
}

/**
 * Notify sponsor when their bounty receives a new submission
 */
export async function notifyNewSubmission(
  sponsorUserId: string,
  bountyId: string,
  bountyTitle: string,
  submitterUsername?: string,
) {
  const submitterText = submitterUsername ? ` from ${submitterUsername}` : "";
  await createNotification({
    user_id: sponsorUserId,
    type: "new_submission",
    title: "New Submission",
    message: `Your bounty "${bountyTitle}" received a new submission${submitterText}.`,
    link: "/bounty/sponsor/dashboard",
  });
}

/**
 * Notify user when someone replies to their comment
 */
export async function notifyCommentReply(
  userId: string,
  bountyId: string,
  bountyTitle: string,
  replierUsername?: string,
) {
  const replierText = replierUsername
    ? `${replierUsername} replied`
    : "Someone replied";
  await createNotification({
    user_id: userId,
    type: "comment_reply",
    title: "New Reply",
    message: `${replierText} to your comment on "${bountyTitle}".`,
    link: `/bounty/${bountyId}`,
  });
}

/**
 * Notify user when someone likes their comment
 */
export async function notifyCommentLike(
  userId: string,
  bountyId: string,
  bountyTitle: string,
  likerUsername?: string,
) {
  const likerText = likerUsername ? `${likerUsername} liked` : "Someone liked";
  await createNotification({
    user_id: userId,
    type: "comment_like",
    title: "Comment Liked",
    message: `${likerText} your comment on "${bountyTitle}".`,
    link: `/bounty/${bountyId}`,
  });
}

/**
 * Notify sponsor when someone comments on their bounty (if not muted)
 */
export async function notifyNewComment(
  sponsorUserId: string,
  bountyId: string,
  bountyTitle: string,
  commenterUsername?: string,
) {
  const commenterText = commenterUsername
    ? `${commenterUsername} commented`
    : "Someone commented";
  await createNotification({
    user_id: sponsorUserId,
    type: "new_comment",
    title: "New Comment",
    message: `${commenterText} on your bounty "${bountyTitle}".`,
    link: `/bounty/${bountyId}`,
  });
}

/**
 * Check if notifications should be sent (respecting mute preferences)
 */
export async function shouldNotify(
  userId: string,
  bountyId: string,
  type: "comments" | "submissions",
): Promise<boolean> {
  try {
    // Check if user has muted notifications for this bounty
    const { muted } = await apiClient.checkNotificationMute(bountyId, userId);
    // If muted, don't send notifications (for any type)
    return !muted;
  } catch {
    return true; // Default to sending notifications if check fails
  }
}

export const notificationService = {
  createNotification,
  notifySponsorApproved,
  notifySponsorRejected,
  notifySubmissionApproved,
  notifySubmissionRejected,
  notifyNewSubmission,
  notifyCommentReply,
  notifyCommentLike,
  notifyNewComment,
  shouldNotify,
};
