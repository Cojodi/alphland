// Submission related types

export type SubmissionStatus = "submitted" | "accepted" | "rejected";

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
