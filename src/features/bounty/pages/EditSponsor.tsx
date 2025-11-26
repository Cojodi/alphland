"use client";

import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { Upload, X, Info, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useCallback, useEffect } from "react";

interface FormData {
  name: string;
  username: string;
  description: string;
  entity_name: string;
  industry: string;
  website: string;
  twitter: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_username: string;
  contact_telegram: string;
}

interface LogoFile {
  file: File | null;
  preview: string;
}

const INDUSTRIES = [
  "DeFi",
  "NFT",
  "Gaming",
  "Infrastructure",
  "DAO",
  "Social",
  "Developer Tools",
  "Wallet",
  "Exchange",
  "Other",
];

const MAX_BIO_LENGTH = 180;

export default function EditSponsorProfile() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<LogoFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
    description: "",
    entity_name: "",
    industry: "",
    website: "",
    twitter: "",
    contact_first_name: "",
    contact_last_name: "",
    contact_username: "",
    contact_telegram: "",
  });

  // Fetch existing sponsor data
  useEffect(() => {
    const fetchSponsor = async () => {
      if (!session?.user?.id) {
        setFetching(false);
        return;
      }

      try {
        const response = await fetch(`/api/sponsors/user/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.sponsor) {
            setSponsorId(data.sponsor.id);
            setFormData({
              name: data.sponsor.name || "",
              username: data.sponsor.username || "",
              description: data.sponsor.description || "",
              entity_name: data.sponsor.entity_name || "",
              industry: data.sponsor.industry || "",
              website: data.sponsor.website || "",
              twitter: data.sponsor.twitter || "",
              contact_first_name: data.sponsor.contact_first_name || "",
              contact_last_name: data.sponsor.contact_last_name || "",
              contact_username: data.sponsor.contact_username || "",
              contact_telegram: data.sponsor.contact_telegram || "",
            });
            if (data.sponsor.logo_url) {
              setLogoFile({
                file: null,
                preview: data.sponsor.logo_url,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching sponsor:", error);
      } finally {
        setFetching(false);
      }
    };

    if (!isPending) {
      fetchSponsor();
    }
  }, [session?.user?.id, isPending]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoFile(e.target.files[0]);
    }
  };

  const handleLogoFile = (file: File) => {
    if (file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024) {
      setLogoFile({
        file,
        preview: URL.createObjectURL(file),
      });
    }
  };

  const removeLogo = useCallback(() => {
    if (logoFile?.file) {
      URL.revokeObjectURL(logoFile.preview);
    }
    setLogoFile(null);
  }, [logoFile]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!session?.user?.id || !sponsorId) return;
      setLoading(true);

      try {
        const response = await fetch(`/api/sponsors/${sponsorId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            logo_url: logoFile?.preview || null,
            website: formData.website,
            twitter: formData.twitter,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update sponsor profile");
        }

        // Redirect to dashboard
        router.push("/bounty/sponsor/dashboard");
      } catch (error) {
        console.error("Error updating sponsor profile:", error);
      } finally {
        setLoading(false);
      }
    },
    [formData, logoFile, router, session?.user?.id, sponsorId],
  );

  const bioCharactersLeft = MAX_BIO_LENGTH - formData.description.length;

  // Show loading state
  if (isPending || fetching) {
    return (
      <Layout title="Edit Sponsor Profile - Alphland">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent" />
        </div>
      </Layout>
    );
  }

  // Require login
  if (!session?.user) {
    return (
      <Layout title="Edit Sponsor Profile - Alphland">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Edit Sponsor Profile
            </h1>
            <p className="text-light-charcoal dark:text-lightgrey">
              Please login to edit your sponsor profile.
            </p>
            <Link
              href="/auth/login?redirect=/bounty/sponsor/edit"
              className="inline-block bg-orange hover:bg-orange/90 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Login to Continue
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Not a sponsor
  if (!sponsorId) {
    return (
      <Layout title="Edit Sponsor Profile - Alphland">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Not a Sponsor
            </h1>
            <p className="text-light-charcoal dark:text-lightgrey">
              You don&apos;t have a sponsor profile yet. Create one to get
              started.
            </p>
            <Link
              href="/bounty/sponsor"
              className="inline-block bg-orange hover:bg-orange/90 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Become a Sponsor
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Edit Sponsor Profile - Alphland"
      description="Update your sponsor profile on Alphland"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Link */}
          <Link href="/bounty/sponsor/dashboard">
            <span className="inline-flex items-center gap-2 text-light-charcoal dark:text-lightgrey hover:text-orange transition-colors mb-6 cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </span>
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
              Edit Sponsor Profile
            </h1>
            <p className="text-light-charcoal dark:text-lightgrey">
              Update your sponsor profile information
            </p>
          </div>

          <div className="bg-white dark:bg-hero-dark rounded-lg border border-border-grey dark:border-dark-charcoal">
            <div className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Company Information */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-black dark:text-white">
                    Company Information
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">
                        Company Name <span className="text-orange">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                        placeholder="Company Name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        disabled
                        className="w-full px-4 py-2.5 bg-smoked-white/50 dark:bg-light-black/50 border border-border-grey dark:border-dark-charcoal rounded-lg text-light-charcoal dark:text-lightgrey cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            website: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">
                        Twitter
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-smoked-white dark:bg-light-black border border-r-0 border-border-grey dark:border-dark-charcoal rounded-l-lg text-light-charcoal dark:text-lightgrey text-sm">
                          x.com/
                        </span>
                        <input
                          type="text"
                          value={formData.twitter}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              twitter: e.target.value.replace("@", ""),
                            }))
                          }
                          className="flex-1 px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-r-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                          placeholder="username"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Logo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black dark:text-white">
                      Company Logo
                    </label>

                    {logoFile ? (
                      <div className="flex items-center gap-4 p-4 border border-border-grey dark:border-dark-charcoal rounded-lg bg-smoked-white dark:bg-light-black">
                        <Image
                          src={logoFile.preview}
                          alt="Company logo"
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black dark:text-white">
                            {logoFile.file?.name || "Current logo"}
                          </p>
                          {logoFile.file && (
                            <p className="text-xs text-light-charcoal dark:text-lightgrey">
                              {Math.round(logoFile.file.size / 1024)} KB
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="p-2 text-light-charcoal hover:text-orange transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                          dragActive
                            ? "border-orange bg-orange/5"
                            : "border-border-grey dark:border-dark-charcoal hover:border-orange/50"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileInput}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer flex items-center gap-4"
                        >
                          <div className="w-12 h-12 bg-smoked-white dark:bg-light-black rounded-lg flex items-center justify-center">
                            <Upload className="w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-orange">
                              Choose or drag and drop media
                            </p>
                            <p className="text-xs text-light-charcoal dark:text-lightgrey">
                              Maximum size 5 MB
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Company Short Bio */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black dark:text-white">
                      Company Short Bio
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_BIO_LENGTH) {
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }));
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey resize-none focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                      placeholder="What does your company do?"
                      rows={3}
                    />
                    <p className="text-xs text-light-charcoal dark:text-lightgrey text-right">
                      {bioCharactersLeft} characters left
                    </p>
                  </div>
                </div>

                {/* Submit */}
                <div className="space-y-6">
                  <button
                    type="submit"
                    className="w-full bg-orange hover:bg-orange/90 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !formData.name}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Saving Changes...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
