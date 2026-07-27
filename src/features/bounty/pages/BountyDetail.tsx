"use client";

import { CommentSection } from "../components/CommentSection";
import { NotificationMuteToggle } from "../components/NotificationMuteToggle";
import { SubmissionModal } from "../components/SubmissionModal";
import { TieredRewardDisplay } from "../components/TieredRewardDisplay";
import { Bounty } from "../types";
import { generateTieredRewards } from "../utils/rewardCalculator";
import { calculateTimeRemaining } from "../utils/timeFormatter";
import Layout from "@/components/Layout";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";
import { Bookmark, Users, ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";
import { sponsorSlug } from "../utils";
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
    wallet_address: string | null;
  } | null>(null);
  const [sponsorUserId, setSponsorUserId] = useState<string | null>(null);
  const [isSponsor, setIsSponsor] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [userSubmission, setUserSubmission] = useState<any>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true);
  const [submissionCount, setSubmissionCount] = useState(
    bounty.current_submissions,
  );

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
            wallet_address: data.user?.wallet_address || null,
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

  // Check if bounty is bookmarked
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!session?.user?.id) {
        setIsBookmarked(false);
        return;
      }
      try {
        const result = await apiClient.checkBookmark(
          session.user.id,
          bounty.id,
        );
        setIsBookmarked(result.bookmarked);
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };
    checkBookmarkStatus();
  }, [session?.user?.id, bounty.id]);

  // Check if user has already submitted to this bounty
  useEffect(() => {
    const checkUserSubmission = async () => {
      if (!session?.user?.id) {
        setUserSubmission(null);
        setCheckingSubmission(false);
        return;
      }
      try {
        const result = await apiClient.checkUserSubmission(
          session.user.id,
          bounty.id,
        );
        setUserSubmission(result.submission);
      } catch (error) {
        console.error("Error checking user submission:", error);
      } finally {
        setCheckingSubmission(false);
      }
    };
    checkUserSubmission();
  }, [session?.user?.id, bounty.id]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    if (!session?.user?.id) {
      toast.info("Please sign in to bookmark this bounty");
      return;
    }

    try {
      if (isBookmarked) {
        await apiClient.deleteBookmark(session.user.id, bounty.id);
        setIsBookmarked(false);
      } else {
        await apiClient.createBookmark({
          user_id: session.user.id,
          bounty_id: bounty.id,
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const tieredRewards =
    bounty.reward_type === "tiered"
      ? generateTieredRewards(bounty.reward, bounty.tier_count || 5)
      : undefined;

  const timeRemaining = calculateTimeRemaining(bounty.end_date);

  // Check if bounty has ended
  const isBountyEnded = bounty.end_date
    ? new Date(bounty.end_date).getTime() < Date.now()
    : false;

  // Compute display status: open / closed / completed
  // DB "completed" takes priority over end_date check
  const computedStatus =
    bounty.status === "completed"
      ? "completed"
      : !isBountyEnded
        ? "open"
        : "closed";

  return (
    <Layout title={`${bounty.title} - Bounty`} description={bounty.description}>
      <div className="min-h-screen bg-smoked-white dark:bg-light-black">
        {/* Header Section */}
        <section className="border-b border-border-grey dark:border-dark-charcoal bg-white dark:bg-hero-dark">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Back Button */}
            <button
              onClick={() => router.push("/bounty")}
              className="flex items-center gap-2 text-orange hover:text-orange/80 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
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
                    {bounty.sponsor_id && bounty.sponsor_name ? (
                      <Link
                        href={`/bounty/sponsor/${sponsorSlug(bounty.sponsor_name)}`}
                      >
                        <a className="font-medium hover:text-orange transition-colors">
                          by{" "}
                          {bounty.sponsor_name || bounty.dapp_name || "Sponsor"}
                        </a>
                      </Link>
                    ) : (
                      <span className="font-medium">
                        by{" "}
                        {bounty.sponsor_name || bounty.dapp_name || "Sponsor"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-orange"></span>
                    <span>Bounty</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        computedStatus === "open"
                          ? "bg-accessible-green"
                          : computedStatus === "completed"
                            ? "bg-light-charcoal dark:bg-lightgrey"
                            : "bg-danger-red"
                      }`}
                    ></span>
                    <span
                      className={`font-medium ${
                        computedStatus === "open"
                          ? "text-accessible-green"
                          : computedStatus === "completed"
                            ? "text-light-charcoal dark:text-lightgrey"
                            : "text-danger-red"
                      }`}
                    >
                      {computedStatus === "open"
                        ? "Open"
                        : computedStatus === "completed"
                          ? "Completed"
                          : "Closed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🌐 Global</span>
                  </div>
                  {bounty.difficulty && (
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          bounty.difficulty === "beginner"
                            ? "bg-accessible-green/10 text-accessible-green"
                            : bounty.difficulty === "advanced"
                              ? "bg-danger-red/10 text-danger-red"
                              : "bg-orange/10 text-orange"
                        }`}
                      >
                        {bounty.difficulty.charAt(0).toUpperCase() +
                          bounty.difficulty.slice(1)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{submissionCount} participants</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleBookmarkToggle}
                  className={`p-2 rounded-lg border transition ${
                    isBookmarked
                      ? "text-orange bg-orange/5 border-orange"
                      : "border-border-grey dark:border-dark-charcoal hover:border-orange"
                  }`}
                  title={
                    isBookmarked ? "Remove bookmark" : "Bookmark this bounty"
                  }
                >
                  <Bookmark
                    className="w-5 h-5"
                    fill={isBookmarked ? "currentColor" : "none"}
                  />
                </button>
                {/* Notification Bell for Sponsor */}
                {isSponsor && session?.user?.id && (
                  <button
                    onClick={() =>
                      setShowNotificationSettings(!showNotificationSettings)
                    }
                    className={`p-2 rounded-lg border transition ${
                      showNotificationSettings
                        ? "text-orange bg-orange/5 border-orange"
                        : "border-border-grey dark:border-dark-charcoal hover:border-orange"
                    }`}
                    title="Notification settings"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                )}
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
                    submissions={submissionCount}
                    timeRemaining={timeRemaining}
                    skills={bounty.skills}
                    userSubmission={userSubmission}
                    isLoggedIn={!!session?.user?.id}
                    isBountyEnded={isBountyEnded}
                    onSubmit={
                      userSubmission || isBountyEnded
                        ? undefined
                        : () => {
                            if (!session?.user?.id) {
                              toast.info("Please sign in to submit your work");
                              return;
                            }
                            if (!userProfile?.wallet_address) {
                              return;
                            }
                            setShowSubmissionModal(true);
                          }
                    }
                  />

                  {/* Wallet address required warning */}
                  {session?.user?.id &&
                    !userProfile?.wallet_address &&
                    !isBountyEnded &&
                    !userSubmission && (
                      <div className="rounded-lg border border-orange/40 bg-orange/5 px-4 py-3 text-sm text-orange dark:text-orange">
                        <p className="font-medium mb-1">
                          Wallet address required
                        </p>
                        <p className="text-xs text-light-charcoal dark:text-lightgrey">
                          You need to bind your Alph wallet before submitting.{" "}
                          <Link
                            href="/bounty/profile/edit"
                            className="underline text-orange hover:opacity-80"
                          >
                            Go to Edit Profile →
                          </Link>
                        </p>
                      </div>
                    )}

                  {/* Notification Settings for Sponsor */}
                  {isSponsor &&
                    session?.user?.id &&
                    showNotificationSettings && (
                      <div className="bg-white dark:bg-hero-dark rounded-lg p-4 border border-border-grey dark:border-dark-charcoal">
                        <div className="flex items-center gap-2 mb-3">
                          <Bell className="w-4 h-4 text-orange" />
                          <h3 className="text-sm font-semibold text-black dark:text-white">
                            Notification Settings
                          </h3>
                        </div>
                        <NotificationMuteToggle
                          userId={session.user.id}
                          bountyId={bounty.id}
                          bountyTitle={bounty.title}
                        />
                      </div>
                    )}
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
                      current exchange rate.
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
                <div
                  id="comments-section"
                  className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal scroll-mt-20"
                >
                  <CommentSection
                    bountyId={bounty.id}
                    bountyTitle={bounty.title}
                    currentUserId={session?.user?.id}
                    currentUsername={userProfile?.username || undefined}
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
        </section>

        {/* Submission Modal */}
        {session?.user?.id && (
          <SubmissionModal
            isOpen={showSubmissionModal}
            onClose={() => setShowSubmissionModal(false)}
            bountyId={bounty.id}
            bountyTitle={bounty.title}
            bountyStatus={bounty.status ?? undefined}
            userId={session.user.id}
            username={userProfile?.username || undefined}
            sponsorUserId={sponsorUserId || undefined}
            onSuccess={async () => {
              // Refresh submission status and update participant count immediately
              try {
                const result = await apiClient.checkUserSubmission(
                  session.user.id,
                  bounty.id,
                );
                setUserSubmission(result.submission);
                setSubmissionCount((c) => c + 1);
              } catch (error) {
                console.error("Error refreshing submission:", error);
              }
              toast.success(
                "Submission successful! The sponsor has been notified.",
              );
            }}
          />
        )}
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
        usd_equivalent: Number(bountyData.reward_usd) || 0,
      },
      reward_type: bountyData.reward_type || "fixed",
      tier_count: bountyData.tier_count || 5,
      status: bountyData.status,
      start_date: bountyData.start_date,
      end_date: bountyData.end_date,
      current_submissions: bountyData.submission_count || 0,
      category: bountyData.category,
      difficulty: bountyData.difficulty || null,
      dapp_name: bountyData.dapp_name || null,
      sponsor_name: bountyData.sponsor_name || null,
      sponsor_logo_url: bountyData.sponsor_logo_url || null,
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
