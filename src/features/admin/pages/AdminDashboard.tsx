/* eslint-disable @next/next/no-html-link-for-pages */
import {
  Users,
  AppWindow,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

interface Sponsor {
  id: string;
  user_id: string;
  name: string;
  username?: string;
  description?: string;
  entity_name?: string;
  industry?: string;
  logo_url?: string;
  website?: string;
  twitter?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_telegram?: string;
  status: "pending" | "approved" | "rejected";
  created_at: number;
  updated_at: number;
}

type SponsorFilter = "pending" | "approved" | "rejected";

export default function AdminDashboard() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sponsorFilter, setSponsorFilter] = useState<SponsorFilter>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  // Fetch sponsors
  const fetchSponsors = useCallback(async () => {
    try {
      const url = `/api/sponsors?status=${sponsorFilter}`;
      const response = await fetch(url);
      const data = await response.json();
      setSponsors(data.sponsors || []);
    } catch (error) {
      console.error("Failed to fetch sponsors:", error);
    }
  }, [sponsorFilter]);

  useEffect(() => {
    setLoading(true);
    fetchSponsors().finally(() => setLoading(false));
  }, [fetchSponsors]);

  // Approve sponsor
  const handleApproveSponsor = async (sponsorId: string) => {
    setActionLoading(sponsorId);
    try {
      const response = await fetch(`/api/sponsors/${sponsorId}/approve`, {
        method: "PUT",
      });
      if (response.ok) {
        await fetchSponsors();
      }
    } catch (error) {
      console.error("Failed to approve sponsor:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject sponsor
  const handleRejectSponsor = async (sponsorId: string) => {
    setActionLoading(sponsorId);
    try {
      const response = await fetch(`/api/sponsors/${sponsorId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (response.ok) {
        await fetchSponsors();
        setShowRejectModal(null);
        setRejectReason("");
      }
    } catch (error) {
      console.error("Failed to reject sponsor:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: Sponsor["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accessible-green/10 text-accessible-green">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange/10 text-orange">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-clay/20 text-dark-charcoal dark:text-lightgrey">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const filteredSponsors = sponsors;

  const pendingCount = sponsors.filter((s) => s.status === "pending").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoked-white dark:bg-light-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange mx-auto"></div>
          <p className="mt-4 text-light-charcoal font-barlow">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-smoked-white dark:bg-light-black">
      {/* Header */}
      <section className="bg-hero-dark text-white py-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold font-barlow">
                Admin Dashboard
              </h1>
              <p className="text-lightgrey font-barlow">
                Manage sponsors, dapps and have a full overview of the platform.
              </p>
            </div>
            {pendingCount > 0 && (
              <div className="bg-orange/20 rounded-lg px-4 py-2">
                <span className="text-orange font-barlow font-semibold">
                  {pendingCount} pending approval{pendingCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        {/* Tabs */}
        <div className="border-b border-border-grey dark:border-dark-charcoal">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 px-1 py-3 font-barlow font-medium text-sm text-light-black dark:text-white border-b-2 border-orange -mb-px">
              <Users className="w-4 h-4" />
              Sponsor Management
              {pendingCount > 0 && (
                <span className="bg-orange text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
            {/* External link to Netlify CMS - cannot use Next.js Link */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages, jsx-a11y/anchor-is-valid */}
            <a
              href="/admin/index.html#/collections/dapps"
              className="flex items-center gap-2 px-1 py-3 font-barlow font-medium text-sm text-light-charcoal hover:text-light-black dark:hover:text-white transition-colors"
            >
              <AppWindow className="w-4 h-4" />
              Dapp Management
            </a>
          </div>
        </div>

        {/* Sponsor Management */}
        <div className="space-y-6">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "rejected"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSponsorFilter(filter)}
                className={`px-4 py-2 rounded-lg font-barlow font-medium text-sm transition-all ${
                  sponsorFilter === filter
                    ? "bg-light-black dark:bg-white text-white dark:text-light-black"
                    : "bg-white dark:bg-hero-dark text-light-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black border border-border-grey dark:border-dark-charcoal"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Sponsors List */}
          {filteredSponsors.length === 0 ? (
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-12 text-center">
              <Users className="w-12 h-12 text-light-charcoal mx-auto mb-4" />
              <p className="text-light-charcoal font-barlow">
                No sponsors found for this filter
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 hover:shadow-box-image-shadow-hover transition-all duration-300"
                >
                  <div className="flex flex-col gap-4">
                    {/* Sponsor Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {sponsor.logo_url ? (
                        <Image
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-smoked-white dark:bg-light-black flex items-center justify-center">
                          <Users className="w-8 h-8 text-light-charcoal" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-light-black dark:text-white font-barlow">
                            {sponsor.name}
                          </h3>
                          {getStatusBadge(sponsor.status)}
                        </div>
                        {sponsor.username && (
                          <p className="text-sm text-light-charcoal font-barlow">
                            @{sponsor.username}
                          </p>
                        )}
                        {sponsor.description && (
                          <p className="text-sm text-light-charcoal font-barlow mt-1 line-clamp-2">
                            {sponsor.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-light-charcoal font-barlow">
                          {sponsor.industry && (
                            <span>Industry: {sponsor.industry}</span>
                          )}
                          {sponsor.entity_name && (
                            <span>Entity: {sponsor.entity_name}</span>
                          )}
                          <span>Applied: {formatDate(sponsor.created_at)}</span>
                        </div>
                        {sponsor.contact_first_name && (
                          <p className="text-xs text-light-charcoal font-barlow mt-1">
                            Contact: {sponsor.contact_first_name}{" "}
                            {sponsor.contact_last_name}
                            {sponsor.contact_telegram &&
                              ` (@${sponsor.contact_telegram})`}
                          </p>
                        )}
                        <div className="flex gap-3 mt-2">
                          {sponsor.website && (
                            <a
                              href={sponsor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange hover:underline text-xs flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Website
                            </a>
                          )}
                          {sponsor.twitter && (
                            <a
                              href={`https://twitter.com/${sponsor.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange hover:underline text-xs flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Twitter
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions - Only show for pending sponsors */}
                    {sponsor.status === "pending" && (
                      <div className="flex gap-3 pt-4 border-t border-border-grey dark:border-dark-charcoal">
                        <button
                          onClick={() => handleApproveSponsor(sponsor.id)}
                          disabled={actionLoading === sponsor.id}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-accessible-green hover:opacity-90 text-white rounded-lg font-barlow font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === sponsor.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => setShowRejectModal(sponsor.id)}
                          disabled={actionLoading === sponsor.id}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-orange hover:opacity-90 text-white rounded-lg font-barlow font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-hero-dark rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-light-black dark:text-white font-barlow">
              Reject Sponsor Application
            </h3>
            <p className="text-sm text-light-charcoal font-barlow">
              Please provide a reason for rejection (optional):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-border-grey dark:border-dark-charcoal rounded-lg bg-white dark:bg-light-black text-light-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-border-grey dark:border-dark-charcoal text-light-charcoal hover:bg-smoked-white dark:hover:bg-light-black rounded-lg font-barlow font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectSponsor(showRejectModal)}
                disabled={actionLoading === showRejectModal}
                className="px-4 py-2 bg-orange hover:opacity-90 text-white rounded-lg font-barlow font-medium text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {actionLoading === showRejectModal ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
