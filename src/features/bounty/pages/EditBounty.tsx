import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "@/lib/auth-client";
import Layout from "@/components/Layout";
import {
  Plus,
  X,
  Calendar,
  DollarSign,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";

interface BountyFormData {
  title: string;
  description: string;
  category: string;
  reward_amount: string;
  reward_currency: string;
  reward_usd_value: string;
  status: string;
  start_date: string;
  end_date: string;
}

const BOUNTY_STATUSES = [
  { value: "open", label: "Open", description: "Accepting submissions" },
  {
    value: "closed",
    label: "Closed",
    description: "No longer accepting submissions",
  },
  { value: "completed", label: "Completed", description: "Bounty fulfilled" },
];

export default function EditBounty() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sponsor, setSponsor] = useState<any>(null);
  const [bounty, setBounty] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState<BountyFormData>({
    title: "",
    description: "",
    category: "Content",
    reward_amount: "",
    reward_currency: "USD",
    reward_usd_value: "",
    status: "open",
    start_date: "",
    end_date: "",
  });

  // Fetch bounty and sponsor data
  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.id || !id) {
        setFetching(false);
        return;
      }

      try {
        // Fetch sponsor
        const sponsorResponse = await fetch(
          `/api/sponsors/user/${session.user.id}`,
        );
        if (!sponsorResponse.ok) {
          router.push("/bounty/sponsor/dashboard");
          return;
        }
        const sponsorData = await sponsorResponse.json();
        setSponsor(sponsorData.sponsor);

        // Fetch bounty
        const bountyResponse = await fetch(`/api/bounties/${id}`);
        if (!bountyResponse.ok) {
          router.push("/bounty/sponsor/dashboard");
          return;
        }
        const bountyData = await bountyResponse.json();
        const b = bountyData.bounty;

        // Verify this sponsor owns the bounty
        if (b.sponsor_id !== sponsorData.sponsor.id) {
          router.push("/bounty/sponsor/dashboard");
          return;
        }

        // Completed bounties cannot be edited
        if (b.status === "completed") {
          router.push("/bounty/sponsor/dashboard");
          return;
        }

        setBounty(b);

        // Parse dates — handle both Unix timestamp (seconds) and ISO strings
        const parseDate = (val: string | number | null): string => {
          if (!val) return "";
          const ts = Number(val);
          const d =
            !isNaN(ts) && ts > 1000000 && ts < 10000000000
              ? new Date(ts * 1000)
              : new Date(val);
          return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
        };
        const startDate = parseDate(b.start_date);
        const endDate = parseDate(b.end_date);

        setFormData({
          title: b.title || "",
          description: b.description || "",
          category: b.category || "Content",
          reward_amount:
            b.reward?.amount?.toString() || b.reward_amount?.toString() || "",
          reward_currency: b.reward?.token || b.reward_currency || "USD",
          reward_usd_value:
            b.reward?.usd_equivalent?.toString() ||
            b.reward_usd_value?.toString() ||
            "",
          status: b.status || "open",
          start_date: startDate,
          end_date: endDate,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push("/bounty/sponsor/dashboard");
      } finally {
        setFetching(false);
      }
    }

    if (!isPending && id) {
      fetchData();
    }
  }, [session, isPending, id, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/bounties/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          reward_amount: parseFloat(formData.reward_amount),
          reward_currency: formData.reward_currency,
          reward_usd_value: formData.reward_usd_value
            ? parseFloat(formData.reward_usd_value)
            : 0,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bounty");
      }

      router.push("/bounty/sponsor/dashboard");
    } catch (error) {
      console.error("Error updating bounty:", error);
      alert("Failed to update bounty. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/bounties/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete bounty");
      }

      router.push("/bounty/sponsor/dashboard");
    } catch (error) {
      console.error("Error deleting bounty:", error);
      alert("Failed to delete bounty. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCloseBounty = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/bounties/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "closed",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to close bounty");
      }

      setFormData((prev) => ({ ...prev, status: "closed" }));
      alert("Bounty closed successfully");
    } catch (error) {
      console.error("Error closing bounty:", error);
      alert("Failed to close bounty. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching || isPending) {
    return (
      <Layout title="Edit Bounty - Alphland">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent mx-auto" />
            <div className="text-xl font-semibold mt-4">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!sponsor || !bounty) {
    return null;
  }

  const categories = ["Content", "Design", "Development", "Other"];

  return (
    <Layout title="Edit Bounty - Alphland">
      <div className="min-h-screen bg-smoked-white dark:bg-light-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/bounty/sponsor/dashboard")}
              className="text-light-charcoal dark:text-lightgrey hover:text-orange font-barlow mb-4 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-black dark:text-white font-barlow mb-2">
              Edit Bounty
            </h1>
            <p className="text-lg text-light-charcoal dark:text-lightgrey font-barlow">
              Update your bounty details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 space-y-6">
              <h2 className="text-2xl font-bold text-orange font-barlow">
                Basic Information
              </h2>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                  Bounty Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Build a DeFi Dashboard for Alephium"
                  className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Describe your bounty in detail..."
                  className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Reward Information */}
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 space-y-6">
              <h2 className="text-2xl font-bold text-orange font-barlow">
                Reward Information
              </h2>

              {formData.reward_currency !== "ALPH" && (
                <div className="bg-orange/5 border border-orange/20 rounded-lg p-4">
                  <p className="text-sm text-light-charcoal dark:text-lightgrey font-barlow">
                    <span className="font-semibold text-orange">Note:</span>{" "}
                    Rewards will be paid in ALPH, converted from USD at the
                    current exchange rate.
                  </p>
                </div>
              )}

              {formData.reward_currency === "ALPH" ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                      Reward Amount (ALPH) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-light-charcoal dark:text-lightgrey">
                        ALPH
                      </span>
                      <input
                        type="number"
                        name="reward_amount"
                        value={formData.reward_amount}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="e.g., 100"
                        className="w-full pl-14 pr-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                      USD Reference (Optional)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                      <input
                        type="number"
                        name="reward_usd_value"
                        value={formData.reward_usd_value}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                      />
                    </div>
                    <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1 font-barlow">
                      Approximate USD equivalent for reference (used for stats
                      tracking)
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                    Reward Amount (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                    <input
                      type="number"
                      name="reward_amount"
                      value={formData.reward_amount}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status Management */}
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 space-y-6">
              <h2 className="text-2xl font-bold text-orange font-barlow">
                Bounty Status
              </h2>

              <div>
                <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-4">
                  Current Status
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {BOUNTY_STATUSES.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          status: status.value,
                        }))
                      }
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.status === status.value
                          ? "border-orange bg-orange/5"
                          : "border-border-grey dark:border-dark-charcoal hover:border-orange/50"
                      }`}
                    >
                      <div className="font-semibold text-black dark:text-white font-barlow mb-1">
                        {status.label}
                      </div>
                      <div className="text-xs text-light-charcoal dark:text-lightgrey font-barlow">
                        {status.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/bounty/sponsor/dashboard")}
                className="flex-1 px-6 py-4 border-2 border-orange text-orange hover:bg-orange/5 rounded-lg font-barlow font-semibold text-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 bg-orange hover:bg-orange/90 text-white rounded-lg font-barlow font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-black dark:text-white font-barlow">
                Delete Bounty
              </h3>
              <p className="text-sm text-light-charcoal dark:text-lightgrey font-barlow">
                This action cannot be undone
              </p>
            </div>
          </div>

          <p className="text-light-charcoal dark:text-lightgrey font-barlow mb-6">
            Are you sure you want to delete &quot;{bounty?.title}&quot;? This
            will remove the bounty from all listings and cannot be recovered.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-6 py-3 border-2 border-border-grey dark:border-dark-charcoal text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black rounded-lg font-barlow font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-barlow font-semibold transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Bounty"}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
