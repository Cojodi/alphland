/**
 * API Client for Cloudflare D1 Worker
 * This provides type-safe methods to interact with your D1 database via the worker
 * Uses Next.js proxy to forward requests to the worker on port 8787
 */

// Use relative path to leverage Next.js proxy
// The proxy in next.config.js forwards /api/* to the worker
// This avoids CORS issues and keeps cookies on the same domain
const API_BASE_URL = "";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  reward_currency: string;
  reward_type?: string;
  tier_count?: number;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  category: string;
  status:
    | "open"
    | "in_progress"
    | "review"
    | "completed"
    | "cancelled"
    | "closed"
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
  sponsor_id?: string;
  sponsor_name?: string;
  sponsor_logo_url?: string | null;
  sponsor_is_verified?: number;
  submission_count?: number;
}

export interface CreateBountyInput {
  title: string;
  description: string;
  reward_amount: number;
  reward_currency?: string;
  reward_type?: string;
  tier_count?: number;
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
  bounty_title: string;
  sponsor_id: string;
  sponsor_name: string;
  sponsor_logo_url: string | null;
  user_id: string;
  title: string;
  description: string;
  submission_url: string;
  tweet_url: string | null;
  status:
    | "submitted"
    | "in_review"
    | "approved"
    | "rejected"
    | "pending"
    | "revision_requested";
  reviewer_notes: string | null;
  review_started_at: number | null;
  completed_at: number | null;
  reward: {
    token: string;
    amount: number;
    usd_equivalent: number;
  };
  user_username: string | null;
  user_avatar_url: string | null;
  user_full_name: string | null;
  user_wallet_address: string | null;
  transaction_hash: string | null;
  created_at: number;
  updated_at: number;
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
  like_count?: number;
  user_liked?: number;
}

export interface CreateCommentInput {
  bounty_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface UpdateCommentInput {
  content: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: number;
  created_at: number;
}

export interface CreateNotificationInput {
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

// REMOVED: NotificationPreference - replaced by simpler NotificationMute approach
// New simplified notification mute interface
export interface NotificationMute {
  id: string;
  user_id: string;
  bounty_id: string;
  created_at: number;
}

export interface CreateNotificationMuteInput {
  user_id: string;
  bounty_id: string;
}

export interface Sponsor {
  id: string;
  user_id: string;
  name: string;
  username?: string;
  description: string | null;
  entity_name?: string;
  industry?: string;
  logo_url: string | null;
  website: string | null;
  twitter: string | null;
  discord: string | null;
  telegram: string | null;
  wallet_address: string | null;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_username?: string;
  contact_telegram?: string;
  total_bounties_count: number;
  total_projects_count: number;
  total_reward_amount: number;
  status: "pending" | "approved";
  is_verified: boolean;
  is_banned: number;
  banned_at?: number;
  approved_at?: string;
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

export interface BountyOverview {
  id: number;
  total_value_usd: number;
  total_value_alph: number;
  list_number: number;
  user_number: number;
  sponsor_number: number;
  updated_at: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
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
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        const err = new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        ) as any;
        err.status = response.status;
        err.data = errorData;
        throw err;
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
    data: UpdateUserProfileInput,
  ): Promise<{ user: UserProfile }> {
    return this.request(`/api/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getUserStats(userId: string): Promise<{
    stats: {
      submissions: number;
      won: number;
      earned: number;
    };
  }> {
    return this.request(`/api/users/${userId}/stats`);
  }

  // Bounty Submissions
  async createSubmission(
    data: CreateSubmissionInput,
  ): Promise<{ submission: BountySubmission }> {
    return this.request("/api/submissions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSubmission(id: string): Promise<{ submission: BountySubmission }> {
    return this.request(`/api/submissions/${id}`);
  }

  async resubmitSubmission(
    id: string,
    data: { user_id: string; submission_url: string; description?: string },
  ): Promise<{ submission: BountySubmission }> {
    return this.request(`/api/submissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getSubmissionsByBounty(
    bountyId: string,
  ): Promise<{ submissions: BountySubmission[] }> {
    return this.request(`/api/submissions/bounty/${bountyId}`);
  }

  async getSubmissionsByUser(
    userId: string,
  ): Promise<{ submissions: BountySubmission[] }> {
    return this.request(`/api/submissions/user/${userId}`);
  }

  async checkUserSubmission(
    userId: string,
    bountyId: string,
  ): Promise<{ hasSubmitted: boolean; submission: BountySubmission | null }> {
    return this.request(
      `/api/submissions/check?user_id=${userId}&bounty_id=${bountyId}`,
    );
  }

  async updateSubmission(
    id: string,
    data: UpdateSubmissionInput,
  ): Promise<{ submission: BountySubmission }> {
    return this.request(`/api/submissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Comments
  async getCommentsByBounty(
    bountyId: string,
    userId?: string,
  ): Promise<{ comments: BountyComment[] }> {
    const url = userId
      ? `/api/comments/bounty/${bountyId}?user_id=${userId}`
      : `/api/comments/bounty/${bountyId}`;
    return this.request(url);
  }

  async createComment(
    data: CreateCommentInput,
  ): Promise<{ comment: BountyComment }> {
    return this.request("/api/comments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateComment(
    id: string,
    data: UpdateCommentInput,
  ): Promise<{ comment: BountyComment }> {
    return this.request(`/api/comments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteComment(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/comments/${id}`, {
      method: "DELETE",
    });
  }

  async likeComment(
    commentId: string,
    userId: string,
  ): Promise<{ success: boolean; like_count: number }> {
    return this.request(`/api/comments/${commentId}/like`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async unlikeComment(
    commentId: string,
    userId: string,
  ): Promise<{ success: boolean; like_count: number }> {
    return this.request(`/api/comments/${commentId}/like?user_id=${userId}`, {
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
    data: UpdateSponsorInput,
  ): Promise<{ sponsor: Sponsor }> {
    return this.request(`/api/sponsors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getBountiesBySponsor(
    sponsorId: string,
  ): Promise<{ bounties: Bounty[] }> {
    return this.request(`/api/bounties/sponsor/${sponsorId}`);
  }

  async getSubmissionsBySponsor(
    sponsorId: string,
  ): Promise<{ submissions: BountySubmission[] }> {
    return this.request(`/api/submissions/sponsor/${sponsorId}`);
  }

  // Admin: List all sponsors
  async getSponsors(status?: string): Promise<{ sponsors: Sponsor[] }> {
    const url = status ? `/api/sponsors?status=${status}` : "/api/sponsors";
    return this.request(url);
  }

  // Admin: Approve sponsor
  async approveSponsor(id: string): Promise<{ sponsor: Sponsor }> {
    return this.request(`/api/sponsors/${id}/approve`, {
      method: "PUT",
    });
  }

  // Admin: Reject sponsor
  async rejectSponsor(
    id: string,
    reason?: string,
  ): Promise<{ sponsor: Sponsor }> {
    return this.request(`/api/sponsors/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
  }

  // Notifications
  async getNotifications(
    userId: string,
    options?: { limit?: number; unreadOnly?: boolean },
  ): Promise<{ notifications: Notification[]; unread_count: number }> {
    let url = `/api/notifications/user/${userId}`;
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.unreadOnly) params.append("unread_only", "true");
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url);
  }

  async createNotification(
    data: CreateNotificationInput,
  ): Promise<{ notification: Notification }> {
    return this.request("/api/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async markNotificationAsRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/notifications/${id}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsAsRead(
    userId: string,
  ): Promise<{ success: boolean }> {
    return this.request(`/api/notifications/user/${userId}/read-all`, {
      method: "PUT",
    });
  }

  async deleteNotification(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/notifications/${id}`, {
      method: "DELETE",
    });
  }

  // Notification Mutes (simplified replacement for preferences)
  async checkNotificationMute(
    bountyId: string,
    userId: string,
  ): Promise<{ muted: boolean }> {
    return this.request(
      `/api/notification-mutes/check?bounty_id=${bountyId}&user_id=${userId}`,
    );
  }

  async muteNotifications(
    data: CreateNotificationMuteInput,
  ): Promise<{ mute: NotificationMute }> {
    return this.request("/api/notification-mutes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async unmuteNotifications(
    bountyId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    return this.request(
      `/api/notification-mutes?bounty_id=${bountyId}&user_id=${userId}`,
      {
        method: "DELETE",
      },
    );
  }

  // Bounty Overview
  async getBountyOverview(): Promise<{ overview: BountyOverview }> {
    return this.request("/api/bounty-overview");
  }

  // Recent Earners - users with >1 submission in past week
  async getRecentEarners(): Promise<{
    earners: Array<{
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
      avatar_url: string | null;
      submission_count: number;
    }>;
  }> {
    return this.request("/api/recent-earners");
  }

  // Bookmarks
  async getBookmarks(userId: string): Promise<{ bookmarks: any[] }> {
    return this.request(`/api/bookmarks?user_id=${userId}`);
  }

  async checkBookmark(
    userId: string,
    bountyId: string,
  ): Promise<{ bookmarked: boolean }> {
    return this.request(
      `/api/bookmarks/check?user_id=${userId}&bounty_id=${bountyId}`,
    );
  }

  async createBookmark(data: {
    user_id: string;
    bounty_id: string;
  }): Promise<{ bookmark: any }> {
    return this.request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteBookmark(
    userId: string,
    bountyId: string,
  ): Promise<{ success: boolean }> {
    return this.request(
      `/api/bookmarks?user_id=${userId}&bounty_id=${bountyId}`,
      {
        method: "DELETE",
      },
    );
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export default ApiClient;
