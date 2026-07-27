// Bounty related types

export type BountyStatus = "open" | "closed" | "completed";

export type RewardType = "fixed" | "tiered";

export interface Reward {
  amount: number;
  token: string;
  usd_equivalent: number;
}

export interface TieredReward extends Reward {
  position: number;
  percentage: number;
}

export interface Bounty {
  id: string;
  sponsor_id: string;
  title: string;
  description: string;
  requirements: string[];
  deliverables: string[];
  skills: string[];
  reward: Reward;
  reward_type: RewardType;
  tier_count?: number;
  tiered_rewards?: TieredReward[];
  status: BountyStatus;
  start_date: string;
  end_date: string;
  current_submissions: number;
  max_submissions?: number;
  category: string;
  difficulty?: string;
  dapp_name?: string;
  sponsor_name?: string;
  /** Stored routing key for /bounty/sponsor/:slug — stable across renames. */
  sponsor_slug?: string;
  sponsor_logo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BountyListItem
  extends Pick<
    Bounty,
    | "id"
    | "title"
    | "reward"
    | "status"
    | "end_date"
    | "current_submissions"
    | "skills"
  > {
  sponsor_name: string;
  sponsor_logo?: string;
}
