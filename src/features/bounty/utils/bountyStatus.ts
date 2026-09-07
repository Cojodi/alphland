/**
 * Derived bounty display status — shared by the frontend and the worker.
 *
 * Storage keeps orthogonal, indexable facts (`status`, `is_published`,
 * `is_winners_announced`, `end_date`, winner and payment counts). What a
 * viewer should be told is derived here, in one place, so that adding a
 * display state costs no migration and the two sides can never disagree
 * about what a bounty currently is.
 *
 * Deliberately dependency-free: this file is imported by the Cloudflare
 * Worker as well as by React, so it must not pull in either environment.
 */

export type BountyDisplayStatus =
  | "Cancelled"
  | "Draft"
  | "Unpublished"
  | "In Progress"
  | "In Review"
  | "Payment Pending"
  | "Completed";

/** The subset of a bounty row the derivation actually reads. */
export interface BountyStatusInput {
  status?: string | null;
  is_published?: number | boolean | null;
  published_at?: number | null;
  is_winners_announced?: number | boolean | null;
  /** Unix seconds, or an ISO string — both appear in this codebase. */
  end_date?: number | string | null;
}

/** Counts that decide whether an announced bounty is settled. */
export interface BountySettlement {
  winnerCount: number;
  paidCount: number;
}

const truthy = (v: number | boolean | null | undefined) =>
  v === true || v === 1;

/**
 * Normalise a deadline to unix milliseconds.
 *
 * bounties.end_date is INTEGER unix seconds in D1, but several client paths
 * carry it as an ISO string. Returns null for anything unparseable, and
 * callers treat "no deadline" as not-yet-passed rather than guessing.
 */
export function endDateMs(
  end: number | string | null | undefined,
): number | null {
  if (end === null || end === undefined || end === "") return null;

  if (typeof end === "number") {
    if (!Number.isFinite(end)) return null;
    // Values this small are seconds, not milliseconds. A bounty deadline in
    // 1970 is not a thing anyone means.
    return end < 1e11 ? end * 1000 : end;
  }

  const numeric = Number(end);
  if (Number.isFinite(numeric) && end.trim() !== "") {
    return numeric < 1e11 ? numeric * 1000 : numeric;
  }

  const parsed = Date.parse(end);
  return Number.isFinite(parsed) ? parsed : null;
}

/** True once the deadline is in the past. No deadline means never passed. */
export function deadlinePassed(
  end: number | string | null | undefined,
  now: number = Date.now(),
): boolean {
  const ms = endDateMs(end);
  return ms !== null && now >= ms;
}

/**
 * What to show for this bounty.
 *
 * Order matters — the first matching rule wins:
 *
 *   cancelled/deleted            -> Cancelled     (terminal, outranks everything)
 *   not published, never was     -> Draft
 *   not published, was before    -> Unpublished
 *   published, deadline ahead    -> In Progress
 *   published, deadline passed   -> In Review     (awaiting the sponsor)
 *   announced, not all paid      -> Payment Pending
 *   announced, all paid          -> Completed
 *
 * `settlement` is optional: callers that have not counted winners and
 * payments still get every state up to "Payment Pending", which is the honest
 * answer when you do not know whether payment finished.
 */
export function getBountyDisplayStatus(
  bounty: BountyStatusInput,
  settlement?: BountySettlement,
  now: number = Date.now(),
): BountyDisplayStatus {
  if (bounty.status === "cancelled" || bounty.status === "deleted") {
    return "Cancelled";
  }

  if (!truthy(bounty.is_published)) {
    return bounty.published_at ? "Unpublished" : "Draft";
  }

  if (!truthy(bounty.is_winners_announced)) {
    return deadlinePassed(bounty.end_date, now) ? "In Review" : "In Progress";
  }

  // Announced. Without counts we cannot claim it is finished, and claiming
  // "Completed" wrongly is the worse error of the two.
  if (!settlement) return "Payment Pending";

  const { winnerCount, paidCount } = settlement;
  if (winnerCount > 0 && paidCount >= winnerCount) return "Completed";
  return "Payment Pending";
}

/** Statuses that mean the bounty is visible and accepting submissions. */
export function isAcceptingSubmissions(
  bounty: BountyStatusInput,
  now: number = Date.now(),
): boolean {
  return getBountyDisplayStatus(bounty, undefined, now) === "In Progress";
}
