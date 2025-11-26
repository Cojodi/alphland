import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "@/lib/auth-client";
import Layout from "@/components/Layout";
import { Plus, X, Calendar, DollarSign } from "lucide-react";

interface BountyFormData {
  title: string;
  description: string;
  category: string;
  requirements: string[];
  deliverables: string[];
  skills: string[];
  reward_amount: string;
  reward_currency: string;
  reward_type: "fixed" | "tiered";
  start_date: string;
  end_date: string;
  dapp_name: string;
}

export default function ManualCreateBounty() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [sponsor, setSponsor] = useState<any>(null);
  const [loadingSponsor, setLoadingSponsor] = useState(true);

  const [formData, setFormData] = useState<BountyFormData>({
    title: "",
    description: "",
    category: "Development",
    requirements: [""],
    deliverables: [""],
    skills: [""],
    reward_amount: "",
    reward_currency: "ALPH",
    reward_type: "fixed",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    dapp_name: "",
  });

  const [newItem, setNewItem] = useState({
    requirement: "",
    deliverable: "",
    skill: "",
  });

  useEffect(() => {
    async function fetchSponsorData() {
      if (!session?.user?.id) {
        setLoadingSponsor(false);
        return;
      }

      try {
        const response = await fetch(`/api/sponsors/user/${session.user.id}`);

        if (!response.ok) {
          router.push("/bounty/new/sponsor");
          return;
        }

        const data = await response.json();
        setSponsor(data.sponsor);
      } catch (error) {
        console.error("Error fetching sponsor data:", error);
        router.push("/bounty/new/sponsor");
      } finally {
        setLoadingSponsor(false);
      }
    }

    if (!isPending) {
      fetchSponsorData();
    }
  }, [session, isPending, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayItemChange = (
    field: "requirements" | "deliverables" | "skills",
    index: number,
    value: string,
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData((prev) => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: "requirements" | "deliverables" | "skills") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayItem = (
    field: "requirements" | "deliverables" | "skills",
    index: number,
  ) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, [field]: newArray }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/bounties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sponsor_id: sponsor.id,
          requirements: formData.requirements.filter((r) => r.trim() !== ""),
          deliverables: formData.deliverables.filter((d) => d.trim() !== ""),
          skills: formData.skills.filter((s) => s.trim() !== ""),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create bounty");
      }

      const data = await response.json();
      router.push(`/bounty/${data.bounty.id}`);
    } catch (error) {
      console.error("Error creating bounty:", error);
      alert("Failed to create bounty. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingSponsor || isPending) {
    return (
      <Layout title="Create Bounty - Alphland">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent mx-auto" />
            <div className="text-xl font-semibold mt-4">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!sponsor) {
    return null;
  }

  const categories = [
    "Development",
    "Design",
    "Marketing",
    "Content",
    "Research",
    "Testing",
    "Other",
  ];

  return (
    <Layout title="Create Bounty - Alphland">
      <div className="min-h-screen bg-smoked-white dark:bg-light-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-light-charcoal dark:text-lightgrey hover:text-orange font-barlow mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <h1 className="text-4xl font-bold text-black dark:text-white font-barlow mb-2">
              Create New Bounty
            </h1>
            <p className="text-lg text-light-charcoal dark:text-lightgrey font-barlow">
              Fill in the details to create your bounty listing
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

              {/* Category and DApp Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div>
                  <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                    DApp Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="dapp_name"
                    value={formData.dapp_name}
                    onChange={handleInputChange}
                    placeholder="e.g., AlphDeFi"
                    className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-orange font-barlow">
                  Requirements
                </h2>
                <button
                  type="button"
                  onClick={() => addArrayItem("requirements")}
                  className="bg-orange hover:bg-orange/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-barlow text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) =>
                        handleArrayItemChange(
                          "requirements",
                          index,
                          e.target.value,
                        )
                      }
                      placeholder="Enter a requirement"
                      className="flex-1 px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("requirements", index)}
                        className="p-3 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-orange font-barlow">
                  Deliverables
                </h2>
                <button
                  type="button"
                  onClick={() => addArrayItem("deliverables")}
                  className="bg-orange hover:bg-orange/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-barlow text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {formData.deliverables.map((del, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={del}
                      onChange={(e) =>
                        handleArrayItemChange(
                          "deliverables",
                          index,
                          e.target.value,
                        )
                      }
                      placeholder="Enter a deliverable"
                      className="flex-1 px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                    {formData.deliverables.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("deliverables", index)}
                        className="p-3 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-orange font-barlow">
                  Required Skills
                </h2>
                <button
                  type="button"
                  onClick={() => addArrayItem("skills")}
                  className="bg-orange hover:bg-orange/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-barlow text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) =>
                        handleArrayItemChange("skills", index, e.target.value)
                      }
                      placeholder="e.g., React, TypeScript"
                      className="flex-1 px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                    {formData.skills.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("skills", index)}
                        className="p-3 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Information */}
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 space-y-6">
              <h2 className="text-2xl font-bold text-orange font-barlow">
                Reward Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                    Reward Amount *
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

                <div>
                  <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                    Currency *
                  </label>
                  <select
                    name="reward_currency"
                    value={formData.reward_currency}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                  >
                    <option value="ALPH">ALPH</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                  Reward Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reward_type"
                      value="fixed"
                      checked={formData.reward_type === "fixed"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange focus:ring-orange"
                    />
                    <span className="text-black dark:text-white font-barlow">
                      Fixed
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reward_type"
                      value="tiered"
                      checked={formData.reward_type === "tiered"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange focus:ring-orange"
                    />
                    <span className="text-black dark:text-white font-barlow">
                      Tiered
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 space-y-6">
              <h2 className="text-2xl font-bold text-orange font-barlow">
                Timeline
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                    Start Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                    End Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                      min={formData.start_date}
                      className="w-full pl-10 pr-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-4 border-2 border-orange text-orange hover:bg-orange/5 rounded-lg font-barlow font-semibold text-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 bg-orange hover:bg-orange/90 text-white rounded-lg font-barlow font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Bounty"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
