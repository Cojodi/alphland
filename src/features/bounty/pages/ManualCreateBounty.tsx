import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "@/lib/auth-client";
import Layout from "@/components/Layout";
import { Plus, X, Calendar, DollarSign } from "lucide-react";

interface BountyFormData {
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  requirements: string[];
  deliverables: string[];
  skills: string[];
  reward_amount: string;
  reward_currency: string;
  reward_usd_value: string;
  reward_type: "fixed" | "tiered";
  tier_count: number;
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
  const [dapps, setDapps] = useState<{ slug: string; name: string }[]>([]);

  const [formData, setFormData] = useState<BountyFormData>({
    title: "",
    description: "",
    category: "Content",
    difficulty_level: "intermediate",
    requirements: [""],
    deliverables: [""],
    skills: [""],
    reward_amount: "",
    reward_currency: "USD",
    reward_usd_value: "",
    reward_type: "fixed",
    tier_count: 5,
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

  useEffect(() => {
    fetch("/api/dapps")
      .then((r) => r.json())
      .then((data) => setDapps(data.dapps || []))
      .catch(() => {});
  }, []);

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
          user_id: session?.user?.id,
          reward_usd_value: formData.reward_usd_value
            ? parseFloat(formData.reward_usd_value)
            : 0,
          requirements: formData.requirements.filter((r) => r.trim() !== ""),
          deliverables: formData.deliverables.filter((d) => d.trim() !== ""),
          skills: formData.skills.filter((s) => s.trim() !== ""),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create bounty");
      }

      const data = await response.json();
      // Redirect to sponsor dashboard after successful creation
      router.push("/bounty/sponsor/dashboard");
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

  const categories = ["Content", "Design", "Development", "Other"];
  const difficultyLevels = [
    {
      value: "beginner",
      label: "Beginner",
      description: "Suitable for newcomers",
    },
    {
      value: "intermediate",
      label: "Intermediate",
      description: "Requires some experience",
    },
    {
      value: "advanced",
      label: "Advanced",
      description: "For experienced developers",
    },
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

              {/* Category, Difficulty Level and DApp Name */}
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
                    Difficulty Level *
                  </label>
                  <select
                    name="difficulty_level"
                    value={formData.difficulty_level}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                  >
                    {difficultyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DApp Name */}
              <div>
                <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                  DApp (Optional)
                </label>
                <select
                  name="dapp_name"
                  value={formData.dapp_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange"
                >
                  <option value="">— Not associated with a dApp —</option>
                  {dapps.map((dapp) => (
                    <option key={dapp.slug} value={dapp.name}>
                      {dapp.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-light-charcoal dark:text-lightgrey mt-2 font-barlow">
                  Select the dApp this bounty is for. The bounty will appear on
                  that dApp&apos;s page.
                </p>
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

              {/* Payment Notice — only for USD-denominated bounties */}
              {formData.reward_currency !== "ALPH" && (
                <div className="bg-orange/5 border border-orange/20 rounded-lg p-4">
                  <p className="text-sm text-light-charcoal dark:text-lightgrey font-barlow">
                    <span className="font-semibold text-orange">Note:</span>{" "}
                    Rewards will be paid in ALPH, converted from USD at the
                    current exchange rate.
                  </p>
                </div>
              )}

              {/* Reward Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow mb-2">
                  Reward Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={
                        formData.reward_type === "fixed" &&
                        formData.reward_currency === "USD"
                      }
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          reward_type: "fixed",
                          reward_currency: "USD",
                        }))
                      }
                      className="w-4 h-4 text-orange focus:ring-orange"
                    />
                    <span className="text-black dark:text-white font-barlow">
                      Fixed (USD)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={
                        formData.reward_type === "fixed" &&
                        formData.reward_currency === "ALPH"
                      }
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          reward_type: "fixed",
                          reward_currency: "ALPH",
                          reward_usd_value: "",
                        }))
                      }
                      className="w-4 h-4 text-orange focus:ring-orange"
                    />
                    <span className="text-black dark:text-white font-barlow">
                      Fixed Token (ALPH)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.reward_type === "tiered"}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          reward_type: "tiered",
                          reward_currency: "USD",
                        }))
                      }
                      className="w-4 h-4 text-orange focus:ring-orange"
                    />
                    <span className="text-black dark:text-white font-barlow">
                      Tiered
                    </span>
                  </label>
                </div>
              </div>

              {/* Reward Amount inputs — vary by currency mode */}
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

              {/* Tiered Reward Configuration */}
              {formData.reward_type === "tiered" && (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-light-charcoal dark:text-lightgrey font-barlow">
                    Number of Winners *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[3, 5, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            tier_count: count,
                          }))
                        }
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.tier_count === count
                            ? "border-orange bg-orange/5"
                            : "border-border-grey dark:border-dark-charcoal hover:border-orange/50"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold text-black dark:text-white font-barlow mb-2">
                            {count}
                          </div>
                          <div className="text-xs text-light-charcoal dark:text-lightgrey font-barlow">
                            Winners
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Prize Distribution Preview */}
                  <div className="mt-4 bg-smoked-white dark:bg-light-black rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-black dark:text-white font-barlow mb-3">
                      Prize Distribution
                    </h4>
                    <div className="space-y-2">
                      {formData.tier_count === 3 && (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              1st Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              50%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              2nd Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              30%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              3rd Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              20%
                            </span>
                          </div>
                        </>
                      )}
                      {formData.tier_count === 5 && (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              1st Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              40%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              2nd Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              25%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              3rd Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              15%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              4th Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              10%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              5th Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              10%
                            </span>
                          </div>
                        </>
                      )}
                      {formData.tier_count === 10 && (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              1st Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              25%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              2nd Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              18%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              3rd Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              14%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              4th Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              11%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              5th Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              9%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              6th Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              7%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              7th Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              6%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              8th Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              4%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              9th Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              3%
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-light-charcoal dark:text-lightgrey font-barlow">
                              10th Place
                            </span>
                            <span className="font-semibold text-accessible-green font-barlow">
                              3%
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
