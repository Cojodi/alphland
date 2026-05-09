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
  Lock,
  Search,
  Bookmark,
  MessageSquare,
  Trophy,
  Calendar,
  Monitor,
  ChevronDown,
  ChevronUp,
  X,
  Mail,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";

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

interface UserStats {
  total_users: number;
  new_today: number;
  new_this_week: number;
  new_this_month: number;
  wau: number;
  mau: number;
  daily_trend: { date: string; count: number }[];
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  is_banned: number;
  createdAt: number;
  username: string | null;
  wallet_address: string | null;
  submission_count: number;
  approved_count: number;
  bookmark_count: number;
  role: string | null;
}

interface SubmissionStats {
  total_submissions: number;
  approved_submissions: number;
  users_with_submissions: number;
  avg_submissions_per_user: number;
  acceptance_rate: number;
  avg_reward: number;
  top_users: {
    user_id: string;
    name: string;
    email: string;
    username: string | null;
    total_submissions: number;
    approved: number;
    success_rate: number;
  }[];
}

interface BountyPopularity {
  most_bookmarked: {
    id: string;
    title: string;
    status: string;
    sponsor_name: string;
    bookmark_count: number;
  }[];
  most_submissions: {
    id: string;
    title: string;
    status: string;
    sponsor_name: string;
    submission_count: number;
  }[];
  most_comments: {
    id: string;
    title: string;
    status: string;
    sponsor_name: string;
    comment_count: number;
  }[];
}

interface UserDetail {
  user: AdminUser & { bio?: string; location?: string };
  sessions: { ipAddress: string; userAgent: string; createdAt: number }[];
  submissions: any[];
  bookmarks: any[];
}

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  type: string;
  status: string;
  resend_id: string | null;
  error: string | null;
  created_at: number;
}

interface EmailLogStats {
  type: string;
  count: number;
  failed: number;
}

type SponsorFilter = "active" | "banned" | "pending";
type AdminTab = "sponsors" | "users" | "emails";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Derive active tab from URL
  const rawTab = router.query.tab as string;
  const tabFromUrl: AdminTab =
    rawTab === "users" ? "users" : rawTab === "emails" ? "emails" : "sponsors";
  const [activeTab, setActiveTab] = useState<AdminTab>(tabFromUrl);

  // Sponsor state
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sponsorFilter, setSponsorFilter] = useState<SponsorFilter>("active");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 1500);
  };
  const [bountyOverview, setBountyOverview] = useState<BountyOverview | null>(
    null,
  );

  // User Management state
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [submissionStats, setSubmissionStats] =
    useState<SubmissionStats | null>(null);
  const [bountyPopularity, setBountyPopularity] =
    useState<BountyPopularity | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "stats",
  );

  // Email logs state
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailStats, setEmailStats] = useState<EmailLogStats[]>([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);
  const [emailLogsTotal, setEmailLogsTotal] = useState(0);
  const [emailLogsPage, setEmailLogsPage] = useState(1);
  const [emailTypeFilter, setEmailTypeFilter] = useState("");

  // Sync tab state when URL changes (browser back/forward)
  useEffect(() => {
    if (router.isReady) {
      const raw = router.query.tab as string;
      const t: AdminTab =
        raw === "users" ? "users" : raw === "emails" ? "emails" : "sponsors";
      setActiveTab(t);
    }
  }, [router.isReady, router.query.tab]);

  // Check if already authenticated on mount
  useEffect(() => {
    const auth = sessionStorage.getItem("admin_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  // Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_authenticated", "true");
        setPasswordError(false);
      } else {
        setPasswordError(true);
      }
    } catch (error) {
      console.error("Auth error:", error);
      setPasswordError(true);
    }
  };

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
      let url: string;
      if (sponsorFilter === "pending") {
        url = `/api/sponsors?pending=true`;
      } else {
        const isBanned = sponsorFilter === "banned" ? "true" : "false";
        url = `/api/sponsors?is_banned=${isBanned}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setSponsors(data.sponsors || []);
    } catch (error) {
      console.error("Failed to fetch sponsors:", error);
    }
  }, [sponsorFilter]);

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/user-stats");
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async (search = "") => {
    setUsersLoading(true);
    try {
      const url = search
        ? `/api/admin/users?search=${encodeURIComponent(search)}`
        : "/api/admin/users";
      const response = await fetch(url);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Fetch submission stats
  const fetchSubmissionStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/submission-stats");
      const data = await response.json();
      setSubmissionStats(data);
    } catch (error) {
      console.error("Failed to fetch submission stats:", error);
    }
  }, []);

  // Fetch bounty popularity
  const fetchBountyPopularity = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/bounty-popularity");
      const data = await response.json();
      setBountyPopularity(data);
    } catch (error) {
      console.error("Failed to fetch bounty popularity:", error);
    }
  }, []);

  // Fetch email logs
  const fetchEmailLogs = useCallback(async (page = 1, type = "") => {
    setEmailLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (type) params.set("type", type);
      const response = await fetch(`/api/admin/email-logs?${params}`);
      const data = await response.json();
      setEmailLogs(data.logs || []);
      setEmailLogsTotal(data.total || 0);
      setEmailStats(data.stats || []);
      setEmailLogsPage(page);
    } catch (error) {
      console.error("Failed to fetch email logs:", error);
    } finally {
      setEmailLogsLoading(false);
    }
  }, []);

  // Fetch user details
  const fetchUserDetail = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      setSelectedUser(data);
      setShowUserModal(true);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    Promise.all([fetchBountyOverview(), fetchSponsors()]).finally(() =>
      setLoading(false),
    );
  }, [fetchBountyOverview, fetchSponsors, isAuthenticated]);

  // Load email logs when emails tab is active
  useEffect(() => {
    if (!isAuthenticated || activeTab !== "emails") return;
    fetchEmailLogs(1, emailTypeFilter);
  }, [isAuthenticated, activeTab, fetchEmailLogs, emailTypeFilter]);

  // Load user management data when tab switches
  useEffect(() => {
    if (!isAuthenticated || activeTab !== "users") return;
    fetchUserStats();
    fetchUsers();
    fetchSubmissionStats();
    fetchBountyPopularity();
  }, [
    isAuthenticated,
    activeTab,
    fetchUserStats,
    fetchUsers,
    fetchSubmissionStats,
    fetchBountyPopularity,
  ]);

  // Ban sponsor
  const handleBanSponsor = async (sponsorId: string) => {
    setActionLoading(sponsorId);
    try {
      const response = await fetch(`/api/admin/sponsors/${sponsorId}/ban`, {
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
      const response = await fetch(`/api/admin/sponsors/${sponsorId}/unban`, {
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
      const response = await fetch(`/api/admin/sponsors/${sponsorId}/verify`, {
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
      const response = await fetch(
        `/api/admin/sponsors/${sponsorId}/unverify`,
        { method: "PUT" },
      );
      if (response.ok) {
        await fetchSponsors();
      }
    } catch (error) {
      console.error("Failed to unverify sponsor:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Ban user
  const handleBanUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PUT",
      });
      if (response.ok) {
        await fetchUsers(userSearch);
      }
    } catch (error) {
      console.error("Failed to ban user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Unban user
  const handleUnbanUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: "PUT",
      });
      if (response.ok) {
        await fetchUsers(userSearch);
      }
    } catch (error) {
      console.error("Failed to unban user:", error);
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

  const formatDateMs = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <Layout
        title="Admin Dashboard"
        description="Admin dashboard for Alphland platform management"
      >
        <div className="min-h-screen flex items-center justify-center bg-smoked-white dark:bg-light-black">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange mx-auto"></div>
        </div>
      </Layout>
    );
  }

  // Show password screen if not authenticated
  if (!isAuthenticated) {
    return (
      <Layout
        title="Admin Dashboard"
        description="Admin dashboard for Alphland platform management"
      >
        <div className="min-h-screen flex items-center justify-center bg-smoked-white dark:bg-light-black px-4">
          <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-orange" />
              </div>
              <h1 className="text-2xl font-bold text-light-black dark:text-white font-barlow">
                Admin Access
              </h1>
              <p className="text-sm text-light-charcoal mt-2">
                Enter password to access the admin dashboard
              </p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Enter password"
                  className={`w-full px-4 py-3 bg-smoked-white dark:bg-light-black border rounded-lg text-light-black dark:text-white placeholder-light-charcoal focus:outline-none focus:ring-2 focus:ring-orange/50 ${
                    passwordError
                      ? "border-red-500"
                      : "border-border-grey dark:border-dark-charcoal"
                  }`}
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-2">
                    Incorrect password. Please try again.
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-orange hover:bg-orange/90 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Access Dashboard
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout
        title="Admin Dashboard"
        description="Admin dashboard for Alphland platform management"
      >
        <div className="min-h-screen flex items-center justify-center bg-smoked-white dark:bg-light-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange mx-auto"></div>
            <p className="mt-4 text-light-charcoal font-barlow">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Admin Dashboard"
      description="Admin dashboard for Alphland platform management"
    >
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
                  Manage sponsors, users, and platform analytics.
                </p>
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
              <button
                onClick={() => {
                  setActiveTab("sponsors");
                  router.push("/admin/sponsors", undefined, { shallow: true });
                }}
                className={`flex items-center gap-2 px-1 py-3 font-barlow font-medium text-sm transition-colors ${
                  activeTab === "sponsors"
                    ? "text-light-black dark:text-white border-b-2 border-orange -mb-px"
                    : "text-light-charcoal hover:text-light-black dark:hover:text-white"
                }`}
              >
                <Award className="w-4 h-4" />
                Sponsor Management
              </button>
              <button
                onClick={() => {
                  setActiveTab("users");
                  router.push("/admin/users", undefined, { shallow: true });
                }}
                className={`flex items-center gap-2 px-1 py-3 font-barlow font-medium text-sm transition-colors ${
                  activeTab === "users"
                    ? "text-light-black dark:text-white border-b-2 border-orange -mb-px"
                    : "text-light-charcoal hover:text-light-black dark:hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                User Management
              </button>
              <button
                onClick={() => {
                  setActiveTab("emails");
                  router.push("/admin/emails", undefined, { shallow: true });
                }}
                className={`flex items-center gap-2 px-1 py-3 font-barlow font-medium text-sm transition-colors ${
                  activeTab === "emails"
                    ? "text-light-black dark:text-white border-b-2 border-orange -mb-px"
                    : "text-light-charcoal hover:text-light-black dark:hover:text-white"
                }`}
              >
                <Mail className="w-4 h-4" />
                Email Logs
              </button>
              <a
                href="/admin/index.html#/collections/dapps"
                className="flex items-center gap-2 px-1 py-3 font-barlow font-medium text-sm text-light-charcoal hover:text-light-black dark:hover:text-white transition-colors"
              >
                <AppWindow className="w-4 h-4" />
                Dapp Management
              </a>
            </div>
          </div>

          {/* Sponsor Management Tab */}
          {activeTab === "sponsors" && (
            <div className="space-y-6">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {(["pending", "active", "banned"] as const).map((filter) => (
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
                              <span>
                                Joined: {formatDate(sponsor.created_at)}
                              </span>
                              {sponsor.bounty_count !== undefined && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {sponsor.bounty_count} bounties
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => copyUserId(sponsor.user_id)}
                              className="mt-1.5 flex items-center gap-1.5 text-xs text-light-charcoal font-barlow font-mono hover:text-light-black dark:hover:text-white transition-colors group"
                              title="Click to copy user ID"
                            >
                              <span className="opacity-60 font-sans">
                                User ID:
                              </span>
                              <span className="bg-smoked-white dark:bg-light-black px-1.5 py-0.5 rounded border border-border-grey dark:border-dark-charcoal group-hover:border-orange/40 transition-colors">
                                {sponsor.user_id}
                              </span>
                              <span className="opacity-0 group-hover:opacity-60 transition-opacity font-sans font-normal">
                                {copiedId === sponsor.user_id
                                  ? "✓ copied"
                                  : "copy"}
                              </span>
                            </button>
                            {(sponsor as any).user_email && (
                              <p className="text-xs text-light-charcoal font-barlow mt-1 flex items-center gap-1">
                                <span className="opacity-60">Account:</span>
                                {(sponsor as any).user_image && (
                                  <img
                                    src={(sponsor as any).user_image}
                                    alt=""
                                    className="w-4 h-4 rounded-full inline-block"
                                  />
                                )}
                                <span>{(sponsor as any).user_name || ""}</span>
                                <span className="opacity-60">
                                  {(sponsor as any).user_email}
                                </span>
                              </p>
                            )}
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
          )}

          {/* User Management Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* User Stats Overview */}
              <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal overflow-hidden">
                <button
                  onClick={() => toggleSection("stats")}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-orange" />
                    <h2 className="text-lg font-semibold text-light-black dark:text-white font-barlow">
                      User Statistics
                    </h2>
                  </div>
                  {expandedSection === "stats" ? (
                    <ChevronUp className="w-5 h-5 text-light-charcoal" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-light-charcoal" />
                  )}
                </button>
                {expandedSection === "stats" && userStats && (
                  <div className="px-6 pb-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">
                          Total Users
                        </p>
                        <p className="text-2xl font-bold text-light-black dark:text-white">
                          {userStats.total_users}
                        </p>
                      </div>
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">
                          New Today
                        </p>
                        <p className="text-2xl font-bold text-accessible-green">
                          +{userStats.new_today}
                        </p>
                      </div>
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">
                          This Week
                        </p>
                        <p className="text-2xl font-bold text-light-black dark:text-white">
                          +{userStats.new_this_week}
                        </p>
                      </div>
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">
                          This Month
                        </p>
                        <p className="text-2xl font-bold text-light-black dark:text-white">
                          +{userStats.new_this_month}
                        </p>
                      </div>
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">WAU</p>
                        <p className="text-2xl font-bold text-orange">
                          {userStats.wau}
                        </p>
                      </div>
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">MAU</p>
                        <p className="text-2xl font-bold text-orange">
                          {userStats.mau}
                        </p>
                      </div>
                    </div>

                    {/* Simple trend visualization */}
                    {/* {userStats.daily_trend.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-light-black dark:text-white mb-3">
                          New Users (Last 14 Days)
                        </p>
                        <div className="flex items-end gap-1 h-20">
                          {userStats.daily_trend.map((day, i) => {
                            const maxCount = Math.max(
                              ...userStats.daily_trend.map((d) => d.count),
                            );
                            const height =
                              maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                            return (
                              <div
                                key={i}
                                className="flex-1 bg-orange/20 hover:bg-orange/40 transition-colors rounded-t relative group"
                                style={{ height: `${Math.max(height, 5)}%` }}
                              >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-light-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {day.date}: {day.count}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )} */}
                  </div>
                )}
              </div>

              {/* Submission Analysis */}
              <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal overflow-hidden">
                <button
                  onClick={() => toggleSection("submissions")}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange" />
                    <h2 className="text-lg font-semibold text-light-black dark:text-white font-barlow">
                      Submission Analysis
                    </h2>
                  </div>
                  {expandedSection === "submissions" ? (
                    <ChevronUp className="w-5 h-5 text-light-charcoal" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-light-charcoal" />
                  )}
                </button>
                {expandedSection === "submissions" && submissionStats && (
                  <div className="px-6 pb-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">
                          Total Submissions
                        </p>
                        <p className="text-2xl font-bold text-light-black dark:text-white">
                          {submissionStats.total_submissions}
                        </p>
                      </div>
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">
                          Approved
                        </p>
                        <p className="text-2xl font-bold text-accessible-green">
                          {submissionStats.approved_submissions}
                        </p>
                      </div>
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">
                          Acceptance Rate
                        </p>
                        <p className="text-2xl font-bold text-orange">
                          {submissionStats.acceptance_rate}%
                        </p>
                      </div>
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">
                          Avg per User
                        </p>
                        <p className="text-2xl font-bold text-light-black dark:text-white">
                          {submissionStats.avg_submissions_per_user}
                        </p>
                      </div>
                      <div className="bg-smoked-white dark:bg-light-black rounded-lg p-4">
                        <p className="text-xs text-light-charcoal mb-1">
                          Avg Reward
                        </p>
                        <p className="text-2xl font-bold text-light-black dark:text-white">
                          {submissionStats.avg_reward > 0
                            ? `$${Math.round(submissionStats.avg_reward)}`
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Top Success Rate Users */}
                    {submissionStats.top_users?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-light-black dark:text-white mb-3 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-orange" />
                          Top Success Rate Users (min 2 submissions)
                        </p>
                        <div className="space-y-2">
                          {submissionStats.top_users
                            ?.slice(0, 5)
                            .map((user, i) => (
                              <div
                                key={user.user_id}
                                className="flex items-center justify-between bg-smoked-white dark:bg-light-black rounded-lg p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-orange w-6">
                                    #{i + 1}
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium text-light-black dark:text-white">
                                      {user.username || user.name || user.email}
                                    </p>
                                    <p className="text-xs text-light-charcoal">
                                      {user.approved}/{user.total_submissions}{" "}
                                      approved
                                    </p>
                                  </div>
                                </div>
                                <span className="text-lg font-bold text-accessible-green">
                                  {user.success_rate}%
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bounty Popularity */}
              <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal overflow-hidden">
                <button
                  onClick={() => toggleSection("popularity")}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-orange" />
                    <h2 className="text-lg font-semibold text-light-black dark:text-white font-barlow">
                      Bounty Popularity
                    </h2>
                  </div>
                  {expandedSection === "popularity" ? (
                    <ChevronUp className="w-5 h-5 text-light-charcoal" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-light-charcoal" />
                  )}
                </button>
                {expandedSection === "popularity" && bountyPopularity && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Most Bookmarked */}
                      <div>
                        <p className="text-sm font-medium text-light-black dark:text-white mb-3 flex items-center gap-2">
                          <Bookmark className="w-4 h-4 text-orange" />
                          Most Bookmarked
                        </p>
                        <div className="space-y-2">
                          {bountyPopularity.most_bookmarked
                            ?.slice(0, 5)
                            .map((b) => (
                              <a
                                key={b.id}
                                href={`/bounty/${b.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-smoked-white dark:bg-light-black rounded-lg p-3 hover:bg-border-grey dark:hover:bg-dark-charcoal transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-light-black dark:text-white truncate">
                                    {b.title}
                                  </p>
                                  <p className="text-xs text-light-charcoal">
                                    {b.sponsor_name}
                                  </p>
                                </div>
                                <span className="text-sm font-bold text-orange ml-2">
                                  {b.bookmark_count}
                                </span>
                              </a>
                            ))}
                        </div>
                      </div>

                      {/* Most Submissions */}
                      <div>
                        <p className="text-sm font-medium text-light-black dark:text-white mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-accessible-green" />
                          Most Submissions
                        </p>
                        <div className="space-y-2">
                          {bountyPopularity.most_submissions
                            ?.slice(0, 5)
                            .map((b) => (
                              <a
                                key={b.id}
                                href={`/bounty/${b.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-smoked-white dark:bg-light-black rounded-lg p-3 hover:bg-border-grey dark:hover:bg-dark-charcoal transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-light-black dark:text-white truncate">
                                    {b.title}
                                  </p>
                                  <p className="text-xs text-light-charcoal">
                                    {b.sponsor_name}
                                  </p>
                                </div>
                                <span className="text-sm font-bold text-accessible-green ml-2">
                                  {b.submission_count}
                                </span>
                              </a>
                            ))}
                        </div>
                      </div>

                      {/* Most Comments */}
                      <div>
                        <p className="text-sm font-medium text-light-black dark:text-white mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          Most Comments
                        </p>
                        <div className="space-y-2">
                          {bountyPopularity.most_comments
                            ?.slice(0, 5)
                            .map((b) => (
                              <a
                                key={b.id}
                                href={`/bounty/${b.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-smoked-white dark:bg-light-black rounded-lg p-3 hover:bg-border-grey dark:hover:bg-dark-charcoal transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-light-black dark:text-white truncate">
                                    {b.title}
                                  </p>
                                  <p className="text-xs text-light-charcoal">
                                    {b.sponsor_name}
                                  </p>
                                </div>
                                <span className="text-sm font-bold text-blue-500 ml-2">
                                  {b.comment_count}
                                </span>
                              </a>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User List */}
              <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal overflow-hidden">
                <div className="p-6 border-b border-border-grey dark:border-dark-charcoal">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-lg font-semibold text-light-black dark:text-white font-barlow flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange" />
                      User List
                    </h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-charcoal" />
                      <input
                        type="text"
                        placeholder="Search email, name, username..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && fetchUsers(userSearch)
                        }
                        className="pl-10 pr-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-sm text-light-black dark:text-white placeholder-light-charcoal focus:outline-none focus:ring-2 focus:ring-orange/50 w-64"
                      />
                    </div>
                  </div>
                </div>

                {usersLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent mx-auto"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-light-charcoal mx-auto mb-4" />
                    <p className="text-light-charcoal">No users found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-grey dark:divide-dark-charcoal">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 hover:bg-smoked-white dark:hover:bg-light-black transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || "User"}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center">
                                <span className="text-orange font-bold">
                                  {(user.name ||
                                    user.email)?.[0]?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-light-black dark:text-white truncate">
                                  {user.name || "No name"}
                                </p>
                                {user.role === "god" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-400/30">
                                    GOD MODE
                                  </span>
                                )}
                                {user.is_banned === 1 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange/10 text-orange">
                                    <Ban className="w-3 h-3" />
                                    Banned
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-light-charcoal truncate">
                                {user.email}
                                {user.username && ` • @${user.username}`}
                              </p>
                              {user.createdAt && (
                                <p className="text-xs text-light-charcoal opacity-60">
                                  First login: {formatDateMs(user.createdAt)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-light-charcoal">
                            <div className="text-center hidden sm:block">
                              <p className="font-bold text-light-black dark:text-white">
                                {user.submission_count}
                              </p>
                              <p>Submissions</p>
                            </div>
                            <div className="text-center hidden sm:block">
                              <p className="font-bold text-accessible-green">
                                {user.approved_count}
                              </p>
                              <p>Approved</p>
                            </div>
                            <div className="text-center hidden sm:block">
                              <p className="font-bold text-orange">
                                {user.bookmark_count}
                              </p>
                              <p>Bookmarks</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchUserDetail(user.id)}
                              className="px-3 py-1.5 text-xs font-medium text-light-charcoal hover:text-light-black dark:hover:text-white border border-border-grey dark:border-dark-charcoal rounded-lg hover:bg-smoked-white dark:hover:bg-light-black transition-colors"
                            >
                              Details
                            </button>
                            {user.is_banned === 1 ? (
                              <button
                                onClick={() => handleUnbanUser(user.id)}
                                disabled={actionLoading === user.id}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-accessible-green hover:opacity-90 rounded-lg disabled:opacity-50 transition-colors"
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanUser(user.id)}
                                disabled={actionLoading === user.id}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-orange hover:opacity-90 rounded-lg disabled:opacity-50 transition-colors"
                              >
                                Ban
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Email Logs Tab */}
          {activeTab === "emails" && (
            <div className="space-y-6">
              {/* Email Stats */}
              {emailStats.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {emailStats.map((stat) => (
                    <div
                      key={stat.type}
                      className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-5"
                    >
                      <p className="text-xs text-light-charcoal font-barlow capitalize mb-1">
                        {stat.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-2xl font-bold text-light-black dark:text-white font-barlow">
                        {stat.count}
                      </p>
                      {stat.failed > 0 && (
                        <p className="text-xs text-orange mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {stat.failed} failed
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-5">
                    <p className="text-xs text-light-charcoal font-barlow mb-1">
                      Total Sent
                    </p>
                    <p className="text-2xl font-bold text-orange font-barlow">
                      {emailStats.reduce((sum, s) => sum + s.count, 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Filter */}
              <div className="flex flex-wrap gap-2">
                {["", "otp", "email_verification", "password_reset"].map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => setEmailTypeFilter(t)}
                      className={`px-4 py-2 rounded-lg font-barlow font-medium text-sm transition-all ${
                        emailTypeFilter === t
                          ? "bg-light-black dark:bg-white text-white dark:text-light-black"
                          : "bg-white dark:bg-hero-dark text-light-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black border border-border-grey dark:border-dark-charcoal"
                      }`}
                    >
                      {t === "" ? "All" : t.replace(/_/g, " ")}
                    </button>
                  ),
                )}
              </div>

              {/* Log Table */}
              <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal overflow-hidden">
                <div className="p-5 border-b border-border-grey dark:border-dark-charcoal flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-light-black dark:text-white font-barlow flex items-center gap-2">
                    <Mail className="w-5 h-5 text-orange" />
                    Email History
                    <span className="text-sm font-normal text-light-charcoal">
                      ({emailLogsTotal} total)
                    </span>
                  </h2>
                </div>

                {emailLogsLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent mx-auto" />
                  </div>
                ) : emailLogs.length === 0 ? (
                  <div className="p-12 text-center">
                    <Mail className="w-12 h-12 text-light-charcoal mx-auto mb-4" />
                    <p className="text-light-charcoal font-barlow">
                      No emails recorded yet
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-border-grey dark:divide-dark-charcoal">
                      {emailLogs.map((log) => (
                        <div
                          key={log.id}
                          className="px-5 py-3 flex items-center gap-4 hover:bg-smoked-white dark:hover:bg-light-black transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  log.status === "sent"
                                    ? "bg-accessible-green/10 text-accessible-green"
                                    : "bg-orange/10 text-orange"
                                }`}
                              >
                                {log.status === "sent" ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                )}
                                {log.status}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-smoked-white dark:bg-light-black text-light-charcoal capitalize">
                                {log.type.replace(/_/g, " ")}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-light-black dark:text-white mt-1 truncate">
                              {log.to_email}
                            </p>
                            <p className="text-xs text-light-charcoal truncate">
                              {log.subject}
                            </p>
                            {log.error && (
                              <p className="text-xs text-orange mt-0.5 truncate">
                                Error: {log.error}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-light-charcoal">
                              {formatDate(log.created_at)}
                            </p>
                            {log.resend_id && (
                              <p className="text-xs text-light-charcoal opacity-50 mt-0.5 font-mono">
                                {log.resend_id.slice(0, 12)}…
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {emailLogsTotal > 50 && (
                      <div className="p-4 border-t border-border-grey dark:border-dark-charcoal flex items-center justify-between">
                        <button
                          disabled={emailLogsPage <= 1}
                          onClick={() =>
                            fetchEmailLogs(emailLogsPage - 1, emailTypeFilter)
                          }
                          className="px-4 py-2 text-sm font-barlow text-light-charcoal hover:text-light-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-light-charcoal font-barlow">
                          Page {emailLogsPage} of{" "}
                          {Math.ceil(emailLogsTotal / 50)}
                        </span>
                        <button
                          disabled={
                            emailLogsPage >= Math.ceil(emailLogsTotal / 50)
                          }
                          onClick={() =>
                            fetchEmailLogs(emailLogsPage + 1, emailTypeFilter)
                          }
                          className="px-4 py-2 text-sm font-barlow text-light-charcoal hover:text-light-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ban Sponsor Modal */}
        {showBanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-hero-dark rounded-xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-light-black dark:text-white font-barlow">
                Ban Sponsor
              </h3>
              <p className="text-sm text-light-charcoal font-barlow">
                Are you sure you want to ban this sponsor? This will also ban
                the associated user account.
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

        {/* User Detail Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-hero-dark rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-hero-dark border-b border-border-grey dark:border-dark-charcoal p-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-light-black dark:text-white font-barlow">
                  User Details
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-smoked-white dark:hover:bg-light-black rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-light-charcoal" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="flex items-start gap-4">
                  {selectedUser.user.image ? (
                    <Image
                      src={selectedUser.user.image}
                      alt={selectedUser.user.name || "User"}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center">
                      <span className="text-2xl text-orange font-bold">
                        {(selectedUser.user.name ||
                          selectedUser.user.email)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-light-black dark:text-white">
                      {selectedUser.user.name || "No name"}
                    </h4>
                    <p className="text-sm text-light-charcoal">
                      {selectedUser.user.email}
                    </p>
                    {selectedUser.user.username && (
                      <p className="text-sm text-orange">
                        @{selectedUser.user.username}
                      </p>
                    )}
                    <p className="text-xs text-light-charcoal mt-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Joined {formatDateMs(selectedUser.user.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Recent Sessions */}
                {selectedUser.sessions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-light-black dark:text-white mb-3 flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Recent Sessions
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedUser.sessions.map((session, i) => (
                        <div
                          key={i}
                          className="bg-smoked-white dark:bg-light-black rounded-lg p-3 text-xs"
                        >
                          <div className="flex justify-between">
                            <span className="text-light-charcoal">
                              IP: {session.ipAddress || "Unknown"}
                            </span>
                            <span className="text-light-charcoal">
                              {formatDateMs(session.createdAt)}
                            </span>
                          </div>
                          <p className="text-light-charcoal mt-1 truncate">
                            {session.userAgent || "Unknown device"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Submissions */}
                {selectedUser.submissions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-light-black dark:text-white mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Recent Submissions ({selectedUser.submissions.length})
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedUser.submissions.slice(0, 5).map((sub: any) => (
                        <div
                          key={sub.id}
                          className="bg-smoked-white dark:bg-light-black rounded-lg p-3 text-xs"
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-light-black dark:text-white">
                              {sub.bounty_title}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                sub.status === "approved"
                                  ? "bg-accessible-green/10 text-accessible-green"
                                  : sub.status === "rejected"
                                    ? "bg-orange/10 text-orange"
                                    : "bg-light-charcoal/10 text-light-charcoal"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bookmarks */}
                {selectedUser.bookmarks.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-light-black dark:text-white mb-3 flex items-center gap-2">
                      <Bookmark className="w-4 h-4" />
                      Bookmarks ({selectedUser.bookmarks.length})
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.bookmarks.slice(0, 10).map((bm: any) => (
                        <a
                          key={bm.id}
                          href={`/bounty/${bm.bounty_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-smoked-white dark:bg-light-black rounded-full text-xs text-light-black dark:text-white hover:bg-orange/10 transition-colors"
                        >
                          {bm.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
