"use client";

import { BountyCard } from "../components/BountyCard";
import { Bounty } from "../types";
import Layout from "@/components/Layout";
import { Filter } from "lucide-react";
import { useState } from "react";

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
  const [activeFilter, setActiveFilter] = useState<
    "all" | "bounties" | "projects"
  >("all");
  const [activeCategory, setActiveCategory] = useState<string>("for-you");

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
                            (1000 * 60 * 60 * 24)
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
