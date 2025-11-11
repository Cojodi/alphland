"use client";

import { TieredRewardDisplay } from "../components/TieredRewardDisplay";
import { Bounty } from "../types";
import { generateTieredRewards } from "../utils/rewardCalculator";
import { calculateTimeRemaining } from "../utils/timeFormatter";
import Layout from "@/components/Layout";
import { Bookmark, MoreVertical, Users, ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";

interface BountyDetailProps {
  bounty: Bounty;
}

export default function BountyDetail({ bounty }: BountyDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"prizes" | "details">("prizes");
  const [isBookmarked, setIsBookmarked] = useState(false);

  const tieredRewards =
    bounty.reward_type === "tiered"
      ? generateTieredRewards(bounty.reward, 5)
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
              <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-orange to-orange/80 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {bounty.dapp_name?.[0] || "B"}
                </span>
              </div>

              {/* Title and Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white leading-tight mb-3">
                  {bounty.title}
                </h1>

                <div className="flex flex-wrap gap-4 text-sm text-light-charcoal dark:text-lightgrey mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      by {bounty.dapp_name || "Sponsor"}
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

        {/* Tabs */}
        <section className="border-b border-border-grey dark:border-dark-charcoal bg-white dark:bg-hero-dark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("prizes")}
                className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === "prizes"
                    ? "border-orange text-orange"
                    : "border-transparent text-light-charcoal dark:text-lightgrey hover:text-black dark:hover:text-white"
                }`}
              >
                Prizes
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === "details"
                    ? "border-orange text-orange"
                    : "border-transparent text-light-charcoal dark:text-lightgrey hover:text-black dark:hover:text-white"
                }`}
              >
                Details
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
              <div className="lg:col-span-2">
                {activeTab === "prizes" ? (
                  <div className="bg-white dark:bg-hero-dark rounded-lg p-8 border border-border-grey dark:border-dark-charcoal">
                    <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
                      Prize Distribution
                    </h2>
                    <p className="text-light-charcoal dark:text-lightgrey mb-6">
                      {bounty.description}
                    </p>

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
                ) : (
                  <div className="bg-white dark:bg-hero-dark rounded-lg p-8 border border-border-grey dark:border-dark-charcoal">
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
                )}
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

  // TODO: Replace with actual API call to Cloudflare
  const mockBounty: Bounty = {
    id,
    sponsor_id: "1",
    title: "Twitter Thread on BlockBet's Referral Program",
    description: "Create engaging Twitter content about our referral program",
    requirements: [
      "Twitter presence with 1000+ followers",
      "Content creation experience",
    ],
    deliverables: [
      "Twitter thread with 10+ tweets",
      "Engagement metrics report",
    ],
    skills: ["Content", "Social Media", "Writing"],
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
    dapp_name: "BlockBet",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    props: {
      bounty: mockBounty,
    },
  };
}
