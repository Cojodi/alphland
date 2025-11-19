-- Initial database schema for Alphland Bounty Platform
-- This schema includes tables for better-auth and bounty management

-- Better Auth Tables (required for authentication)

-- Users table (created by better-auth)
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  image TEXT
);

-- Sessions table (created by better-auth)
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Accounts table (for OAuth providers)
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  expiresAt INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Verification tokens (for email verification)
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Custom Application Tables

-- User profiles (extended user information)
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  bio TEXT,
  wallet_address TEXT,
  github_username TEXT,
  twitter_username TEXT,
  discord_username TEXT,
  reputation_score INTEGER DEFAULT 0,
  total_bounties_completed INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Bounties table
CREATE TABLE IF NOT EXISTS bounties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_amount REAL NOT NULL,
  reward_currency TEXT NOT NULL DEFAULT 'ALPH',
  difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'review', 'completed', 'cancelled', 'deleted')),
  created_by TEXT NOT NULL,
  assigned_to TEXT,
  tags TEXT, -- JSON array of tags
  requirements TEXT, -- Detailed requirements
  submission_url TEXT, -- GitHub PR or submission link
  start_date TEXT,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES user(id) ON DELETE SET NULL
);

-- Bounty applications
CREATE TABLE IF NOT EXISTS bounty_applications (
  id TEXT PRIMARY KEY,
  bounty_id TEXT NOT NULL,
  applicant_id TEXT NOT NULL,
  cover_letter TEXT,
  estimated_completion TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE,
  FOREIGN KEY (applicant_id) REFERENCES user(id) ON DELETE CASCADE,
  UNIQUE(bounty_id, applicant_id)
);

-- Bounty submissions
CREATE TABLE IF NOT EXISTS bounty_submissions (
  id TEXT PRIMARY KEY,
  bounty_id TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submission_url TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  reviewer_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES user(id) ON DELETE SET NULL
);

-- Comments/discussions on bounties
CREATE TABLE IF NOT EXISTS bounty_comments (
  id TEXT PRIMARY KEY,
  bounty_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  parent_comment_id TEXT, -- For nested comments
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES bounty_comments(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_created_by ON bounties(created_by);
CREATE INDEX IF NOT EXISTS idx_bounties_assigned_to ON bounties(assigned_to);
CREATE INDEX IF NOT EXISTS idx_bounties_category ON bounties(category);
CREATE INDEX IF NOT EXISTS idx_bounty_applications_bounty_id ON bounty_applications(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_applications_applicant_id ON bounty_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_bounty_id ON bounty_submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_submissions_submitted_by ON bounty_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_bounty_comments_bounty_id ON bounty_comments(bounty_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
