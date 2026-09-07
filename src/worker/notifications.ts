/**
 * In-app notifications, created server-side.
 *
 * These used to be triggered from the browser: a component would await the
 * state-changing request, then fire a second request to POST /api/notifications.
 * Two problems came out of that.
 *
 * First, the endpoint had to accept an arbitrary `user_id`, `title`, `message`
 * and `link` from whoever called it, with no way to tell a real trigger from a
 * forged one -- anyone could post a "claim your reward" notification with an
 * external link to any user.
 *
 * Second, the notification only happened if the tab stayed open. A closed tab,
 * a dropped connection or an unmounted component left the database updated and
 * the user never told. That is the root cause behind the reviewer requesting
 * changes with no in-app notice, and sponsors never hearing about their own
 * approval -- not a forgotten call site.
 *
 * Everything here runs in the same handler as the state change it describes.
 */

type D1Database = any;

interface NotifyEnv {
  DB: D1Database;
}

export type NotificationType =
  | "submission_accepted"
  | "submission_rejected"
  | "submission_revision_requested"
  | "bounty_completed"
  | "comment_reply"
  | "comment_like"
  | "new_comment"
  | "new_submission"
  | "sponsor_approved"
  | "sponsor_rejected"
  | "sponsor_banned"
  | "sponsor_unbanned"
  | "general";

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  bountyId?: string | null;
  submissionId?: string | null;
}

/**
 * Whether the user has muted this bounty.
 *
 * Checked for every bounty-scoped notification. The old client-side code only
 * checked it on the "new top-level comment" path, so muting a bounty still let
 * replies to your own comments through.
 */
async function isMuted(
  env: NotifyEnv,
  userId: string,
  bountyId: string | null | undefined,
): Promise<boolean> {
  if (!bountyId) return false;
  const row = await env.DB.prepare(
    `SELECT 1 AS x FROM notification_mutes WHERE user_id = ? AND bounty_id = ?`,
  )
    .bind(userId, bountyId)
    .first();
  return row !== null;
}

/**
 * Write one notification. Returns false when it was deliberately skipped
 * (muted, or the actor is the recipient).
 *
 * Never throws: a notification failing must not roll back or 500 the action
 * that triggered it. The caller has already changed state by this point.
 */
export async function notify(
  env: NotifyEnv,
  input: NotifyInput,
): Promise<boolean> {
  try {
    if (!input.userId) return false;
    if (await isMuted(env, input.userId, input.bountyId)) return false;

    await env.DB.prepare(
      `INSERT INTO notifications (
         id, user_id, type, title, message, link,
         related_bounty_id, related_submission_id, read, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        input.userId,
        input.type,
        input.title,
        input.message,
        input.link ?? null,
        input.bountyId ?? null,
        input.submissionId ?? null,
        Math.floor(Date.now() / 1000),
      )
      .run();

    return true;
  } catch (err: any) {
    console.error("[notify] failed:", err?.message ?? err);
    return false;
  }
}

/**
 * Don't notify someone about their own action -- a sponsor commenting on their
 * own bounty, or liking their own comment, should not ping themselves.
 */
export async function notifyUnlessActor(
  env: NotifyEnv,
  actorUserId: string | null,
  input: NotifyInput,
): Promise<boolean> {
  if (actorUserId && actorUserId === input.userId) return false;
  return notify(env, input);
}

// ── Submission review ──────────────────────────────────────────────────────

export async function notifySubmissionReviewed(
  env: NotifyEnv,
  opts: {
    submitterUserId: string;
    bountyId: string;
    submissionId: string;
    bountyTitle: string;
    status: "approved" | "rejected" | "revision_requested";
    reviewerNotes?: string | null;
  },
): Promise<boolean> {
  const link = `/bounty/${opts.bountyId}`;

  // Review outcomes deliberately ignore the mute: muting a bounty silences its
  // comment chatter, not the verdict on your own submission.
  const base = {
    userId: opts.submitterUserId,
    bountyId: null, // bypasses isMuted
    submissionId: opts.submissionId,
    link,
  };

  if (opts.status === "approved") {
    return notify(env, {
      ...base,
      type: "submission_accepted",
      title: "Submission Accepted",
      message: `Your submission to "${opts.bountyTitle}" has been accepted.`,
    });
  }

  if (opts.status === "rejected") {
    return notify(env, {
      ...base,
      type: "submission_rejected",
      title: "Submission Not Selected",
      message: `Your submission to "${opts.bountyTitle}" was not selected.`,
    });
  }

  // Previously email-only, with no in-app notice at all.
  return notify(env, {
    ...base,
    type: "submission_revision_requested",
    title: "Changes Requested",
    message:
      `The sponsor has requested changes to your submission for ` +
      `"${opts.bountyTitle}". You can edit and resubmit it.`,
  });
}

export async function notifyNewSubmission(
  env: NotifyEnv,
  opts: {
    sponsorUserId: string;
    actorUserId: string;
    bountyId: string;
    submissionId: string;
    bountyTitle: string;
    submitterName: string;
  },
): Promise<boolean> {
  return notifyUnlessActor(env, opts.actorUserId, {
    userId: opts.sponsorUserId,
    type: "new_submission",
    title: "New Submission",
    message: `${opts.submitterName} submitted to "${opts.bountyTitle}".`,
    link: `/bounty/${opts.bountyId}`,
    bountyId: opts.bountyId,
    submissionId: opts.submissionId,
  });
}

// ── Sponsor status ─────────────────────────────────────────────────────────

export async function notifySponsorStatusChanged(
  env: NotifyEnv,
  opts: {
    sponsorUserId: string;
    sponsorName: string;
    change: "verified" | "unverified" | "banned" | "unbanned";
  },
): Promise<boolean> {
  const copy: Record<
    typeof opts.change,
    { type: NotificationType; title: string; message: string }
  > = {
    verified: {
      type: "sponsor_approved",
      title: "Sponsor Account Verified",
      message: `"${opts.sponsorName}" is verified. You can now create bounties.`,
    },
    unverified: {
      type: "sponsor_rejected",
      title: "Sponsor Verification Removed",
      message: `Verification for "${opts.sponsorName}" has been removed. You cannot create new bounties until it is restored.`,
    },
    banned: {
      type: "sponsor_banned",
      title: "Sponsor Account Suspended",
      message: `"${opts.sponsorName}" has been suspended and cannot create bounties.`,
    },
    unbanned: {
      type: "sponsor_unbanned",
      title: "Sponsor Account Restored",
      message: `"${opts.sponsorName}" has been restored.`,
    },
  };

  const c = copy[opts.change];
  return notify(env, {
    userId: opts.sponsorUserId,
    type: c.type,
    title: c.title,
    message: c.message,
    link: "/bounty/sponsor/dashboard",
  });
}

// ── Comments ───────────────────────────────────────────────────────────────

export async function notifyCommentReply(
  env: NotifyEnv,
  opts: {
    parentAuthorUserId: string;
    actorUserId: string;
    bountyId: string;
    replierName: string;
  },
): Promise<boolean> {
  return notifyUnlessActor(env, opts.actorUserId, {
    userId: opts.parentAuthorUserId,
    type: "comment_reply",
    title: "New Reply",
    message: `${opts.replierName} replied to your comment.`,
    link: `/bounty/${opts.bountyId}`,
    bountyId: opts.bountyId,
  });
}

export async function notifyNewComment(
  env: NotifyEnv,
  opts: {
    sponsorUserId: string;
    actorUserId: string;
    bountyId: string;
    bountyTitle: string;
    commenterName: string;
  },
): Promise<boolean> {
  return notifyUnlessActor(env, opts.actorUserId, {
    userId: opts.sponsorUserId,
    type: "new_comment",
    title: "New Comment",
    message: `${opts.commenterName} commented on "${opts.bountyTitle}".`,
    link: `/bounty/${opts.bountyId}`,
    bountyId: opts.bountyId,
  });
}

export async function notifyCommentLike(
  env: NotifyEnv,
  opts: {
    commentAuthorUserId: string;
    actorUserId: string;
    bountyId: string;
    likerName: string;
  },
): Promise<boolean> {
  return notifyUnlessActor(env, opts.actorUserId, {
    userId: opts.commentAuthorUserId,
    type: "comment_like",
    title: "Comment Liked",
    message: `${opts.likerName} liked your comment.`,
    link: `/bounty/${opts.bountyId}`,
    bountyId: opts.bountyId,
  });
}
