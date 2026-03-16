/**
 * Type definitions for Cloudflare Worker environment
 */

// Type definition for D1Database (fallback for when @cloudflare/workers-types is not available)
type D1Database = any;

export interface Env {
  // D1 Database binding
  DB: D1Database;

  // Environment variables
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

// Database schema types
export interface User {
  id: string;
  email: string;
  emailVerified: number;
  name: string | null;
  createdAt: number;
  updatedAt: number;
  image: string | null;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  bio: string | null;
  wallet_address: string | null;
  github_username: string | null;
  twitter_username: string | null;
  discord_username: string | null;
  reputation_score: number;
  total_bounties_completed: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  reward_currency: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  category: string;
  status:
    | "open"
    | "in_progress"
    | "review"
    | "completed"
    | "cancelled"
    | "deleted";
  created_by: string;
  assigned_to: string | null;
  tags: string | null; // JSON array
  requirements: string | null;
  submission_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BountyApplication {
  id: string;
  bounty_id: string;
  applicant_id: string;
  cover_letter: string | null;
  estimated_completion: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  updated_at: string;
}

export interface BountySubmission {
  id: string;
  bounty_id: string;
  submitted_by: string;
  submission_url: string;
  description: string | null;
  status: "pending" | "approved" | "rejected" | "revision_requested";
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BountyComment {
  id: string;
  bounty_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: number;
  created_at: string;
}
