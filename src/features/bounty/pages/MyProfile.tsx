"use client";

import { ActivityFeed } from "../components/ActivityFeed";
import { BookmarksSection } from "../components/BookmarksSection";
import { ProfileDetails } from "../components/ProfileDetails";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProofOfWorkSection } from "../components/ProofOfWorkSection";
import { SkillsSection } from "../components/SkillsSection";
import { StatsSection } from "../components/StatsSection";
import { SubmissionsSection } from "../components/SubmissionsSection";
import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  bio: string | null;
  wallet_address: string | null;
  github_username: string | null;
  twitter_username: string | null;
  discord_username: string | null;
  linkedin_username: string | null;
  telegram_username: string | null;
  website: string | null;
  discord_url: string | null;
  location: string | null;
  work_preference: string | null;
  current_employer: string | null;
  web3_familiarity: string | null;
  looking_for: string | null;
  skills: string | null;
  web3_interests: string | null;
  projects: string | null;
  // From user table join
  email: string;
  name: string;
  image: string | null;
}

export default function MyProfile() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<{
    submissions: number;
    won: number;
    earned: number;
  } | null>(null);
  const [proofOfWork, setProofOfWork] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      skills: string[];
      link: string;
    }>
  >([]);

  const fetchProofOfWork = async (username: string) => {
    try {
      const response = await fetch(`/api/proof-of-work/${username}`);
      if (response.ok) {
        const data = await response.json();
        setProofOfWork(data.works || []);
      }
    } catch (err) {
      console.error("Error fetching proof of work:", err);
    }
  };

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isPending && !session?.user) {
      router.push("/auth/login");
      return;
    }

    if (!session?.user) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // Fetch current user's profile
        const response = await fetch("/api/users/me");

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/auth/login");
            return;
          }
          setError("Failed to load profile");
          return;
        }

        const data = await response.json();
        setUserData(data.user);

        // Fetch user stats
        try {
          const statsResponse = await fetch(
            `/api/users/${data.user.user_id}/stats`,
          );
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setUserStats(statsData.stats);
          }
        } catch (err) {
          console.error("Error fetching user stats:", err);
          // Don't fail the whole page if stats fail to load
        }

        // Fetch proof of work if username exists
        if (data.user.username) {
          await fetchProofOfWork(data.user.username);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session, isPending, router]);

  // Parse JSON fields
  const parseJsonField = <T,>(field: string | null, defaultValue: T): T => {
    if (!field) return defaultValue;
    try {
      return JSON.parse(field) as T;
    } catch {
      return defaultValue;
    }
  };

  if (loading || isPending) {
    return (
      <Layout title="Loading... | Alphland" description="Loading user profile">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto mb-4"></div>
            <p className="text-light-charcoal dark:text-lightgrey">
              Loading profile...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !userData) {
    return (
      <Layout title="Error | Alphland" description="Profile error">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
              {error || "Failed to load profile"}
            </h1>
            <p className="text-light-charcoal dark:text-lightgrey mb-4">
              Please try again later or contact support if the issue persists.
            </p>
            <button
              onClick={() => router.push("/bounty")}
              className="px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors"
            >
              Go to Bounties
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Parse skills from JSON
  const allSkills = parseJsonField<string[]>(userData.skills, []);
  const skillsGrouped: Record<string, string[]> = {
    SKILLS: allSkills,
  };

  // Build socials object
  const socials: Record<string, string> = {};
  if (userData.github_username) {
    socials.github = userData.github_username.startsWith("http")
      ? userData.github_username
      : `https://github.com/${userData.github_username}`;
  }
  if (userData.twitter_username) {
    socials.twitter = userData.twitter_username.startsWith("http")
      ? userData.twitter_username
      : `https://x.com/${userData.twitter_username}`;
  }
  if (userData.linkedin_username) {
    socials.linkedin = userData.linkedin_username.startsWith("http")
      ? userData.linkedin_username
      : `https://linkedin.com/in/${userData.linkedin_username}`;
  }
  if (userData.telegram_username) {
    socials.telegram = userData.telegram_username.startsWith("http")
      ? userData.telegram_username
      : `https://t.me/${userData.telegram_username}`;
  }
  if (userData.discord_username) {
    socials.discord = userData.discord_username.startsWith("http")
      ? userData.discord_username
      : `https://discord.com/users/${userData.discord_username}`;
  }
  if (userData.discord_url) {
    socials.discord = userData.discord_url.startsWith("http")
      ? userData.discord_url
      : `https://discord.com/users/${userData.discord_url}`;
  }
  if (userData.website) {
    socials.website = userData.website.startsWith("http")
      ? userData.website
      : `https://${userData.website}`;
  }

  // Map work preference to display text
  const workPreferenceMap: Record<string, string> = {
    not_looking: "Not looking for work",
    freelance: "Freelance Opportunities",
    fulltime: "Full-time Opportunities",
    internship: "Internship Opportunities",
  };

  const displayName = userData.name || userData.username || "Anonymous";

  return (
    <Layout
      title="My Profile | Alphland"
      description="View and manage your Alphland profile"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black">
        {/* Warning banner if no username */}
        {!userData.username && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  需要先创建用户名才能查看您的公开profile
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  设置一个唯一的用户名，让其他人可以查看您的公开个人资料。
                </p>
                <button
                  onClick={() => router.push("/bounty/profile/edit")}
                  className="mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
                >
                  立即设置用户名 →
                </button>
              </div>
            </div>
          </div>
        )}

        <ProfileHeader
          username={userData.username || userData.user_id.slice(0, 8)}
          fullName={displayName}
          avatarUrl={userData.image || undefined}
          isOwnProfile={true}
          socials={socials}
        />

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-8">
              <ProfileDetails
                lookingFor={
                  userData.looking_for ||
                  (userData.work_preference
                    ? workPreferenceMap[userData.work_preference] ||
                      userData.work_preference
                    : undefined)
                }
                worksAt={userData.current_employer || undefined}
                location={userData.location || undefined}
              />
              <SkillsSection skills={skillsGrouped} />
              <StatsSection
                earned={userStats?.earned || 0}
                submissions={userStats?.submissions || 0}
                won={userStats?.won || 0}
              />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-8">
              <BookmarksSection userId={userData.user_id} />
              <SubmissionsSection userId={userData.user_id} />
              <ProofOfWorkSection
                works={proofOfWork}
                username={userData.username || undefined}
                userId={userData.user_id}
                isOwnProfile={true}
                onUpdate={() => {
                  if (userData.username) {
                    fetchProofOfWork(userData.username);
                  }
                }}
              />
              <ActivityFeed />
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
