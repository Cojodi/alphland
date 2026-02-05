// Sponsor related types

export type SponsorStatus = "pending" | "approved" | "rejected";

export interface Sponsor {
  id: string;
  user_id: string; // Links to User table (one-to-zero-or-one relationship)

  // Company Information
  name: string; // Company name
  username: string; // Company username (slug for URL)
  description: string; // Company short bio
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
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SponsorApplication {
  // About You
  username: string;
  telegram: string;

  // About Your Company
  company_name: string;
  company_username: string;
  company_url: string;
  company_twitter: string;
  entity_name: string;
  industry: string;
  company_bio: string;

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
