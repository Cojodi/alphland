import type { Sponsor } from "../types/sponsor.types";
import Layout from "@/components/Layout";
import { Globe, CircleDollarSign, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

interface Bounty {
  id: string;
  title: string;
  description: string;
  end_date: string;
  current_submissions: number;
  reward: {
    amount: number;
    token: string;
  };
}

interface SponsorProfileProps {
  sponsor: Sponsor;
  bounties?: Bounty[];
}

export default function SponsorProfile({
  sponsor,
  bounties = [],
}: SponsorProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bounties" | "about">("bounties");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hour${hours > 1 ? "s" : ""} left`;
  };

  const formatDate = (date: string | number) => {
    // Handle Unix timestamp (seconds) or ISO string
    const timestamp = typeof date === "string" ? parseInt(date) : date;
    // If it's a Unix timestamp in seconds (< 10000000000), convert to milliseconds
    const milliseconds = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    return new Date(milliseconds).toLocaleDateString();
  };

  return (
    <Layout
      title={`${sponsor.name} - Sponsor Profile`}
      description={sponsor.description || `Sponsor profile for ${sponsor.name}`}
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black">
        {/* Back Button */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <button
            onClick={() => router.push("/bounty/sponsor/dashboard")}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-hero-dark hover:bg-smoked-white dark:hover:bg-light-black text-black dark:text-white rounded-lg shadow-md transition-colors border border-border-grey dark:border-dark-charcoal"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="w-32 h-32 border-4 border-white dark:border-hero-dark rounded-lg bg-white dark:bg-hero-dark shadow-box-image-shadow flex-shrink-0 flex items-center justify-center overflow-hidden">
                {sponsor.logo_url ? (
                  <Image
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-3xl font-semibold text-orange bg-orange/10 w-full h-full flex items-center justify-center">
                    {getInitials(sponsor.name)}
                  </div>
                )}
              </div>

              <div className="flex-1 pt-2">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white">
                    {sponsor.name}
                  </h1>
                  {sponsor.is_verified && (
                    <span className="px-3 py-1 bg-accessible-green/20 text-accessible-green rounded-full text-sm font-medium">
                      Verified
                    </span>
                  )}
                </div>

                <p className="text-light-charcoal dark:text-lightgrey text-base mb-6">
                  {sponsor.description || "A sponsor on the Alephium platform"}
                </p>

                {/* Social Links */}
                <div className="flex flex-wrap gap-2">
                  {sponsor.website && (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border-2 border-orange text-orange hover:bg-orange/5 rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {sponsor.twitter && (
                    <a
                      href={`https://x.com/${sponsor.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border-2 border-accessible-green text-accessible-green hover:bg-accessible-green/5 rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2"
                    >
                      𝕏 Twitter
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Banner - only show if sponsor has a custom banner image */}
            {sponsor.banner_url && (
              <div className="h-48 relative overflow-hidden rounded-xl">
                <Image
                  src={sponsor.banner_url}
                  alt={`${sponsor.name} banner`}
                  layout="fill"
                  objectFit="cover"
                  priority
                />
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal rounded-lg p-5 hover:shadow-box-image-shadow-hover transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange/10 dark:bg-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CircleDollarSign className="w-6 h-6 text-orange" />
                  </div>
                  <div>
                    <p className="text-sm text-light-charcoal dark:text-lightgrey">
                      Total Bounties
                    </p>
                    <h3 className="text-2xl font-bold text-black dark:text-white">
                      {sponsor.total_bounties_count}
                    </h3>
                  </div>
                </div>
              </div>

              {/* <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal rounded-lg p-5 hover:shadow-box-image-shadow-hover transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accessible-green/10 dark:bg-accessible-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-accessible-green" />
                  </div>
                  <div>
                    <p className="text-sm text-light-charcoal dark:text-lightgrey">
                      Total Projects
                    </p>
                    <h3 className="text-2xl font-bold text-black dark:text-white">
                      {sponsor.total_projects_count}
                    </h3>
                  </div>
                </div>
              </div> */}

              <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal rounded-lg p-5 hover:shadow-box-image-shadow-hover transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange/10 dark:bg-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CircleDollarSign className="w-6 h-6 text-orange" />
                  </div>
                  <div>
                    <p className="text-sm text-light-charcoal dark:text-lightgrey">
                      Total Rewards
                    </p>
                    <h3 className="text-2xl font-bold text-black dark:text-white">
                      {formatCurrency(sponsor.total_reward_amount)}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div>
              <div className="border-b border-border-grey dark:border-dark-charcoal">
                <div className="flex gap-8">
                  <button
                    onClick={() => setActiveTab("bounties")}
                    className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                      activeTab === "bounties"
                        ? "border-orange text-orange"
                        : "border-transparent text-light-charcoal dark:text-lightgrey hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Active Bounties
                  </button>
                  <button
                    onClick={() => setActiveTab("about")}
                    className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                      activeTab === "about"
                        ? "border-orange text-orange"
                        : "border-transparent text-light-charcoal dark:text-lightgrey hover:text-black dark:hover:text-white"
                    }`}
                  >
                    About
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="pt-6">
                {activeTab === "bounties" && (
                  <div>
                    {bounties.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-light-charcoal dark:text-lightgrey text-base">
                          No active bounties at the moment.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {bounties.map((bounty) => (
                          <Link key={bounty.id} href={`/bounty/${bounty.id}`}>
                            <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal rounded-lg p-5 cursor-pointer hover:border-orange hover:shadow-box-image-shadow-hover transition-all">
                              <div className="flex justify-between items-start gap-4 flex-col sm:flex-row">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                                    {bounty.title}
                                  </h3>
                                  <p className="text-sm text-light-charcoal dark:text-lightgrey line-clamp-2 mb-3">
                                    {bounty.description}
                                  </p>
                                  <div className="flex items-center gap-6 text-sm text-light-charcoal dark:text-lightgrey">
                                    <span>
                                      {calculateTimeRemaining(bounty.end_date)}
                                    </span>
                                    <span>
                                      {bounty.current_submissions} submissions
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-accessible-green">
                                      {bounty.reward.amount}
                                    </div>
                                    <span className="text-sm text-light-charcoal dark:text-lightgrey">
                                      {bounty.reward.token}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "about" && (
                  <div className="bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
                      About {sponsor.name}
                    </h2>
                    <div className="space-y-6">
                      {sponsor.description && (
                        <div>
                          <h3 className="text-base font-semibold text-black dark:text-white mb-3">
                            Description
                          </h3>
                          <p className="text-light-charcoal dark:text-lightgrey leading-relaxed">
                            {sponsor.description}
                          </p>
                        </div>
                      )}

                      <div>
                        <h3 className="text-base font-semibold text-black dark:text-white mb-4">
                          Sponsor Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-semibold text-orange mb-1">
                              Joined
                            </p>
                            <p className="text-light-charcoal dark:text-lightgrey">
                              {formatDate(sponsor.created_at)}
                            </p>
                          </div>
                          {sponsor.is_verified && (
                            <div>
                              <p className="text-sm font-semibold text-orange mb-1">
                                Verification
                              </p>
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-accessible-green/20 text-accessible-green">
                                Verified
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Server-side data fetching for Next.js
export async function getServerSideProps(context: any) {
  const { id } = context.params;

  try {
    // Determine the API base URL
    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Fetch sponsor data with bounties
    const response = await fetch(`${baseUrl}/api/sponsors/${id}/dashboard`);

    if (!response.ok) {
      return {
        notFound: true,
      };
    }

    const data = await response.json();

    // Transform sponsor data
    const sponsor: Sponsor = {
      ...data.sponsor,
      is_verified: data.sponsor.is_verified === 1,
    };

    // Transform bounties data
    const bounties: Bounty[] = (data.bounties || [])
      .filter((b: any) => b.status === "open")
      .map((b: any) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        end_date: b.end_date,
        current_submissions: b.submission_count || 0,
        reward: {
          amount: parseFloat(b.reward_amount) || 0,
          token: b.reward_currency || "ALPH",
        },
      }));

    return {
      props: {
        sponsor,
        bounties,
      },
    };
  } catch (error) {
    console.error("Error fetching sponsor data:", error);
    return {
      notFound: true,
    };
  }
}
