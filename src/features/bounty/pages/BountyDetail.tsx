"use client";

import { CommentSection } from "../components/CommentSection";
import { NotificationMuteToggle } from "../components/NotificationMuteToggle";
import { TieredRewardDisplay } from "../components/TieredRewardDisplay";
import { Bounty } from "../types";
import { generateTieredRewards } from "../utils/rewardCalculator";
import { calculateTimeRemaining } from "../utils/timeFormatter";
import Layout from "@/components/Layout";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { Bookmark, MoreVertical, Users, ArrowLeft, Bell } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Image from "next/image";

interface BountyDetailProps {
  bounty: Bounty;
}

export default function BountyDetail({ bounty }: BountyDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [userProfile, setUserProfile] = useState<{
    username: string | null;
    image: string | null;
  } | null>(null);
  const [sponsorUserId, setSponsorUserId] = useState<string | null>(null);
  const [isSponsor, setIsSponsor] = useState(false);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user) {
        setUserProfile(null);
        return;
      }
      try {
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const data = await response.json();
          setUserProfile({
            username: data.user?.username || null,
            image: data.user?.image || null,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };
    fetchUserProfile();
  }, [session?.user]);

  // Fetch sponsor info to check if current user is the sponsor
  useEffect(() => {
    const fetchSponsorInfo = async () => {
      if (!bounty.sponsor_id) return;
      try {
        const { sponsor } = await apiClient.getSponsor(bounty.sponsor_id);
        setSponsorUserId(sponsor.user_id);
        if (session?.user?.id === sponsor.user_id) {
          setIsSponsor(true);
        }
      } catch (error) {
        console.error("Failed to fetch sponsor info:", error);
      }
    };
    fetchSponsorInfo();
  }, [bounty.sponsor_id, session?.user?.id]);

  const tieredRewards =
    bounty.reward_type === "tiered"
      ? generateTieredRewards(bounty.reward, bounty.tier_count || 5)
      : undefined;

  const timeRemaining = calculateTimeRemaining(bounty.end_date);

  return (
    <Layout title={`${bounty.title} - Bounty`} description={bounty.description}>
      <div className="min-h-screen bg-smoked-white dark:bg-light-black">
        {/* Header Section */}
        <section className="border-b border-border-grey dark:border-dark-charcoal bg-white dark:bg-hero-dark">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-orange hover:text-orange/80 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bounties
            </button>

            <div className="flex items-start gap-4 sm:gap-6">
              {/* Logo */}
              <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-orange/20 to-accessible-green/20 dark:from-orange/10 dark:to-accessible-green/10 flex items-center justify-center overflow-hidden">
                {bounty.sponsor_logo_url ? (
                  <Image
                    src={bounty.sponsor_logo_url}
                    alt={bounty.sponsor_name || "Sponsor"}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-orange">
                    {bounty.sponsor_name?.[0] || bounty.dapp_name?.[0] || "B"}
                  </span>
                )}
              </div>

              {/* Title and Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white leading-tight mb-3">
                  {bounty.title}
                </h1>

                <div className="flex flex-wrap gap-4 text-sm text-light-charcoal dark:text-lightgrey mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      by {bounty.sponsor_name || bounty.dapp_name || "Sponsor"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-orange"></span>
                    <span>
                      {bounty.reward_type === "tiered" ? "Bounty" : "Project"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-accessible-green"></span>
                    <span className="text-accessible-green font-medium">
                      {bounty.status === "open" ? "Submissions Open" : "Closed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🌐 Global</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{bounty.current_submissions} participants</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`p-2 rounded-lg border transition ${
                    isBookmarked
                      ? "text-orange bg-orange/5 border-orange"
                      : "border-border-grey dark:border-dark-charcoal hover:border-orange"
                  }`}
                >
                  <Bookmark
                    className="w-4 h-4"
                    fill={isBookmarked ? "currentColor" : "none"}
                  />
                </button>
                <button className="p-2 rounded-lg border border-border-grey dark:border-dark-charcoal hover:border-orange transition">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="border-b border-border-grey dark:border-dark-charcoal bg-white dark:bg-hero-dark sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              <button
                onClick={() => scrollToSection("prizes-section")}
                className="py-4 px-1 border-b-2 border-transparent font-medium transition-colors text-light-charcoal dark:text-lightgrey hover:text-orange hover:border-orange"
              >
                Prizes
              </button>
              <button
                onClick={() => scrollToSection("details-section")}
                className="py-4 px-1 border-b-2 border-transparent font-medium transition-colors text-light-charcoal dark:text-lightgrey hover:text-orange hover:border-orange"
              >
                Details
              </button>
              <button
                onClick={() => scrollToSection("comments-section")}
                className="py-4 px-1 border-b-2 border-transparent font-medium transition-colors text-light-charcoal dark:text-lightgrey hover:text-orange hover:border-orange flex items-center gap-2"
              >
                Comments
                {commentCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-orange/10 text-orange rounded-full">
                    {commentCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="space-y-6 sticky top-6">
                  <TieredRewardDisplay
                    totalAmount={bounty.reward.amount}
                    token={bounty.reward.token}
                    usdEquivalent={bounty.reward.usd_equivalent}
                    tiers={tieredRewards}
                    submissions={bounty.current_submissions}
                    timeRemaining={timeRemaining}
                    skills={bounty.skills}
                    onSubmit={() => console.log("Submit clicked")}
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Prizes Section */}
                <div
                  id="prizes-section"
                  className="bg-white dark:bg-hero-dark rounded-lg p-8 border border-border-grey dark:border-dark-charcoal scroll-mt-20"
                >
                  <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
                    Prize Distribution
                  </h2>
                  <p className="text-light-charcoal dark:text-lightgrey mb-6">
                    {bounty.description}
                  </p>

                  {/* Payment Terms Notice */}
                  <div className="bg-orange/5 border border-orange/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-light-charcoal dark:text-lightgrey font-barlow leading-relaxed">
                      <span className="font-semibold text-orange">
                        Payment Terms:
                      </span>{" "}
                      Rewards will be paid in ALPH, converted to USD at the
                      current exchange rate. If the exchange rate at the time of
                      payment differs by more than 10% from the rate when the
                      bounty was posted, the platform reserves the right to
                      apply a fairer exchange rate.
                    </p>
                  </div>

                  {tieredRewards && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-black dark:text-white">
                        Reward Breakdown
                      </h3>
                      <div className="space-y-2">
                        {tieredRewards.map((tier) => (
                          <div
                            key={tier.position}
                            className="flex justify-between items-center p-3 bg-smoked-white dark:bg-light-black rounded-lg"
                          >
                            <span className="font-medium text-black dark:text-white">
                              {tier.position === 1
                                ? "1st"
                                : tier.position === 2
                                  ? "2nd"
                                  : tier.position === 3
                                    ? "3rd"
                                    : `${tier.position}th`}{" "}
                              Place
                            </span>
                            <span className="text-accessible-green font-bold">
                              {tier.amount.toLocaleString()} {tier.token}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div
                  id="details-section"
                  className="bg-white dark:bg-hero-dark rounded-lg p-8 border border-border-grey dark:border-dark-charcoal scroll-mt-20"
                >
                  <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
                    Bounty Details
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                        Description
                      </h3>
                      <p className="text-light-charcoal dark:text-lightgrey leading-relaxed">
                        {bounty.description}
                      </p>
                    </div>

                    {bounty.requirements.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                          Requirements
                        </h3>
                        <ul className="space-y-2">
                          {bounty.requirements.map((req, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-light-charcoal dark:text-lightgrey"
                            >
                              <span className="text-orange mt-1">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {bounty.deliverables.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                          Deliverables
                        </h3>
                        <ul className="space-y-2">
                          {bounty.deliverables.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-light-charcoal dark:text-lightgrey"
                            >
                              <span className="text-accessible-green mt-1">
                                ✓
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <div id="comments-section" className="space-y-6 scroll-mt-20">
                  {/* Notification Settings for Sponsor */}
                  {isSponsor && session?.user?.id && (
                    <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Bell className="w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                          <h3 className="font-semibold text-black dark:text-white">
                            Notification Settings
                          </h3>
                        </div>
                        <button
                          onClick={() =>
                            setShowNotificationSettings(
                              !showNotificationSettings,
                            )
                          }
                          className="text-sm text-orange hover:text-primary-dark transition"
                        >
                          {showNotificationSettings ? "Hide" : "Configure"}
                        </button>
                      </div>
                      {showNotificationSettings && (
                        <NotificationMuteToggle
                          userId={session.user.id}
                          bountyId={bounty.id}
                          bountyTitle={bounty.title}
                        />
                      )}
                    </div>
                  )}

                  {/* Comment Section */}
                  <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
                    <CommentSection
                      bountyId={bounty.id}
                      bountyTitle={bounty.title}
                      currentUserId={session?.user?.id}
                      currentUsername={
                        userProfile?.username ||
                        session?.user?.name ||
                        undefined
                      }
                      currentUserAvatar={
                        userProfile?.image || session?.user?.image || undefined
                      }
                      sponsorUserId={sponsorUserId || undefined}
                      onCommentCount={setCommentCount}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

// This will be used for server-side data fetching
export async function getServerSideProps(context: any) {
  const { id } = context.params;

  try {
    // Fetch bounty from API
    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const response = await fetch(`${baseUrl}/api/bounties/${id}`);

    if (!response.ok) {
      return {
        notFound: true,
      };
    }

    const data = await response.json();
    const bountyData = data.bounty;

    // Transform the bounty data to match the Bounty type
    const bounty: Bounty = {
      id: bountyData.id,
      sponsor_id: bountyData.sponsor_id,
      title: bountyData.title,
      description: bountyData.description,
      requirements: bountyData.requirements
        ? JSON.parse(bountyData.requirements)
        : [],
      deliverables: bountyData.deliverables
        ? JSON.parse(bountyData.deliverables)
        : [],
      skills: bountyData.skills ? JSON.parse(bountyData.skills) : [],
      reward: {
        amount: parseFloat(bountyData.reward_amount) || 0,
        token: bountyData.reward_currency || "ALPH",
        usd_equivalent: parseFloat(bountyData.reward_usd_value) || 0,
      },
      reward_type: bountyData.reward_type || "fixed",
      status: bountyData.status,
      start_date: bountyData.start_date,
      end_date: bountyData.end_date,
      current_submissions: bountyData.submission_count || 0,
      category: bountyData.category,
      dapp_name: bountyData.dapp_name || undefined,
      sponsor_name: bountyData.sponsor_name || undefined,
      sponsor_logo_url: bountyData.sponsor_logo_url || undefined,
      created_at: bountyData.created_at,
      updated_at: bountyData.updated_at,
    };

    return {
      props: {
        bounty,
      },
    };
  } catch (error) {
    console.error("Error fetching bounty:", error);
    return {
      notFound: true,
    };
  }
}
