/**
 * Database type definitions for Cloudflare D1
 * Updated schema after cleanup migration (16_schema_cleanup.sql)
 *
 * Table relationships:
 * - user: Core auth table, connects to session, user_profiles, sponsors, bounty_submissions, bounty_comments, notifications
 * - user_profiles: Extended user info, connects to user via user_id
 * - sponsors: Company profiles, connects to user via user_id, to bounties
 * - bounties: Bounty listings, connects to sponsors via sponsor_id
 * - bounty_submissions: User submissions, connects to bounties, sponsors, user
 * - bounty_comments: Comments on bounties, connects to bounties, user (liked_by field replaces comment_likes table)
 * - notifications: User notifications, connects to user, bounties, bounty_submissions, bounty_comments
 * - notification_mutes: Per-bounty notification settings, connects to user and bounties
 */

// ==========================================
// Authentication Tables
// ==========================================

/**
 * Core user table - handles authentication and basic user info
 * Connected to: session, user_profiles, sponsors (via user_id), bounty_comments, notifications
 * Ban logic: If user.is_banned = 1, user cannot access ANY features (user or sponsor)
 */
export interface User {
  id: string;
  email: string;
  emailVerified: number; // 0 or 1 (boolean)
  name: string | null;
  image: string | null;
  is_banned: number; // 0 or 1 - banned users cannot use platform
  is_sponsor: number; // 0 or 1 - is this user a sponsor
  sponsor_id: string | null; // Reference to sponsors.id if is_sponsor = 1
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

// REMOVED: Account table - no longer needed, auth handled by better-auth
// REMOVED: Verification table - moved to sponsors.is_verified boolean field

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

/**
 * Sponsors table - companies/organizations creating bounties
 * Connected to: user (via user_id), bounties (via sponsor_id)
 * Ban logic: When sponsor.is_banned = 1, the associated user.is_banned is also set to 1
 * Note: approved_at, rejected_at, rejection_reason fields removed - all sponsors auto-approved
 */
export interface Sponsor {
  id: string;
  user_id: string; // Reference to user.id
  name: string;
  username: string | null;
  description: string | null;
  entity_name: string | null;
  industry: string | null;
  logo_url: string | null;
  website: string | null;
  twitter: string | null;
  discord: string | null;
  telegram: string | null;
  wallet_address: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_username: string | null;
  contact_telegram: string | null;
  status: "approved" | "rejected"; // All new sponsors auto-approved (deprecated, always "approved")
  is_verified: number; // 0 or 1 - verified badge (replaces verification table)
  is_banned: number; // 0 or 1 - if banned, sponsor cannot create bounties
  banned_at: number | null;
  total_bounties_count: number;
  total_projects_count: number;
  total_reward_amount: number;
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

/**
 * Bounty comments table - discussions on bounties
 * Connected to: bounties (via bounty_id), user (via user_id)
 * Note: liked_by field replaces the comment_likes table
 */
export interface BountyComment {
  id: string;
  bounty_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  like_count: number;
  liked_by: string[]; // JSON array of user IDs who liked this comment
  deleted_at: number | null; // Soft delete timestamp
  created_at: number;
  updated_at: number;
}

export interface DbBountyComment extends Omit<BountyComment, "liked_by"> {
  liked_by: string; // JSON string
}

// REMOVED: CommentLike table - moved to BountyComment.liked_by field (JSON array)

/**
 * Bounty overview table - stores global platform statistics
 * Single row table with id = 1
 */
export interface BountyOverview {
  id: number; // Always 1
  total_value_usd: number;
  total_value_alph: number;
  list_number: number; // Total bounties listed
  user_number: number; // Total users
  sponsor_number: number; // Total sponsors
  updated_at: number;
}

/**
 * Bookmarks table - users can bookmark bounties to save for later
 * Connected to: user (via user_id), bounties (via bounty_id)
 */
export interface Bookmark {
  id: string;
  user_id: string;
  bounty_id: string;
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
  | "sponsor_banned"
  | "general";

/**
 * Notifications table - user notifications
 * Connected to: user (via user_id), bounties, bounty_submissions, bounty_comments
 */
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

/**
 * Notification mutes - simpler replacement for notification_preferences
 * Connected to: user (via user_id), bounties (via bounty_id)
 * If a record exists, notifications for that bounty are muted for that user
 */
export interface NotificationMute {
  id: string;
  user_id: string;
  bounty_id: string;
  created_at: number;
}

// REMOVED: NotificationPreference table - replaced by NotificationMute table (simpler approach)

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
