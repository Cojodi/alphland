-- Migration: Add deleted_at column to bounty_comments table
-- This allows soft-deletion of comments

ALTER TABLE bounty_comments ADD COLUMN deleted_at INTEGER;

-- Create index for faster queries on non-deleted comments
CREATE INDEX IF NOT EXISTS idx_bounty_comments_deleted_at ON bounty_comments(deleted_at);
