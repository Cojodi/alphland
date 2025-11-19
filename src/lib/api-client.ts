/**
 * API Client for Cloudflare D1 Worker
 * This provides type-safe methods to interact with your D1 database via the worker
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  reward_currency: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  category: string;
  status:
    | "open"
    | "in_progress"
    | "review"
    | "completed"
    | "cancelled"
    | "deleted";
  created_by: string;
  assigned_to: string | null;
  tags: string | null;
  requirements: string | null;
  submission_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateBountyInput {
  title: string;
  description: string;
  reward_amount: number;
  reward_currency?: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  category: string;
  created_by: string;
  tags?: string[];
  requirements?: string;
  start_date?: string;
  end_date?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  bio: string | null;
  wallet_address: string | null;
  github_username: string | null;
  twitter_username: string | null;
  discord_username: string | null;
  reputation_score: number;
  total_bounties_completed: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserProfileInput {
  username?: string;
  bio?: string;
  wallet_address?: string;
  github_username?: string;
  twitter_username?: string;
  discord_username?: string;
}

export interface BountySubmission {
  id: string;
  bounty_id: string;
  submitted_by: string;
  submission_url: string;
  description: string | null;
  status: "pending" | "approved" | "rejected" | "revision_requested";
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  transaction_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubmissionInput {
  bounty_id: string;
  submitted_by: string;
  submission_url: string;
  description?: string;
}

export interface UpdateSubmissionInput {
  status: "approved" | "rejected" | "revision_requested";
  reviewer_notes?: string;
  transaction_hash?: string;
}

export interface BountyComment {
  id: string;
  bounty_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  user_username?: string;
  user_avatar?: string;
}

export interface CreateCommentInput {
  bounty_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface Sponsor {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  twitter: string | null;
  discord: string | null;
  telegram: string | null;
  wallet_address: string | null;
  total_bounties_count: number;
  total_projects_count: number;
  total_reward_amount: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSponsorInput {
  user_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  wallet_address?: string;
}

export interface UpdateSponsorInput {
  name?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  wallet_address?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          error.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    return this.request("/health");
  }

  // Database test
  async testDatabase(): Promise<{ success: boolean; result: any }> {
    return this.request("/api/db-test");
  }

  // Bounties
  async getBounties(): Promise<{ bounties: Bounty[] }> {
    return this.request("/api/bounties");
  }

  async getBounty(id: string): Promise<{ bounty: Bounty }> {
    return this.request(`/api/bounties/${id}`);
  }

  async createBounty(data: CreateBountyInput): Promise<{ bounty: Bounty }> {
    return this.request("/api/bounties", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Users
  async getUserProfile(userId: string): Promise<{ user: UserProfile }> {
    return this.request(`/api/users/${userId}`);
  }

  async updateUserProfile(
    userId: string,
    data: UpdateUserProfileInput
  ): Promise<{ user: UserProfile }> {
    return this.request(`/api/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Bounty Submissions
  async createSubmission(
    data: CreateSubmissionInput
  ): Promise<{ submission: BountySubmission }> {
    return this.request("/api/submissions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSubmission(id: string): Promise<{ submission: BountySubmission }> {
    return this.request(`/api/submissions/${id}`);
  }

  async getSubmissionsByBounty(
    bountyId: string
  ): Promise<{ submissions: BountySubmission[] }> {
    return this.request(`/api/submissions/bounty/${bountyId}`);
  }

  async getSubmissionsByUser(
    userId: string
  ): Promise<{ submissions: BountySubmission[] }> {
    return this.request(`/api/submissions/user/${userId}`);
  }

  async updateSubmission(
    id: string,
    data: UpdateSubmissionInput
  ): Promise<{ submission: BountySubmission }> {
    return this.request(`/api/submissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Comments
  async getCommentsByBounty(
    bountyId: string
  ): Promise<{ comments: BountyComment[] }> {
    return this.request(`/api/comments/bounty/${bountyId}`);
  }

  async createComment(
    data: CreateCommentInput
  ): Promise<{ comment: BountyComment }> {
    return this.request("/api/comments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteComment(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/comments/${id}`, {
      method: "DELETE",
    });
  }

  // Sponsors
  async getSponsor(id: string): Promise<{ sponsor: Sponsor }> {
    return this.request(`/api/sponsors/${id}`);
  }

  async getSponsorByUserId(userId: string): Promise<{ sponsor: Sponsor }> {
    return this.request(`/api/sponsors/user/${userId}`);
  }

  async createSponsor(data: CreateSponsorInput): Promise<{ sponsor: Sponsor }> {
    return this.request("/api/sponsors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSponsor(
    id: string,
    data: UpdateSponsorInput
  ): Promise<{ sponsor: Sponsor }> {
    return this.request(`/api/sponsors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getBountiesBySponsor(
    sponsorId: string
  ): Promise<{ bounties: Bounty[] }> {
    return this.request(`/api/bounties/sponsor/${sponsorId}`);
  }

  async getSubmissionsBySponsor(
    sponsorId: string
  ): Promise<{ submissions: BountySubmission[] }> {
    return this.request(`/api/submissions/sponsor/${sponsorId}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export default ApiClient;
