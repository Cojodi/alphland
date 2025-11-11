// Sponsor related types

export interface Sponsor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  wallet_address: string;
  total_bounties_count: number;
  total_projects_count: number;
  total_reward_amount: number;
  created_at: string;
}

export interface SponsorStats {
  total_bounties: number;
  active_bounties: number;
  total_submissions: number;
  pending_submissions: number;
  total_rewards_distributed: number;
}
