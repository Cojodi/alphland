/**
 * Custom authentication hook
 * Provides user session and profile data
 */
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";

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

export function useAuth() {
  const { data: session, isPending } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (session?.user?.id) {
        setProfileLoading(true);
        try {
          const { user } = await apiClient.getUserProfile(session.user.id);
          setProfile(user);

          // Check if profile needs setup (username and wallet required)
          if (!user.username || !user.wallet_address) {
            setNeedsProfileSetup(true);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          setNeedsProfileSetup(true);
        } finally {
          setProfileLoading(false);
        }
      }
    }

    fetchProfile();
  }, [session?.user?.id]);

  return {
    session,
    user: session?.user || null,
    profile,
    isAuthenticated: !!session?.user,
    isLoading: isPending || profileLoading,
    needsProfileSetup,
    refetchProfile: async () => {
      if (session?.user?.id) {
        const { user } = await apiClient.getUserProfile(session.user.id);
        setProfile(user);
        setNeedsProfileSetup(!user.username || !user.wallet_address);
      }
    },
  };
}
