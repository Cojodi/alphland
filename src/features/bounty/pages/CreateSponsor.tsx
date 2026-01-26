"use client";

import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useCallback, useEffect } from "react";
import { normalizeUrl } from "../utils/validators";

interface FormData {
  // About You
  first_name: string;
  last_name: string;
  username: string;
  telegram: string;
  email: string;
  // About Your Company
  company_name: string;
  company_url: string;
  company_twitter: string;
  industry: string;
  company_bio: string;
}

interface ImageFile {
  file: File;
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

export default function CreateSponsorProfile() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<ImageFile | null>(null);
  const [bannerFile, setBannerFile] = useState<ImageFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [bannerDragActive, setBannerDragActive] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    username: "",
    telegram: "",
    email: "",
    company_name: "",
    company_url: "",
    company_twitter: "",
    industry: "",
    company_bio: "",
  });

  // Pre-fill user data from session and profile (only once)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user || hasLoadedProfile) {
        return;
      }

      try {
        // Fetch user profile to get username
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const data = await response.json();
          const profile = data.user;

          setFormData((prev) => ({
            ...prev,
            first_name:
              profile?.first_name || session.user.name?.split(" ")[0] || "",
            last_name:
              profile?.last_name ||
              session.user.name?.split(" ").slice(1).join(" ") ||
              "",
            username: profile?.username || "",
            email: session.user.email || "",
          }));
        } else {
          // Fallback to session data only
          const nameParts = (session.user.name || "").split(" ");
          setFormData((prev) => ({
            ...prev,
            first_name: nameParts[0] || "",
            last_name: nameParts.slice(1).join(" ") || "",
            email: session.user.email || "",
          }));
        }
        setHasLoadedProfile(true);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        // Fallback to session data only
        const nameParts = (session.user.name || "").split(" ");
        setFormData((prev) => ({
          ...prev,
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || "",
          email: session.user.email || "",
        }));
        setHasLoadedProfile(true);
      }
    };

    fetchUserProfile();
  }, [session, hasLoadedProfile]);

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
    if (logoFile) {
      URL.revokeObjectURL(logoFile.preview);
    }
    setLogoFile(null);
  }, [logoFile]);

  // Banner handlers
  const handleBannerDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setBannerDragActive(true);
    } else if (e.type === "dragleave") {
      setBannerDragActive(false);
    }
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBannerDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleBannerFile(e.dataTransfer.files[0]);
    }
  };

  const handleBannerFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleBannerFile(e.target.files[0]);
    }
  };

  const handleBannerFile = (file: File) => {
    if (file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024) {
      setBannerFile({
        file,
        preview: URL.createObjectURL(file),
      });
    }
  };

  const removeBanner = useCallback(() => {
    if (bannerFile) {
      URL.revokeObjectURL(bannerFile.preview);
    }
    setBannerFile(null);
  }, [bannerFile]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!agreed || !session?.user?.id) return;
      setLoading(true);

      try {
        // Upload logo to R2 if it exists
        let logoUrl = null;
        if (logoFile) {
          console.log("Uploading sponsor logo to R2...");
          // Read file as base64
          const reader = new FileReader();
          const logoDataUrl = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(logoFile.file);
          });

          console.log("Logo data URL length:", logoDataUrl.length);

          // Upload to R2
          const uploadResponse = await fetch("/api/upload/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: logoDataUrl,
              fileName: logoFile.file.name,
              type: "sponsor",
            }),
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("Upload failed:", errorText);
            alert("Failed to upload logo. Please try again.");
            throw new Error("Failed to upload logo");
          }

          const uploadData = await uploadResponse.json();
          logoUrl = uploadData.url;
          console.log("Logo uploaded successfully:", logoUrl);
        }

        // Upload banner to R2 if it exists
        let bannerUrl = null;
        if (bannerFile) {
          console.log("Uploading sponsor banner to R2...");
          const reader = new FileReader();
          const bannerDataUrl = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(bannerFile.file);
          });

          const uploadResponse = await fetch("/api/upload/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: bannerDataUrl,
              fileName: bannerFile.file.name,
              type: "sponsor-banner",
            }),
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("Banner upload failed:", errorText);
            // Don't fail the whole submission, banner is optional
          } else {
            const uploadData = await uploadResponse.json();
            bannerUrl = uploadData.url;
            console.log("Banner uploaded successfully:", bannerUrl);
          }
        }

        // Create sponsor application via API
        const response = await fetch("/api/sponsors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: session.user.id,
            name: formData.company_name,
            description: formData.company_bio,
            industry: formData.industry,
            website: formData.company_url,
            twitter: formData.company_twitter,
            contact_first_name: formData.first_name,
            contact_last_name: formData.last_name,
            contact_username: formData.username,
            contact_telegram: formData.telegram || null,
            contact_email: formData.email || null,
            logo_url: logoUrl,
            banner_url: bannerUrl,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create sponsor profile");
        }

        // Redirect to success page
        router.push("/bounty/sponsor/success");
      } catch (error) {
        console.error("Error submitting sponsor application:", error);
      } finally {
        setLoading(false);
      }
    },
    [formData, logoFile, bannerFile, agreed, router, session?.user?.id],
  );

  const bioCharactersLeft = MAX_BIO_LENGTH - formData.company_bio.length;

  // Show loading state
  if (isPending) {
    return (
      <Layout title="Become a Sponsor - Alphland">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent" />
        </div>
      </Layout>
    );
  }

  // Require login
  if (!session?.user) {
    return (
      <Layout title="Become a Sponsor - Alphland">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Become a Sponsor
            </h1>
            <p className="text-light-charcoal dark:text-lightgrey">
              Please login to apply as a sponsor and start posting bounties on
              Alphland.
            </p>
            <Link
              href="/auth/login?redirect=/bounty/sponsor"
              className="inline-block bg-orange hover:bg-orange/90 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Login to Continue
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Become a Sponsor - Alphland"
      description="Apply to become a sponsor and launch bounties on Alphland"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
              Become a Sponsor
            </h1>
            <p className="text-light-charcoal dark:text-lightgrey">
              Let&apos;s start with some basic information about you and your
              team
            </p>
          </div>

          <div className="bg-white dark:bg-hero-dark rounded-lg border border-border-grey dark:border-dark-charcoal">
            <div className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* About You Section */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-black dark:text-white">
                    About You
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">
                        First Name <span className="text-orange">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            first_name: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                        placeholder="First Name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">
                        Last Name <span className="text-orange">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            last_name: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black dark:text-white">
                      Username <span className="text-orange">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                      placeholder="username"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">
                        Email{" "}
                        <span className="text-light-charcoal dark:text-lightgrey text-xs">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">
                        Telegram{" "}
                        <span className="text-light-charcoal dark:text-lightgrey text-xs">
                          (optional)
                        </span>
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-smoked-white dark:bg-light-black border border-r-0 border-border-grey dark:border-dark-charcoal rounded-l-lg text-light-charcoal dark:text-lightgrey text-sm">
                          t.me/
                        </span>
                        <input
                          type="text"
                          value={formData.telegram}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              telegram: e.target.value,
                            }))
                          }
                          className="flex-1 px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-r-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                          placeholder="username"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-border-grey dark:border-dark-charcoal" />

                {/* About Your Company Section */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-black dark:text-white">
                    About Your Company
                  </h2>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black dark:text-white">
                      Company Name <span className="text-orange">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          company_name: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                      placeholder="Company Name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">
                        Company Website <span className="text-orange">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.company_url}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            company_url: e.target.value,
                          }))
                        }
                        onBlur={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            company_url: normalizeUrl(e.target.value),
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                        placeholder="https://example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">
                        Company X <span className="text-orange">*</span>
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-smoked-white dark:bg-light-black border border-r-0 border-border-grey dark:border-dark-charcoal rounded-l-lg text-light-charcoal dark:text-lightgrey text-sm">
                          x.com/
                        </span>
                        <input
                          type="text"
                          value={formData.company_twitter}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              company_twitter: e.target.value.replace("@", ""),
                            }))
                          }
                          className="flex-1 px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-r-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                          placeholder="companyname"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Logo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black dark:text-white">
                      Company Logo <span className="text-orange">*</span>
                    </label>
                    <p className="text-xs text-light-charcoal dark:text-lightgrey">
                      Recommended size: 200x200 pixels (square format)
                    </p>

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
                            {logoFile.file.name}
                          </p>
                          <p className="text-xs text-light-charcoal dark:text-lightgrey">
                            {Math.round(logoFile.file.size / 1024)} KB
                          </p>
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

                  {/* Company Banner (Optional) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black dark:text-white">
                      Profile Banner{" "}
                      <span className="text-light-charcoal dark:text-lightgrey text-xs">
                        (optional)
                      </span>
                    </label>
                    <p className="text-xs text-light-charcoal dark:text-lightgrey">
                      Recommended size: 1200x300 pixels (4:1 aspect ratio)
                    </p>

                    {bannerFile ? (
                      <div className="relative border border-border-grey dark:border-dark-charcoal rounded-lg overflow-hidden bg-smoked-white dark:bg-light-black">
                        <Image
                          src={bannerFile.preview}
                          alt="Company banner"
                          width={600}
                          height={150}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            type="button"
                            onClick={removeBanner}
                            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-black dark:text-white">
                            {bannerFile.file.name}
                          </p>
                          <p className="text-xs text-light-charcoal dark:text-lightgrey">
                            {Math.round(bannerFile.file.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragEnter={handleBannerDrag}
                        onDragLeave={handleBannerDrag}
                        onDragOver={handleBannerDrag}
                        onDrop={handleBannerDrop}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                          bannerDragActive
                            ? "border-orange bg-orange/5"
                            : "border-border-grey dark:border-dark-charcoal hover:border-orange/50"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileInput}
                          className="hidden"
                          id="banner-upload"
                        />
                        <label
                          htmlFor="banner-upload"
                          className="cursor-pointer flex items-center gap-4"
                        >
                          <div className="w-12 h-12 bg-smoked-white dark:bg-light-black rounded-lg flex items-center justify-center">
                            <Upload className="w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-orange">
                              Choose or drag and drop banner image
                            </p>
                            <p className="text-xs text-light-charcoal dark:text-lightgrey">
                              Maximum size 5 MB (Leave empty for default
                              gradient)
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Industry */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black dark:text-white">
                      Industry <span className="text-orange">*</span>
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          industry: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                      required
                    >
                      <option value="">Select...</option>
                      {INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company Short Bio */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black dark:text-white">
                      Company Short Bio <span className="text-orange">*</span>
                    </label>
                    <textarea
                      value={formData.company_bio}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_BIO_LENGTH) {
                          setFormData((prev) => ({
                            ...prev,
                            company_bio: e.target.value,
                          }));
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey resize-none focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange"
                      placeholder="What does your company do?"
                      rows={3}
                      required
                    />
                    <p className="text-xs text-light-charcoal dark:text-lightgrey text-right">
                      {bioCharactersLeft} characters left
                    </p>
                  </div>
                </div>

                {/* Agreement & Submit */}
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreement"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-border-grey dark:border-dark-charcoal cursor-pointer accent-orange"
                    />
                    <label
                      htmlFor="agreement"
                      className="text-sm text-light-charcoal dark:text-lightgrey cursor-pointer leading-relaxed"
                    >
                      I understand and acknowledge that this project is built
                      on, or supports, the Alephium blockchain, and that
                      Alphland is a platform exclusively for teams and projects
                      within the Alephium ecosystem.{" "}
                      <span className="text-orange">*</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-orange hover:bg-orange/90 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      loading ||
                      !agreed ||
                      !formData.first_name ||
                      !formData.last_name ||
                      !formData.username ||
                      !formData.company_name ||
                      !formData.company_url ||
                      !formData.company_twitter ||
                      !formData.industry ||
                      !formData.company_bio ||
                      !logoFile
                    }
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Submitting Application...
                      </div>
                    ) : (
                      "Become a Sponsor"
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
