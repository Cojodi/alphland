-- Migration 002: Add transaction_hash to submissions and sponsors table
-- Run this after 001_initial_schema.sql

-- Add transaction_hash column to bounty_submissions
ALTER TABLE bounty_submissions ADD COLUMN transaction_hash TEXT;

-- Create sponsors table
CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  twitter TEXT,
  discord TEXT,
  telegram TEXT,
  wallet_address TEXT,
  total_bounties_count INTEGER DEFAULT 0,
  total_projects_count INTEGER DEFAULT 0,
  total_reward_amount REAL DEFAULT 0,
  is_verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Add sponsor_id to bounties table
ALTER TABLE bounties ADD COLUMN sponsor_id TEXT;

-- Create index for sponsors
CREATE INDEX IF NOT EXISTS idx_sponsors_user_id ON sponsors(user_id);
CREATE INDEX IF NOT EXISTS idx_bounties_sponsor_id ON bounties(sponsor_id);
