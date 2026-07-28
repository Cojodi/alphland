/**
 * Deadline and overdue-review reminders.
 *
 * Runs from the same hourly cron as the price refresh. "Hourly" is the
 * trigger, not the cadence of any individual reminder — each one below is
 * meant to reach a given person once, and that is enforced by alreadySent()
 * against email_logs rather than by the schedule. Without that check every
 * reminder would go out twenty-four times a day, which is the specific
 * failure migration 030 exists to prevent.
 *
 * Nothing here throws: a reminder failure must not take down the price
 * refresh or the address indexer that share the scheduled handler.
 */

import { Env } from "./index";
import {
  alreadySent,
  sendAndLog,
  notifyBountyDeadlineSoon,
  notifySponsorReviewOverdue,
  notifyAdminReviewEscalation,
} from "./email";

const HOUR = 3600;
const DAY = 24 * HOUR;

/** How close to the deadline the "closing soon" nudge goes out. */
export const DEADLINE_WARN_SECONDS = 48 * HOUR;
/** How long after the deadline the sponsor is reminded to review. */
export const REVIEW_OVERDUE_SECONDS = 7 * DAY;
/** How long after the deadline an unreviewed bounty is escalated to admins. */
export const REVIEW_ESCALATE_SECONDS = 14 * DAY;

export interface ReminderCounts {
  deadlineSoon: number;
  reviewOverdue: number;
  escalated: number;
}

/**
 * Bounties whose deadline falls inside the warning window.
 *
 * Bounded on both sides: a bounty that closed three weeks ago is not
 * "closing soon", and without the lower bound every past bounty would match
 * forever and be re-checked on every run.
 */
async function closingSoon(env: Env, now: number) {
  const { results } = await env.DB.prepare(
    `SELECT id, title, end_date
       FROM bounties
      WHERE is_published = 1
        AND is_winners_announced = 0
        AND status = 'open'
        AND end_date IS NOT NULL
        AND end_date > ?
        AND end_date <= ?`,
  )
    .bind(now, now + DEADLINE_WARN_SECONDS)
    .all();

  return (results ?? []) as { id: string; title: string; end_date: number }[];
}

/**
 * Nudge people who bookmarked a bounty that is about to close.
 *
 * Bookmarkers, not submitters: someone who already submitted has nothing to
 * do with this information, and telling them their own deadline is about to
 * pass reads as a demand rather than a reminder.
 */
async function remindBookmarkers(env: Env, now: number): Promise<number> {
  let sent = 0;

  for (const bounty of await closingSoon(env, now)) {
    const { results } = await env.DB.prepare(
      `SELECT u.id as user_id, u.email, u.name
         FROM bookmarks bm
         JOIN user u ON bm.user_id = u.id
        WHERE bm.bounty_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM bounty_submissions s
             WHERE s.bounty_id = bm.bounty_id AND s.user_id = bm.user_id
          )`,
    )
      .bind(bounty.id)
      .all();

    for (const row of (results ?? []) as {
      user_id: string;
      email: string;
      name: string | null;
    }[]) {
      if (!row.email) continue;

      const ctx = { userId: row.user_id, bountyId: bounty.id };
      if (await alreadySent(env, "bounty_deadline", ctx)) continue;

      await notifyBountyDeadlineSoon(env, row, bounty);
      sent++;
    }
  }

  return sent;
}

/** Bounties past their deadline by at least `after` seconds, still unjudged. */
async function overdueForReview(env: Env, now: number, after: number) {
  const { results } = await env.DB.prepare(
    `SELECT b.id, b.title, b.end_date,
            s.name as sponsor_name,
            u.id as sponsor_user_id, u.email as sponsor_email, u.name as sponsor_contact,
            (SELECT COUNT(*) FROM bounty_submissions bs WHERE bs.bounty_id = b.id) as submission_count
       FROM bounties b
       JOIN sponsors s ON b.sponsor_id = s.id
       JOIN user u ON s.user_id = u.id
      WHERE b.is_published = 1
        AND b.is_winners_announced = 0
        AND b.status NOT IN ('cancelled', 'deleted')
        AND b.end_date IS NOT NULL
        AND b.end_date <= ?`,
  )
    .bind(now - after)
    .all();

  // Only bounties that actually received something are worth chasing — a
  // bounty nobody entered has nothing for the sponsor to review.
  return ((results ?? []) as any[]).filter((r) => r.submission_count > 0);
}

/** Remind the sponsor that submissions are waiting on them. */
async function remindSponsors(env: Env, now: number): Promise<number> {
  let sent = 0;

  for (const b of await overdueForReview(env, now, REVIEW_OVERDUE_SECONDS)) {
    if (!b.sponsor_email) continue;

    const ctx = { userId: b.sponsor_user_id, bountyId: b.id };
    if (await alreadySent(env, "review_overdue", ctx)) continue;

    await notifySponsorReviewOverdue(env, b);
    sent++;
  }

  return sent;
}

/**
 * Escalate to admins when a bounty has sat unreviewed for two weeks.
 *
 * The original plan flagged the *sponsor* as needing manual review, but a
 * per-sponsor risk flag is exactly the `isCaution` column that was rejected —
 * this platform does not hold funds, so it has no basis for scoring sponsors.
 * Telling the admins is the part that was actually wanted: a human decides
 * what to do, and nothing is recorded against the sponsor automatically.
 */
async function escalateToAdmins(env: Env, now: number): Promise<number> {
  const stale = await overdueForReview(env, now, REVIEW_ESCALATE_SECONDS);
  if (stale.length === 0) return 0;

  const { results } = await env.DB.prepare(
    `SELECT id, email FROM user WHERE role = 'god' AND email IS NOT NULL`,
  ).all();

  const admins = (results ?? []) as { id: string; email: string }[];
  if (admins.length === 0) return 0;

  let sent = 0;
  for (const b of stale) {
    for (const admin of admins) {
      const ctx = { userId: admin.id, bountyId: b.id };
      // Transactional: no category, so it is never suppressed by an opt-out.
      if (await alreadySent(env, "review_escalation", ctx)) continue;

      await notifyAdminReviewEscalation(env, admin, b);
      sent++;
    }
  }

  return sent;
}

/**
 * Called once per hour by the scheduled handler.
 *
 * Each stage is isolated: one failing query must not stop the others, since
 * they are independent reminders with independent audiences.
 */
export async function runBountyReminders(env: Env): Promise<ReminderCounts> {
  const now = Math.floor(Date.now() / 1000);
  const counts: ReminderCounts = {
    deadlineSoon: 0,
    reviewOverdue: 0,
    escalated: 0,
  };

  for (const [key, fn] of [
    ["deadlineSoon", remindBookmarkers],
    ["reviewOverdue", remindSponsors],
    ["escalated", escalateToAdmins],
  ] as const) {
    try {
      counts[key] = await fn(env, now);
    } catch (err: any) {
      console.error(`[reminders] ${key} failed:`, err?.message ?? err);
    }
  }

  if (counts.deadlineSoon || counts.reviewOverdue || counts.escalated) {
    console.log(
      `[reminders] sent ${counts.deadlineSoon} deadline, ` +
        `${counts.reviewOverdue} overdue, ${counts.escalated} escalation`,
    );
  }

  return counts;
}

// Re-exported so tests can drive a single stage without the wrapper.
export { remindBookmarkers, remindSponsors, escalateToAdmins, sendAndLog };
