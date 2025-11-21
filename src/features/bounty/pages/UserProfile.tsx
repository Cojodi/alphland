"use client";

import { ActivityFeed } from "../components/ActivityFeed";
import { ProfileDetails } from "../components/ProfileDetails";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProofOfWorkSection } from "../components/ProofOfWorkSection";
import { SkillsSection } from "../components/SkillsSection";
import { StatsSection } from "../components/StatsSection";
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

  useEffect(() => {
    if (!username) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
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

  // Parse projects from JSON and map to expected format
  const rawProjects = parseJsonField<
    Array<{
      id: string;
      title: string;
      description: string;
      skills: string[];
      subSkills: string[];
      link: string;
    }>
  >(userData.projects, []);

  const projects = rawProjects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    url: p.link,
  }));

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
              <StatsSection earned={0} submissions={0} won={0} />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-8">
              <ProofOfWorkSection works={projects} />
              <ActivityFeed />
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
