/* eslint-disable @next/next/no-html-link-for-pages */
import {
  Users,
  AppWindow,
  ExternalLink,
  Ban,
  CheckCircle,
  FileText,
  TrendingUp,
  DollarSign,
  Award,
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
  is_banned: number;
  banned_at?: number;
  is_verified: number;
  bounty_count?: number;
  created_at: number;
  updated_at: number;
}

interface BountyOverview {
  id: number;
  total_value_usd: number;
  total_value_alph: number;
  list_number: number;
  user_number: number;
  sponsor_number: number;
  updated_at: number;
}

type SponsorFilter = "active" | "banned";

export default function AdminDashboard() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sponsorFilter, setSponsorFilter] = useState<SponsorFilter>("active");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [bountyOverview, setBountyOverview] = useState<BountyOverview | null>(
    null,
  );

  // Fetch bounty overview
  const fetchBountyOverview = useCallback(async () => {
    try {
      const response = await fetch("/api/bounty-overview");
      const data = await response.json();
      setBountyOverview(data.overview);
    } catch (error) {
      console.error("Failed to fetch bounty overview:", error);
    }
  }, []);

  // Fetch sponsors
  const fetchSponsors = useCallback(async () => {
    try {
      const isBanned = sponsorFilter === "banned" ? "true" : "false";
      const url = `/api/sponsors?is_banned=${isBanned}`;
      const response = await fetch(url);
      const data = await response.json();
      setSponsors(data.sponsors || []);
    } catch (error) {
      console.error("Failed to fetch sponsors:", error);
    }
  }, [sponsorFilter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBountyOverview(), fetchSponsors()]).finally(() =>
      setLoading(false),
    );
  }, [fetchBountyOverview, fetchSponsors]);

  // Ban sponsor
  const handleBanSponsor = async (sponsorId: string) => {
    setActionLoading(sponsorId);
    try {
      const response = await fetch(`/api/sponsors/${sponsorId}/ban`, {
        method: "PUT",
      });
      if (response.ok) {
        await fetchSponsors();
        setShowBanModal(null);
      }
    } catch (error) {
      console.error("Failed to ban sponsor:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Unban sponsor
  const handleUnbanSponsor = async (sponsorId: string) => {
    setActionLoading(sponsorId);
    try {
      const response = await fetch(`/api/sponsors/${sponsorId}/unban`, {
        method: "PUT",
      });
      if (response.ok) {
        await fetchSponsors();
      }
    } catch (error) {
      console.error("Failed to unban sponsor:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Verify sponsor
  const handleVerifySponsor = async (sponsorId: string) => {
    setActionLoading(sponsorId);
    try {
      const response = await fetch(`/api/sponsors/${sponsorId}/verify`, {
        method: "PUT",
      });
      if (response.ok) {
        await fetchSponsors();
      }
    } catch (error) {
      console.error("Failed to verify sponsor:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Unverify sponsor
  const handleUnverifySponsor = async (sponsorId: string) => {
    setActionLoading(sponsorId);
    try {
      const response = await fetch(`/api/sponsors/${sponsorId}/unverify`, {
        method: "PUT",
      });
      if (response.ok) {
        await fetchSponsors();
      }
    } catch (error) {
      console.error("Failed to unverify sponsor:", error);
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

  const getStatusBadge = (sponsor: Sponsor) => {
    if (sponsor.is_banned) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange/10 text-orange">
          <Ban className="w-3 h-3" />
          Banned
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accessible-green/10 text-accessible-green">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  };

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
                <a href="/">Admin Dashboard</a>
              </h1>
              <p className="text-lightgrey font-barlow">
                Manage sponsors, dapps and have a full overview of the platform.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-accessible-green/20 rounded-lg px-4 py-2">
                <span className="text-accessible-green font-barlow font-semibold">
                  {sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        {/* Bounty Overview Stats */}
        {bountyOverview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 hover:shadow-box-image-shadow-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-orange" />
                </div>
                <span className="text-sm text-light-charcoal font-barlow">
                  Total Value (USD)
                </span>
              </div>
              <p className="text-2xl font-bold text-light-black dark:text-white font-barlow">
                ${bountyOverview.total_value_usd.toLocaleString()}
              </p>
            </div>

            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 hover:shadow-box-image-shadow-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accessible-green/10 rounded-lg">
                  <Award className="w-5 h-5 text-accessible-green" />
                </div>
                <span className="text-sm text-light-charcoal font-barlow">
                  Total Value (ALPH)
                </span>
              </div>
              <p className="text-2xl font-bold text-light-black dark:text-white font-barlow">
                {bountyOverview.total_value_alph.toLocaleString()}
              </p>
            </div>

            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 hover:shadow-box-image-shadow-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <FileText className="w-5 h-5 text-orange" />
                </div>
                <span className="text-sm text-light-charcoal font-barlow">
                  Total Bounties
                </span>
              </div>
              <p className="text-2xl font-bold text-light-black dark:text-white font-barlow">
                {bountyOverview.list_number}
              </p>
            </div>

            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 hover:shadow-box-image-shadow-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accessible-green/10 rounded-lg">
                  <Users className="w-5 h-5 text-accessible-green" />
                </div>
                <span className="text-sm text-light-charcoal font-barlow">
                  Total Users
                </span>
              </div>
              <p className="text-2xl font-bold text-light-black dark:text-white font-barlow">
                {bountyOverview.user_number}
              </p>
            </div>

            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 hover:shadow-box-image-shadow-hover transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange" />
                </div>
                <span className="text-sm text-light-charcoal font-barlow">
                  Total Sponsors
                </span>
              </div>
              <p className="text-2xl font-bold text-light-black dark:text-white font-barlow">
                {bountyOverview.sponsor_number}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border-grey dark:border-dark-charcoal">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 px-1 py-3 font-barlow font-medium text-sm text-light-black dark:text-white border-b-2 border-orange -mb-px">
              <Users className="w-4 h-4" />
              Sponsor Management
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
            {(["active", "banned"] as const).map((filter) => (
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
          {sponsors.length === 0 ? (
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-12 text-center">
              <Users className="w-12 h-12 text-light-charcoal mx-auto mb-4" />
              <p className="text-light-charcoal font-barlow">
                No {sponsorFilter} sponsors found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sponsors.map((sponsor) => (
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
                          {getStatusBadge(sponsor)}
                          {sponsor.is_verified === 1 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accessible-green/10 text-accessible-green">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
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
                          <span>Joined: {formatDate(sponsor.created_at)}</span>
                          {sponsor.bounty_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {sponsor.bounty_count} bounties
                            </span>
                          )}
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

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-border-grey dark:border-dark-charcoal">
                      {sponsor.is_banned ? (
                        <button
                          onClick={() => handleUnbanSponsor(sponsor.id)}
                          disabled={actionLoading === sponsor.id}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-accessible-green hover:opacity-90 text-white rounded-lg font-barlow font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === sponsor.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowBanModal(sponsor.id)}
                          disabled={actionLoading === sponsor.id}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-orange hover:opacity-90 text-white rounded-lg font-barlow font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                          Ban
                        </button>
                      )}
                      {sponsor.is_verified === 1 ? (
                        <button
                          onClick={() => handleUnverifySponsor(sponsor.id)}
                          disabled={actionLoading === sponsor.id}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-light-charcoal hover:opacity-90 text-white rounded-lg font-barlow font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === sponsor.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Unverify
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifySponsor(sponsor.id)}
                          disabled={actionLoading === sponsor.id}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-accessible-green hover:opacity-90 text-white rounded-lg font-barlow font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === sponsor.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Verify
                        </button>
                      )}
                      <a
                        href={`/bounty/sponsor/${sponsor.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-2.5 border border-border-grey dark:border-dark-charcoal text-light-charcoal hover:bg-smoked-white dark:hover:bg-light-black rounded-lg font-barlow font-medium text-sm transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Profile
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ban Confirmation Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-hero-dark rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-light-black dark:text-white font-barlow">
              Ban Sponsor
            </h3>
            <p className="text-sm text-light-charcoal font-barlow">
              Are you sure you want to ban this sponsor? This will also ban the
              associated user account. They will not be able to access any
              sponsor or user features.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBanModal(null)}
                className="px-4 py-2 border border-border-grey dark:border-dark-charcoal text-light-charcoal hover:bg-smoked-white dark:hover:bg-light-black rounded-lg font-barlow font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBanSponsor(showBanModal)}
                disabled={actionLoading === showBanModal}
                className="px-4 py-2 bg-orange hover:opacity-90 text-white rounded-lg font-barlow font-medium text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {actionLoading === showBanModal ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                Ban Sponsor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
