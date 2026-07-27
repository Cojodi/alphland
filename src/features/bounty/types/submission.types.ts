// Submission related types

export type SubmissionStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "revision_requested";

/**
 * A submission as the API actually returns it.
 *
 * Field names match the `bounty_submissions` columns, plus the joined columns
 * listed below. They previously did not: the type promised `submitted_at`,
 * `completed_at`, `review_started_at`, `title` and `tweet_url`, none of which
 * any endpoint sends. TypeScript cannot catch that, so each one was a silent
 * `undefined` at runtime -- which is how the sponsor dashboard ended up
 * rendering a blank review date for every submission.
 *
 * Keep this in step with the database: `submission-type-drift.test.ts` fails
 * if a field is neither a real column nor a registered join alias.
 */
export interface Submission {
  // ── Columns on bounty_submissions ──
  id: string;
  bounty_id: string;
  user_id: string;
  description: string;
  submission_url: string;
  status: SubmissionStatus;
  reviewer_notes?: string;
  reviewed_by?: string | null;
  reviewed_at?: number | null;
  transaction_hash?: string;
  created_at: number;
  updated_at?: number;

  /** Structured review outcome — replaces parsing reviewer_notes. */
  is_winner?: number;
  winner_position?: number | null;
  reward_amount?: number | null;
  reward_currency?: string | null;
  reward_usd?: number | null;
  is_paid?: number;
  paid_at?: number | null;
  label?: string;

  // ── Joined in by the API, not columns ──
  sponsor_id?: string;
  bounty_title?: string;
  user_username?: string;
  user_avatar_url?: string;
  user_wallet_address?: string;
}

export interface SubmissionFormData {
  title: string;
  description: string;
  submission_url: string;
  tweet_url?: string;
}
