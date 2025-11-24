/**
 * Database type definitions for Cloudflare D1
 * Auto-generated from schema in /sql/d1/
 */

// ==========================================
// Authentication Tables (Better-auth)
// ==========================================

export interface User {
  id: string;
  email: string;
  emailVerified: number; // 0 or 1 (boolean)
  name: string | null;
  image: string | null;
  createdAt: number; // Unix timestamp (ms)
  updatedAt: number;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Account {
  id: string;
  userId: string;
  accountId: string; // OAuth provider's user ID
  providerId: string; // 'google', 'twitter', etc.
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  expiresAt: number | null;
  scope: string | null;
  password: string | null; // Hashed password for email auth
  createdAt: number;
  updatedAt: number;
}

export interface Verification {
  id: string;
  identifier: string; // email
  value: string; // verification code
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// Business Tables
// ==========================================

/**
 * Extended user profile (stored separately from auth.user)
 */
export interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  telegram_url: string | null;
  website_url: string | null;
  web3_interests: string[]; // JSON array in DB
  work_experience: string | null;
  location: string | null;
  current_employer: string | null;
  frontend_skills: string[];
  backend_skills: string[];
  blockchain_skills: string[];
  design_skills: string[];
  content_skills: string[];
  created_at: number;
  updated_at: number;
}

/**
 * UserProfile as stored in database (JSON fields are strings)
 */
export interface DbUserProfile
  extends Omit<
    UserProfile,
    | "web3_interests"
    | "frontend_skills"
    | "backend_skills"
    | "blockchain_skills"
    | "design_skills"
    | "content_skills"
  > {
  web3_interests: string; // JSON string
  frontend_skills: string;
  backend_skills: string;
  blockchain_skills: string;
  design_skills: string;
  content_skills: string;
}

export interface Sponsor {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  github_handle: string | null;
  discord_url: string | null;
  is_verified: number; // 0 or 1
  total_bounties_count: number;
  total_projects_count: number;
  total_reward_amount: number; // REAL in SQLite
  profile_photos: string[]; // JSON array in DB
  created_at: number;
  updated_at: number;
}

export interface DbSponsor extends Omit<Sponsor, "profile_photos"> {
  profile_photos: string; // JSON string
}

export type BountyCategory = "content" | "design" | "development" | "other";
export type BountyStatus = "open" | "in_review" | "completed";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface BountyReward {
  token: string; // e.g., 'ALPH'
  amount: number;
  usd_equivalent: number;
}

export interface RewardTier {
  rank: number;
  amount: number;
  description?: string;
}

export interface Bounty {
  id: string;
  sponsor_id: string;
  title: string;
  description: string | null;
  category: BountyCategory | null;
  status: BountyStatus | null;
  requirements: string | null;
  reward: BountyReward; // JSON in DB
  submission_guidelines: string | null;
  max_submissions: number;
  current_submissions: number;
  start_date: number;
  end_date: number;
  review_timeframe: number;
  difficulty_level: DifficultyLevel | null;
  estimated_hours: number | null;
  tags: string[]; // JSON array in DB
  is_featured: number; // 0 or 1
  is_tiered_reward: number;
  reward_tiers: RewardTier[] | null; // JSON in DB
  created_at: number;
  updated_at: number;
}

export interface DbBounty
  extends Omit<Bounty, "reward" | "tags" | "reward_tiers"> {
  reward: string; // JSON string
  tags: string; // JSON string
  reward_tiers: string | null; // JSON string
}

export type SubmissionStatus =
  | "submitted"
  | "in_review"
  | "accepted"
  | "rejected";

export interface BountySubmission {
  id: string;
  bounty_id: string;
  bounty_name: string;
  sponsor_id: string;
  sponsor_name: string;
  sponsor_logo_url: string | null;
  user_id: string;
  title: string;
  description: string;
  submission_url: string;
  tweet_url: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  review_started_at: number | null;
  completed_at: number | null;
  reward: BountyReward; // JSON in DB
  user_username: string | null;
  user_avatar_url: string | null;
  user_full_name: string | null;
  user_wallet_address: string | null;
  transaction_hash: string | null;
  created_at: number;
  updated_at: number;
}

export interface DbBountySubmission extends Omit<BountySubmission, "reward"> {
  reward: string; // JSON string
}

export interface BountyComment {
  id: string;
  bounty_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  like_count: number;
  created_at: number;
  updated_at: number;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: number;
}

export interface ProofOfWork {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: BountyCategory;
  skills: string[]; // JSON array in DB
  project_url: string;
  created_at: number;
  updated_at: number;
}

export interface DbProofOfWork extends Omit<ProofOfWork, "skills"> {
  skills: string; // JSON string
}

export type SkillCategory =
  | "frontend"
  | "backend"
  | "blockchain"
  | "design"
  | "content"
  | "other";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  created_at: number;
  updated_at: number;
}

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

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  related_bounty_id: string | null;
  related_submission_id: string | null;
  related_comment_id: string | null;
  is_read: number; // 0 or 1
  read_at: number | null;
  created_at: number;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  bounty_id: string | null;
  mute_comments: number; // 0 or 1
  mute_submissions: number; // 0 or 1
  created_at: number;
  updated_at: number;
}

// ==========================================
// Utility Types
// ==========================================

/**
 * Insert types (without auto-generated fields)
 */
export type InsertUser = Omit<User, "createdAt" | "updatedAt">;
export type InsertUserProfile = Omit<UserProfile, "created_at" | "updated_at">;
export type InsertBounty = Omit<
  Bounty,
  "created_at" | "updated_at" | "current_submissions"
>;
export type InsertBountySubmission = Omit<
  BountySubmission,
  "created_at" | "updated_at"
>;

/**
 * Update types (all fields optional except id)
 */
export type UpdateUser = Partial<User> & { id: string };
export type UpdateUserProfile = Partial<UserProfile> & { id: string };
export type UpdateBounty = Partial<Bounty> & { id: string };
export type UpdateBountySubmission = Partial<BountySubmission> & { id: string };

/**
 * Helper type for converting DB types to app types
 */
export type DbToApp<T> = T extends DbUserProfile
  ? UserProfile
  : T extends DbBounty
  ? Bounty
  : T extends DbBountySubmission
  ? BountySubmission
  : T extends DbSponsor
  ? Sponsor
  : T extends DbProofOfWork
  ? ProofOfWork
  : T;
