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
  location: string | null;
  work_preference: string | null;
  current_employer: string | null;
  web3_familiarity: string | null;
  skills: string | null;
  web3_interests: string | null;
  projects: string | null;
  // From user table join
  email: string;
  name: string;
  image: string | null;
}

export default function UserProfile() {
  const router = useRouter();
  const { username } = router.query;
  const { data: session } = useSession();
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
    if (!username) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // Fetch by username only
        const response = await fetch(`/api/users/username/${username}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load profile");
          }
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

        // Fetch proof of work
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
  }, [username]);

  // Check if this is the current user's own profile
  const isOwnProfile = session?.user && userData?.user_id === session.user.id;

  // Parse JSON fields
  const parseJsonField = <T,>(field: string | null, defaultValue: T): T => {
    if (!field) return defaultValue;
    try {
      return JSON.parse(field) as T;
    } catch {
      return defaultValue;
    }
  };

  if (loading) {
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
      <Layout title="User Not Found | Alphland" description="User not found">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
              {error || "User not found"}
            </h1>
            <p className="text-light-charcoal dark:text-lightgrey mb-4">
              The profile you&apos;re looking for doesn&apos;t exist.
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
  const skills = parseJsonField<string[]>(userData.skills, []);
  const skillsGrouped: Record<string, string[]> = {
    SKILLS: skills,
  };

  // Build socials object
  const socials: Record<string, string> = {};
  if (userData.github_username) {
    socials.github = `https://github.com/${userData.github_username}`;
  }
  if (userData.twitter_username) {
    socials.twitter = `https://x.com/${userData.twitter_username}`;
  }
  if (userData.linkedin_username) {
    socials.linkedin = `https://linkedin.com/in/${userData.linkedin_username}`;
  }
  if (userData.telegram_username) {
    socials.telegram = `https://t.me/${userData.telegram_username}`;
  }
  if (userData.discord_username) {
    // Discord doesn't have profile URLs, so we just show the username
    socials.discord = `https://discord.com/users/${userData.discord_username}`;
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
      title={`${displayName} | Alphland`}
      description={userData.bio || `${displayName}'s profile on Alphland`}
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black">
        <ProfileHeader
          username={userData.username || userData.user_id.slice(0, 8)}
          fullName={displayName}
          avatarUrl={userData.image || undefined}
          isOwnProfile={isOwnProfile || false}
          socials={socials}
        />

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-8">
              <ProfileDetails
                lookingFor={
                  userData.work_preference
                    ? workPreferenceMap[userData.work_preference] ||
                      userData.work_preference
                    : undefined
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
              {/* Show Bookmarks section only on own profile */}
              {isOwnProfile && <BookmarksSection userId={userData.user_id} />}

              {/* Show Submissions section only on own profile */}
              {isOwnProfile && <SubmissionsSection userId={userData.user_id} />}

              <ProofOfWorkSection
                works={proofOfWork}
                username={userData.username || undefined}
                userId={userData.user_id}
                isOwnProfile={isOwnProfile || false}
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
