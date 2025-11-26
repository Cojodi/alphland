"use client";

import { BountyCard } from "../components/BountyCard";
import { Bounty } from "../types";
import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { Filter, Rocket, CheckCircle, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Mock data - will be replaced with API calls later
const mockBounties: Array<Bounty & { logo: string }> = [
  {
    id: "1",
    sponsor_id: "1",
    logo: "🎲",
    title:
      "Twitter Thread on BlockBet's Referral Program | BlockBet Creator Campaign",
    description: "Create engaging Twitter content about our referral program",
    requirements: ["Twitter presence", "Content creation skills"],
    deliverables: ["Twitter thread", "Engagement metrics"],
    skills: ["Content", "Social Media"],
    reward: {
      amount: 5000,
      token: "USDC",
      usd_equivalent: 5000,
    },
    reward_type: "tiered",
    status: "open",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    current_submissions: 17,
    category: "Content",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    sponsor_id: "2",
    logo: "📱",
    title:
      "Join FlipFlop's Ambassador Program: Footprint Sprint - starting from India 🇮🇳",
    description: "Become an ambassador for our India launch",
    requirements: ["Based in India", "Community building"],
    deliverables: ["Community growth", "Event participation"],
    skills: ["Community", "Marketing"],
    reward: {
      amount: 1510,
      token: "USDT",
      usd_equivalent: 1510,
    },
    reward_type: "fixed",
    status: "open",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    current_submissions: 0,
    category: "Community",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function BountyList() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "bounties" | "projects"
  >("all");
  const [activeCategory, setActiveCategory] = useState<string>("for-you");
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [isSponsor, setIsSponsor] = useState(false);
  const [checkingSponsor, setCheckingSponsor] = useState(true);

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

  const categories = [
    "For You",
    "All",
    "Content",
    "Design",
    "Development",
    "Other",
  ];

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
                      <Link
                        href="/auth/login"
                        className="underline hover:no-underline font-semibold"
                      >
                        sign in
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

                  {/* Filter Tabs */}
                  {/* <div className="flex flex-wrap gap-3 mb-6">
                    <button
                      onClick={() => setActiveFilter("all")}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        activeFilter === "all"
                          ? "bg-orange text-white"
                          : "bg-white dark:bg-hero-dark text-black dark:text-white border border-border-grey dark:border-dark-charcoal hover:bg-smoked-white dark:hover:bg-light-black"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveFilter("bounties")}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        activeFilter === "bounties"
                          ? "bg-orange text-white"
                          : "bg-white dark:bg-hero-dark text-black dark:text-white border border-border-grey dark:border-dark-charcoal hover:bg-smoked-white dark:hover:bg-light-black"
                      }`}
                    >
                      Bounties
                    </button>
                    <button
                      onClick={() => setActiveFilter("projects")}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        activeFilter === "projects"
                          ? "bg-orange text-white"
                          : "bg-white dark:bg-hero-dark text-black dark:text-white border border-border-grey dark:border-dark-charcoal hover:bg-smoked-white dark:hover:bg-light-black"
                      }`}
                    >
                      Projects
                    </button>
                  </div> */}

                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-2 pb-6 border-b border-border-grey dark:border-dark-charcoal mb-6">
                    {categories.map((category) => {
                      const categoryKey = category
                        .toLowerCase()
                        .replace(" ", "-");
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
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-black dark:text-white">
                        9,213,730 USD
                      </p>
                      <p className="text-sm text-light-charcoal dark:text-lightgrey">
                        Total Value Earned
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-black dark:text-white">
                        2415
                      </p>
                      <p className="text-sm text-light-charcoal dark:text-lightgrey">
                        Opportunities Listed
                      </p>
                    </div>
                    <button className="flex items-center gap-2 text-orange font-medium text-sm hover:gap-3 transition">
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                  </div>
                </div>

                {/* Bounty Cards */}
                <div className="space-y-4">
                  {mockBounties.map((bounty) => (
                    <BountyCard
                      key={bounty.id}
                      id={bounty.id}
                      logo={bounty.logo}
                      title={bounty.title}
                      company={bounty.dapp_name || "Company"}
                      reward={`${bounty.reward.amount.toLocaleString()} ${
                        bounty.reward.token
                      }`}
                      tags={[
                        bounty.reward_type === "tiered" ? "Bounty" : "Project",
                        `Due in ${Math.ceil(
                          (new Date(bounty.end_date).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24),
                        )}d`,
                        bounty.current_submissions.toString(),
                        ...(bounty.id === "1" ? ["FEATURED"] : []),
                      ]}
                    />
                  ))}
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
                      : "Launch bounties and engage with talented developers in the Alephium ecosystem."}
                  </p>
                  <Link
                    href={
                      isSponsor
                        ? "/bounty/sponsor/dashboard"
                        : "/bounty/sponsor"
                    }
                    className="block w-full bg-orange hover:bg-orange/90 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-center text-sm"
                  >
                    {isSponsor ? "Go to Dashboard" : "Get Started"}
                  </Link>
                </div>

                {/* How It Works */}
                <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
                  <h3 className="text-lg font-bold text-black dark:text-white mb-4">
                    How It Works
                  </h3>
                  <div className="space-y-3 text-sm text-light-charcoal dark:text-lightgrey">
                    <p>1. Browse available bounties</p>
                    <p>2. Submit your work</p>
                    <p>3. Get rewarded</p>
                  </div>
                </div>

                {/* Recent Earners */}
                <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
                  <h3 className="text-lg font-bold text-black dark:text-white mb-4">
                    Recent Earners
                  </h3>
                  <p className="text-sm text-light-charcoal dark:text-lightgrey">
                    Top contributors this week
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
