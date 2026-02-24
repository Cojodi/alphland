"use client";

import { BountyCard } from "../components/BountyCard";
import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { apiClient, Bounty } from "@/lib/api-client";
import {
  Rocket,
  CheckCircle,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const BOUNTIES_PER_PAGE = 20;

export default function BountyList() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [isSponsor, setIsSponsor] = useState(false);
  const [checkingSponsor, setCheckingSponsor] = useState(true);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [overview, setOverview] = useState({
    total_value_usd: 0,
    total_value_alph: 0,
    list_number: 0,
    user_number: 0,
    sponsor_number: 0,
  });
  const [recentEarners, setRecentEarners] = useState<
    Array<{
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
      avatar_url: string | null;
      submission_count: number;
    }>
  >([]);

  // Fetch bounties, overview, and recent earners from API
  useEffect(() => {
    async function fetchData() {
      try {
        const [bountiesData, overviewData, earnersData] = await Promise.all([
          apiClient.getBounties(),
          apiClient.getBountyOverview(),
          apiClient.getRecentEarners(),
        ]);
        setBounties(bountiesData.bounties);
        setOverview(overviewData.overview);
        setRecentEarners(earnersData.earners);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Check if user is a sponsor
  useEffect(() => {
    async function checkSponsorStatus() {
      if (!session?.user?.id) {
        setCheckingSponsor(false);
        setIsSponsor(false);
        return;
      }

      try {
        const response = await fetch(`/api/sponsors/user/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsSponsor(!!data.sponsor);
        } else {
          setIsSponsor(false);
        }
      } catch (error) {
        console.error("Error checking sponsor status:", error);
        setIsSponsor(false);
      } finally {
        setCheckingSponsor(false);
      }
    }

    checkSponsorStatus();
  }, [session?.user?.id]);

  // Check if user just verified their email
  useEffect(() => {
    // Check for "verified" query parameter from email verification callback
    if (router.query.verified === "true" && !session) {
      setShowVerificationSuccess(true);
      // Remove the query parameter from URL without page reload
      const { verified, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, {
        shallow: true,
      });
    }
  }, [router.query, session]);

  const categories = ["All", "Content", "Design", "Development", "Other"];

  const statuses = [
    { label: "All Status", value: "all" },
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
    { label: "Completed", value: "completed" },
  ];

  // Helper to check if bounty has ended based on end_date
  const isBountyEnded = (bounty: Bounty) => {
    if (!bounty.end_date) return false;
    const daysRemaining = Math.ceil(
      (new Date(bounty.end_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );
    return daysRemaining < 0;
  };

  // Filter bounties based on active category, status, and search query
  const filteredBounties = bounties.filter((bounty) => {
    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) {
      return false;
    }

    // Filter by status (matches the computed display status)
    if (activeStatus !== "all") {
      const isExpired = isBountyEnded(bounty);
      if (activeStatus === "open") {
        // Open: end_date not expired
        if (isExpired) return false;
      } else if (activeStatus === "closed") {
        // Closed: expired AND not marked completed
        if (!isExpired || bounty.status === "completed") return false;
      } else if (activeStatus === "completed") {
        // Completed: DB status is "completed"
        if (bounty.status !== "completed") return false;
      }
    }

    // Filter by category
    if (activeCategory === "all") {
      return true;
    }
    // Match the bounty category with the active category
    return bounty.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBounties.length / BOUNTIES_PER_PAGE);
  const startIndex = (currentPage - 1) * BOUNTIES_PER_PAGE;
  const paginatedBounties = filteredBounties.slice(
    startIndex,
    startIndex + BOUNTIES_PER_PAGE,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeStatus, searchQuery]);

  return (
    <Layout
      title="Bounties - Alphland"
      description="Browse and participate in bounty opportunities"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black">
        {/* Email Verification Success Banner */}
        {showVerificationSuccess && (
          <div className="bg-accessible-green/10 border-b border-accessible-green/30">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accessible-green flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-accessible-green">
                      Email verified successfully!
                    </p>
                    <p className="text-xs text-accessible-green/80 mt-0.5">
                      Please{" "}
                      <Link href="/auth/login">
                        <a className="underline hover:no-underline font-semibold">
                          sign in
                        </a>
                      </Link>{" "}
                      to access all features.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVerificationSuccess(false)}
                  className="text-accessible-green hover:text-accessible-green/80 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Container */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-2">
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-black dark:text-white mb-6">
                    Browse Opportunities
                  </h2>

                  {/* Search Bar */}
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                    <input
                      type="text"
                      placeholder="Search bounties..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {statuses.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setActiveStatus(status.value)}
                        className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                          activeStatus === status.value
                            ? "bg-orange text-white"
                            : "bg-white dark:bg-hero-dark text-light-charcoal dark:text-lightgrey border border-border-grey dark:border-dark-charcoal hover:bg-smoked-white dark:hover:bg-light-black"
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-2 pb-6 border-b border-border-grey dark:border-dark-charcoal mb-6">
                    {categories.map((category) => {
                      const categoryKey = category.toLowerCase();
                      return (
                        <button
                          key={categoryKey}
                          onClick={() => setActiveCategory(categoryKey)}
                          className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                            activeCategory === categoryKey
                              ? "bg-orange/10 text-orange dark:bg-orange/20"
                              : "bg-smoked-white dark:bg-light-black text-light-charcoal dark:text-lightgrey hover:bg-border-grey dark:hover:bg-dark-charcoal"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-black dark:text-white">
                        {overview.total_value_usd > 0
                          ? `${overview.total_value_usd.toLocaleString()} USD`
                          : overview.total_value_alph > 0
                            ? `${overview.total_value_alph.toLocaleString()} ALPH`
                            : "0 USD"}
                      </p>
                      <p className="text-sm text-light-charcoal dark:text-lightgrey">
                        Total Value Earned
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-accessible-green">
                        {
                          bounties.filter(
                            (b) => b.status === "open" && !isBountyEnded(b),
                          ).length
                        }
                      </p>
                      <p className="text-sm text-light-charcoal dark:text-lightgrey">
                        Opportunities Open
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-light-charcoal dark:text-lightgrey">
                        {
                          bounties.filter(
                            (b) =>
                              b.status === "closed" ||
                              b.status === "completed" ||
                              b.status === "cancelled" ||
                              (b.status === "open" && isBountyEnded(b)),
                          ).length
                        }
                      </p>
                      <p className="text-sm text-light-charcoal dark:text-lightgrey">
                        Opportunities Closed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bounty Cards */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-light-charcoal dark:text-lightgrey">
                        Loading bounties...
                      </p>
                    </div>
                  ) : filteredBounties.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-light-charcoal dark:text-lightgrey">
                        {bounties.length === 0
                          ? "No bounties available at the moment."
                          : "No bounties found matching your filters."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {paginatedBounties.map((bounty) => {
                        const daysRemaining = bounty.end_date
                          ? Math.ceil(
                              (new Date(bounty.end_date).getTime() -
                                Date.now()) /
                                (1000 * 60 * 60 * 24),
                            )
                          : null;

                        // Determine status tag based on end_date and DB status
                        const getStatusTag = () => {
                          const isExpired =
                            daysRemaining !== null && daysRemaining < 0;
                          if (!isExpired) return "Open";
                          if (bounty.status === "completed") return "Completed";
                          return "Closed";
                        };

                        return (
                          <BountyCard
                            key={bounty.id}
                            id={bounty.id}
                            logo={bounty.sponsor_logo_url || "💼"}
                            title={bounty.title}
                            company={bounty.sponsor_name || "Sponsor"}
                            reward={`${bounty.reward_amount?.toLocaleString() || "0"} ${
                              bounty.reward_currency || "ALPH"
                            }`}
                            tags={[
                              bounty.difficulty || "beginner",
                              getStatusTag(),
                              bounty.category,
                            ]}
                            sponsorVerified={bounty.sponsor_is_verified === 1}
                          />
                        );
                      })}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border-grey dark:border-dark-charcoal">
                          <button
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-border-grey dark:border-dark-charcoal hover:border-orange disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="text-sm text-light-charcoal dark:text-lightgrey px-4">
                            Page {currentPage} of {totalPages} (
                            {filteredBounties.length} bounties)
                          </span>
                          <button
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-border-grey dark:border-dark-charcoal hover:border-orange disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Sidebar - Right Side */}
              <div className="lg:col-span-1 space-y-8">
                {/* Become a Sponsor CTA */}
                <div className="bg-gradient-to-br from-orange/10 to-accessible-green/10 dark:from-orange/20 dark:to-accessible-green/20 rounded-lg p-6 border border-orange/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange/20 rounded-lg flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-orange" />
                    </div>
                    <h3 className="text-lg font-bold text-black dark:text-white">
                      {isSponsor ? "Sponsor Dashboard" : "Become a Sponsor"}
                    </h3>
                  </div>
                  <p className="text-sm text-light-charcoal dark:text-lightgrey mb-4">
                    {isSponsor
                      ? "Manage your bounties and track submissions."
                      : "Launch bounties and engage directly with talented developers and creators across the Alephium ecosystem."}
                  </p>
                  <Link
                    href={
                      isSponsor
                        ? "/bounty/sponsor/dashboard"
                        : "/bounty/sponsor"
                    }
                  >
                    <a className="block w-full bg-orange hover:bg-orange/90 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-center text-sm">
                      {isSponsor ? "Go to Dashboard" : "Get Started"}
                    </a>
                  </Link>
                </div>

                {/* How It Works */}
                <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
                  <h3 className="text-lg font-bold text-black dark:text-white mb-4">
                    How It Works
                  </h3>
                  <div className="space-y-3 text-sm text-light-charcoal dark:text-lightgrey">
                    <p>1. Join bounties from ecosystem projects</p>
                    <p>2. Deliver high-quality work</p>
                    <p>3. Earn ALPH and unlock new opportunities</p>
                  </div>
                </div>

                {/* Recent Earners */}
                <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
                  <h3 className="text-lg font-bold text-black dark:text-white mb-4">
                    Recent Earners
                  </h3>
                  {loading ? (
                    <p className="text-sm text-light-charcoal dark:text-lightgrey">
                      Loading...
                    </p>
                  ) : recentEarners.length === 0 ? (
                    <p className="text-sm text-light-charcoal dark:text-lightgrey">
                      No recent earners this week
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentEarners.map((earner) => {
                        const displayName = earner.username || "Anonymous";
                        const avatarUrl =
                          earner.avatar_url || earner.image || null;
                        const profileUrl = earner.username
                          ? `/bounty/profile/${earner.username}`
                          : null;

                        const content = (
                          <span className="flex items-center gap-3 p-2 rounded-lg hover:bg-smoked-white dark:hover:bg-light-black transition-colors cursor-pointer">
                            {avatarUrl ? (
                              <Image
                                src={avatarUrl}
                                alt={displayName}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center">
                                <span className="text-orange font-bold text-sm">
                                  {displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-black dark:text-white truncate">
                                {displayName}
                              </p>
                              <p className="text-xs text-light-charcoal dark:text-lightgrey">
                                {earner.submission_count} submission
                                {earner.submission_count !== 1 ? "s" : ""} this
                                week
                              </p>
                            </div>
                          </span>
                        );

                        return profileUrl ? (
                          <Link key={earner.id} href={profileUrl}>
                            {content}
                          </Link>
                        ) : (
                          <div key={earner.id}>{content}</div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
