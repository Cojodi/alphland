// Sponsor related types

export type SponsorStatus = "pending" | "approved";

export interface Sponsor {
  id: string;
  user_id: string; // Links to User table (one-to-zero-or-one relationship)

  // Organization Information
  name: string; // Organization name
  username: string; // Organization username (slug for URL)
  description: string; // Organization short bio
  entity_name: string; // Full legal entity name
  industry: string;
  logo_url?: string;
  banner_url?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;

  // Contact Person Information
  contact_username: string;
  contact_telegram: string;

  // Wallet for payments
  wallet_address?: string;

  // Stats
  total_bounties_count: number;
  total_projects_count: number;
  total_reward_amount: number;

  // Approval workflow
  status: SponsorStatus;
  is_verified?: boolean;
  is_banned: number;
  approved_at?: string;
  banned_at?: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SponsorApplication {
  // About You
  username: string;
  telegram: string;

  // About Your Organization
  org_name: string;
  org_username: string;
  org_url: string;
  org_twitter: string;
  entity_name: string;
  industry: string;
  org_bio: string;

  // Logo file (for form submission)
  logo?: File;
  banner?: File;
}

export interface SponsorStats {
  total_bounties: number;
  active_bounties: number;
  total_submissions: number;
  pending_submissions: number;
  total_rewards_distributed: number;
}
