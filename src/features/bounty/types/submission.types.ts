// Submission related types

export type SubmissionStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "revision_requested";

export interface Submission {
  id: string;
  bounty_id: string;
  user_id: string;
  sponsor_id: string;
  title: string;
  description: string;
  submission_url: string;
  tweet_url?: string;
  status: SubmissionStatus;
  reviewer_notes?: string;
  /** Structured review outcome — replaces parsing reviewer_notes. */
  is_winner?: number;
  winner_position?: number | null;
  reward_amount?: number | null;
  reward_currency?: string | null;
  reward_usd?: number | null;
  is_paid?: number;
  paid_at?: number | null;
  label?: string;
  transaction_hash?: string;
  user_username: string;
  user_avatar_url?: string;
  user_wallet_address: string;
  bounty_title: string;
  submitted_at: string;
  review_started_at?: string;
  completed_at?: string;
}

export interface SubmissionFormData {
  title: string;
  description: string;
  submission_url: string;
  tweet_url?: string;
}
