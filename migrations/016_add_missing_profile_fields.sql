-- Migration: Add missing fields to user_profiles
-- Add discord_url and looking_for columns

ALTER TABLE user_profiles ADD COLUMN discord_url TEXT;
ALTER TABLE user_profiles ADD COLUMN looking_for TEXT;
ALTER TABLE user_profiles ADD COLUMN web3_familiarity TEXT;
