import type { Bounty } from "../types/bounty.types";
import type { Sponsor } from "../types/sponsor.types";
import type { Submission } from "../types/submission.types";
import {
  CircleDollarSign,
  Plus,
  BarChart3,
  Edit,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";

export default function SponsorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleViewBounty = useCallback(
    (bountyId: string) => {
      router.push(`/bounty/${bountyId}`);
    },
    [router]
  );

  const handleEditBounty = useCallback(
    (bountyId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/bounty/edit/${bountyId}`);
    },
    [router]
  );

  const viewSubmission = useCallback((submission: Submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionDetails(true);
  }, []);

  const handleSelectBounty = useCallback(
    (bounty: Bounty) => {
      router.push(`/bounty/${bounty.id}`);
    },
    [router]
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  const getBountyTitle = (bountyId: string) => {
    const bounty = bounties.find((b) => b.id === bountyId);
    return bounty ? bounty.title : "Unknown Bounty";
  };

  const handleProfileUpdate = useCallback((updatedSponsor: Sponsor) => {
    setSponsor(updatedSponsor);
  }, []);

  const handleStatusUpdate = useCallback(
    (submissionId: string, status: "submitted" | "accepted" | "rejected") => {
      const updatedSubmissions = allSubmissions.map((submission) =>
        submission.id === submissionId ? { ...submission, status } : submission
      );
      setAllSubmissions(updatedSubmissions);
    },
    [allSubmissions]
  );

  const refreshSubmissions = useCallback(() => {
    // Logic to refresh submissions
  }, []);

  useEffect(() => {
    // Fetch sponsor data and bounties/submissions
    setLoading(true);
    // Placeholder fetch logic - TODO: Replace with actual API call
    setTimeout(() => {
      setSponsor({
        id: "1",
        user_id: "user1",
        name: "Alphland",
        username: "alphland",
        description: "A decentralized platform for developers",
        entity_name: "Alphland Labs",
        industry: "Infrastructure",
        website: "https://alphland.com",
        twitter: "alphland",
        contact_first_name: "John",
        contact_last_name: "Doe",
        contact_username: "johndoe",
        contact_telegram: "johndoe",
        wallet_address: "0x1234567890",
        total_bounties_count: 10,
        total_projects_count: 5,
        total_reward_amount: 5000,
        status: "approved",
        is_verified: true,
        approved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setBounties([
        {
          id: "1",
          sponsor_id: "1",
          title: "Bounty 1",
          description: "Test bounty",
          requirements: [],
          deliverables: [],
          skills: [],
          status: "open",
          current_submissions: 3,
          end_date: "2023-12-31",
          start_date: "2023-01-01",
          reward: { amount: 100, token: "ALPH", usd_equivalent: 100 },
          reward_type: "fixed" as const,
          category: "Development",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setAllSubmissions([
        {
          id: "1",
          title: "Submission 1",
          description: "Test submission",
          submission_url: "https://example.com",
          user_username: "John Doe",
          user_avatar_url: "",
          user_id: "user1",
          user_wallet_address: "0x123",
          bounty_id: "1",
          bounty_name: "Bounty 1",
          sponsor_id: "1",
          status: "accepted",
          submitted_at: "2023-10-01",
        },
      ]);
      setLoading(false);
    }, 0);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-smoked-white to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-primary font-barlow">
            Create Your Sponsor Profile
          </h2>
          <p className="text-secondary max-w-md">
            Get started managing bounties and tracking submissions
          </p>
          <button
            onClick={() => router.push("/bounty/sponsor")}
            className="mt-4 bg-primary hover:bg-primary/90 text-white font-barlow font-medium px-6 py-2 rounded-lg"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-smoked-white via-white to-light-gray dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Header */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold font-barlow">
                Sponsor Dashboard
              </h1>
              <p className="text-xl text-white/90 font-barlow">
                {sponsor.name}
              </p>
              <p className="text-white/70 font-barlow">
                Manage bounties, track submissions, and reward contributors
              </p>
            </div>
            <button
              onClick={() => router.push("/bounty/create")}
              className="bg-white dark:bg-gray-800 text-primary dark:text-white hover:bg-white/90 dark:hover:bg-gray-700 font-barlow font-semibold px-6 py-3 text-base shadow-lg rounded-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              New Listing
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        {/* Stats Overview - 3 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Bounties Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-primary/10 dark:border-primary/20 p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-secondary font-barlow font-medium text-sm uppercase tracking-wide">
                  Total Bounties
                </p>
                <h3 className="text-3xl sm:text-4xl font-bold text-primary font-barlow">
                  {sponsor.total_bounties_count}
                </h3>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                <CircleDollarSign className="w-7 h-7 text-primary" />
              </div>
            </div>
            <p className="text-xs text-secondary mt-3 font-barlow">
              Active and completed listings
            </p>
          </div>

          {/* Total Projects Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-secondary/10 dark:border-secondary/20 p-6 hover:border-secondary/30 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-secondary font-barlow font-medium text-sm uppercase tracking-wide">
                  Total Projects
                </p>
                <h3 className="text-3xl sm:text-4xl font-bold text-secondary font-barlow">
                  {sponsor.total_projects_count}
                </h3>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-secondary" />
              </div>
            </div>
            <p className="text-xs text-secondary mt-3 font-barlow">
              Connected projects
            </p>
          </div>

          {/* Total Rewards Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-accent-orange/10 dark:border-accent-orange/20 p-6 hover:border-accent-orange/30 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-secondary font-barlow font-medium text-sm uppercase tracking-wide">
                  Total Rewards
                </p>
                <h3 className="text-3xl sm:text-4xl font-bold text-accent-orange font-barlow">
                  ${sponsor.total_reward_amount.toLocaleString()}
                </h3>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-accent-orange/20 to-accent-orange/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-accent-orange" />
              </div>
            </div>
            <p className="text-xs text-secondary mt-3 font-barlow">
              Distributed funds
            </p>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="space-y-6">
          <div className="border-b border-light-gray dark:border-gray-700">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => handleTabChange("overview")}
                className={`px-4 py-3 font-barlow font-medium text-sm border-b-2 transition-all duration-300 ${
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-secondary hover:text-primary"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => handleTabChange("bounties")}
                className={`px-4 py-3 font-barlow font-medium text-sm border-b-2 transition-all duration-300 ${
                  activeTab === "bounties"
                    ? "border-primary text-primary"
                    : "border-transparent text-secondary hover:text-primary"
                }`}
              >
                Bounties
              </button>
              <button
                onClick={() => handleTabChange("submissions")}
                className={`px-4 py-3 font-barlow font-medium text-sm border-b-2 transition-all duration-300 ${
                  activeTab === "submissions"
                    ? "border-primary text-primary"
                    : "border-transparent text-secondary hover:text-primary"
                }`}
              >
                Submissions
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-light-gray dark:border-gray-700 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-primary font-barlow">
                    Profile Information
                  </h2>
                  <button
                    onClick={() => setShowProfileManager(true)}
                    className="bg-primary hover:bg-primary/90 text-white font-barlow font-medium px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-barlow font-semibold text-secondary mb-2">
                      Description
                    </p>
                    <p className="text-secondary font-barlow leading-relaxed">
                      {sponsor.description || "No description provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-barlow font-semibold text-secondary mb-2">
                      Website
                    </p>
                    <p className="text-secondary font-barlow">
                      {sponsor.website ? (
                        <a
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {sponsor.website}
                        </a>
                      ) : (
                        "No website provided"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-barlow font-semibold text-secondary mb-2">
                      Twitter
                    </p>
                    <p className="text-secondary font-barlow">
                      {sponsor.twitter ? (
                        <a
                          href={`https://twitter.com/${sponsor.twitter.replace(
                            "@",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {sponsor.twitter}
                        </a>
                      ) : (
                        "No Twitter handle provided"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-barlow font-semibold text-secondary mb-2">
                      Logo
                    </p>
                    <p className="text-secondary font-barlow">
                      {sponsor.logo_url ? "Uploaded" : "Not uploaded"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Bounties & Submissions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Bounties */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-light-gray dark:border-gray-700 p-6 space-y-4">
                  <h3 className="text-lg font-bold text-primary font-barlow">
                    Recent Bounties
                  </h3>
                  {bounties.length === 0 ? (
                    <p className="text-secondary font-barlow">
                      No bounties found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {bounties.slice(0, 5).map((bounty) => (
                        <div
                          key={bounty.id}
                          className="p-4 border border-light-gray dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
                          onClick={() => handleViewBounty(bounty.id)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-semibold text-primary font-barlow group-hover:text-primary/80 transition-colors">
                                {bounty.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className={`text-xs font-barlow font-medium px-2 py-1 rounded ${
                                    bounty.status === "open"
                                      ? "bg-secondary/20 text-secondary"
                                      : "bg-light-gray text-secondary"
                                  }`}
                                >
                                  {bounty.status}
                                </span>
                                <span className="text-xs text-secondary font-barlow">
                                  {bounty.current_submissions} submissions
                                </span>
                              </div>
                            </div>
                            <button
                              className="text-primary hover:bg-primary/10 p-2 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditBounty(bounty.id, e);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Submissions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-light-gray dark:border-gray-700 p-6 space-y-4">
                  <h3 className="text-lg font-bold text-primary font-barlow">
                    Recent Submissions
                  </h3>
                  {allSubmissions.length === 0 ? (
                    <p className="text-secondary font-barlow">
                      No submissions found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {allSubmissions.slice(0, 5).map((submission) => (
                        <div
                          key={submission.id}
                          className="p-4 border border-light-gray dark:border-gray-700 rounded-lg hover:border-secondary hover:bg-secondary/5 transition-all duration-200 cursor-pointer"
                          onClick={() => viewSubmission(submission)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 flex-shrink-0 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-barlow">
                                {submission.user_username
                                  ? getInitials(submission.user_username)
                                  : "AN"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-primary font-barlow truncate">
                                  {submission.user_username}
                                </p>
                                <p className="text-xs text-secondary font-barlow truncate">
                                  {getBountyTitle(submission.bounty_id)}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-xs font-barlow font-medium px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${
                                submission.status === "accepted"
                                  ? "bg-secondary/20 text-secondary"
                                  : submission.status === "rejected"
                                  ? "bg-red-500/20 text-red-500"
                                  : "bg-yellow-500/20 text-yellow-600"
                              }`}
                            >
                              {submission.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bounties Tab */}
          {activeTab === "bounties" && (
            <div className="space-y-4">
              {bounties.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-light-gray dark:border-gray-700 p-12 text-center space-y-4">
                  <p className="text-secondary font-barlow">
                    No bounties created yet
                  </p>
                  <button
                    onClick={() => router.push("/bounty/create")}
                    className="bg-primary hover:bg-primary/90 text-white font-barlow font-medium px-6 py-2 rounded-lg mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Bounty
                  </button>
                </div>
              ) : (
                bounties.map((bounty) => (
                  <div
                    key={bounty.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-light-gray dark:border-gray-700 p-6 hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => handleSelectBounty(bounty)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-primary font-barlow mb-2">
                          {bounty.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span
                            className={`text-xs font-barlow font-medium px-2 py-1 rounded ${
                              bounty.status === "open"
                                ? "bg-secondary/20 text-secondary"
                                : "bg-light-gray text-secondary"
                            }`}
                          >
                            {bounty.status}
                          </span>
                          <span className="text-xs font-barlow font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                            {bounty.category}
                          </span>
                        </div>
                        <p className="text-sm text-secondary font-barlow">
                          {bounty.current_submissions} submissions • Due{" "}
                          {formatDate(bounty.end_date)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4">
                        <div className="font-semibold text-primary font-barlow">
                          {bounty.reward.amount} {bounty.reward.token}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="border border-primary text-primary hover:bg-primary/10 font-barlow px-3 py-1 rounded text-sm flex items-center gap-1"
                            onClick={(e) => handleEditBounty(bounty.id, e)}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === "submissions" && (
            <div className="space-y-4">
              {allSubmissions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-light-gray dark:border-gray-700 p-12 text-center">
                  <p className="text-secondary font-barlow">
                    No submissions yet. Create bounties to receive submissions.
                  </p>
                </div>
              ) : (
                allSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-light-gray dark:border-gray-700 p-6 hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => viewSubmission(submission)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 flex-shrink-0 bg-primary rounded-full flex items-center justify-center text-white font-barlow font-semibold">
                          {submission.user_username
                            ? getInitials(submission.user_username)
                            : "AN"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-primary font-barlow">
                            {submission.title || "Untitled"}
                          </h4>
                          <p className="text-sm text-secondary font-barlow truncate">
                            {submission.user_username} •{" "}
                            {formatDate(submission.submitted_at)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-barlow font-medium px-3 py-1 rounded whitespace-nowrap ${
                          submission.status === "accepted"
                            ? "bg-secondary/20 text-secondary"
                            : submission.status === "rejected"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-yellow-500/20 text-yellow-600"
                        }`}
                      >
                        {submission.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs - TODO: Implement these components */}
      {/* <SponsorSubmissionDialog
          isOpen={showSubmissionDetails}
          onClose={() => setShowSubmissionDetails(false)}
          submission={selectedSubmission}
          onStatusUpdate={handleStatusUpdate}
          onRefresh={refreshSubmissions}
        /> */}

      {/* <Dialog open={showProfileManager} onOpenChange={setShowProfileManager}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-barlow">Edit Profile</DialogTitle>
            </DialogHeader>
            {sponsor && (
              <ProfilePictureManager
                sponsor={sponsor}
                onUpdate={handleProfileUpdate}
              />
            )}
          </DialogContent>
        </Dialog> */}
    </div>
  );
}
