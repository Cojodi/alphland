"use client";

import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { useWallet, useConnect } from "@alephium/web3-react";
import { X, Upload } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

// Country list for location dropdown
const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "North Korea",
  "South Korea",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const WEB3_INTERESTS = [
  "DeFi",
  "NFTs",
  "DAOs",
  "Gaming",
  "Infrastructure",
  "Security",
  "Layer 2",
  "Privacy",
  "Social",
  "Identity",
  "Metaverse",
  "AI & Blockchain",
  "RWA",
  "Other",
];

const MAX_SKILLS = 10;

const SKILL_OPTIONS = [
  // Development
  "Frontend",
  "Backend",
  "Full-stack",
  "Smart Contracts",
  "Solidity",
  "Rust",
  "Move",
  "JavaScript",
  "TypeScript",
  "Python",
  "Go",
  "C++",
  "React",
  "Vue",
  "Angular",
  "Node.js",
  "GraphQL",
  "MongoDB",
  "PostgreSQL",
  "Redis",
  "AWS",
  "Docker",
  "Kubernetes",
  // Design
  "UI/UX Design",
  "Graphic Design",
  "Video Editing",
  "Motion Graphics",
  // Content
  "Content Writing",
  "Social Media",
  "Copywriting",
  // Other
  "Product Management",
  "Marketing",
  "Community Management",
  "Technical Writing",
  "Security Auditing",
  "Data Analysis",
  "Machine Learning",
  "DevOps",
  "Blockchain",
];

interface FormData {
  profilePicture: File | null;
  profilePicturePreview: string | null;
  username: string;
  bio: string;
  alphWalletAddress: string;
  socials: {
    discord: string;
    twitter: string;
    github: string;
    linkedin: string;
    telegram: string;
    website: string;
  };
  web3Interests: string[];
  location: string;
  web3Familiarity: string;
  workPreference: string;
  currentEmployer: string;
  lookingFor: string;
  skills: string[];
}

export default function EditProfile() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    profilePicture: null,
    profilePicturePreview: null,
    username: "",
    bio: "",
    alphWalletAddress: "",
    socials: {
      discord: "",
      twitter: "",
      github: "",
      linkedin: "",
      telegram: "",
      website: "",
    },
    web3Interests: [],
    location: "",
    web3Familiarity: "",
    workPreference: "",
    currentEmployer: "",
    lookingFor: "",
    skills: [],
  });

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [googleName, setGoogleName] = useState<string | null>(null);
  const [walletBindLoading, setWalletBindLoading] = useState(false);
  const [walletBindError, setWalletBindError] = useState("");
  const [walletMode, setWalletMode] = useState<"connect" | "manual">("connect");
  const [manualWalletInput, setManualWalletInput] = useState("");
  const [pendingBind, setPendingBind] = useState(false);

  const { connectionStatus, signer, account: walletAccount } = useWallet();
  const { connect } = useConnect();

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      // Only load profile once to prevent overwriting user input
      if (hasLoadedProfile) {
        return;
      }

      try {
        const response = await fetch("/api/users/me", {
          credentials: "include",
        });

        if (!response.ok) {
          console.error("Failed to load profile:", response.status);
          setIsLoading(false);
          return;
        }

        // Validate JSON response
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("API returned non-JSON response");
          toast.error(
            "Service temporarily unavailable, please try again later",
          );
          setIsLoading(false);
          return;
        }

        const data = await response.json();

        if (data.user) {
          const profile = data.user;

          // Parse JSON fields - combine skills from all categories
          const frontendSkills = profile.frontend_skills
            ? JSON.parse(profile.frontend_skills)
            : [];
          const backendSkills = profile.backend_skills
            ? JSON.parse(profile.backend_skills)
            : [];
          const blockchainSkills = profile.blockchain_skills
            ? JSON.parse(profile.blockchain_skills)
            : [];

          // Combine and deduplicate skills
          const skills = Array.from(
            new Set([...frontendSkills, ...backendSkills, ...blockchainSkills]),
          );

          const web3Interests = profile.web3_interests
            ? JSON.parse(profile.web3_interests)
            : [];

          // Extract username from URL fields (remove the URL part)
          const extractUsername = (url: string) => {
            if (!url) return "";
            // If it's already just a username (no http), return it
            if (!url.startsWith("http")) return url;
            // Extract username from URL
            const parts = url.split("/");
            return parts[parts.length - 1] || "";
          };

          // Set Google linked info
          setIsGoogleLinked(!!profile.isGoogleLinked);
          setGoogleName(profile.googleName || null);

          setFormData((prev) => ({
            ...prev,
            username: profile.username || "",
            bio: profile.bio || "",
            alphWalletAddress: profile.wallet_address || "",
            // Keep the current preview if user has selected a new image, otherwise use profile image
            profilePicturePreview: prev.profilePicture
              ? prev.profilePicturePreview
              : profile.image || null,
            socials: {
              discord: extractUsername(profile.discord_url || ""),
              twitter: extractUsername(profile.twitter_url || ""),
              github: extractUsername(profile.github_url || ""),
              linkedin: extractUsername(profile.linkedin_url || ""),
              telegram: extractUsername(profile.telegram_url || ""),
              website: profile.website_url || "",
            },
            location: profile.location || "",
            web3Familiarity: profile.web3_familiarity || "",
            workPreference:
              profile.work_experience || profile.looking_for || "",
            currentEmployer: profile.current_employer || "",
            lookingFor: profile.looking_for || "",
            skills,
            web3Interests,
          }));

          if (profile.location) {
            setLocationSearch(profile.location);
          }

          setHasLoadedProfile(true);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [session, hasLoadedProfile]);

  const validateUsername = (username: string): string | null => {
    if (!username) return null;
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    if (username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (username.length > 30) {
      return "Username must be 30 characters or fewer";
    }
    return null;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "username") {
      setUsernameError(validateUsername(value));
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialChange = (
    platform: keyof FormData["socials"],
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        [platform]: value,
      },
    }));
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name, "Size:", file.size, "bytes");

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        console.log("Image loaded successfully");
        console.log("New preview starts with:", result?.substring(0, 50));
        console.log("New preview length:", result?.length);
        setFormData((prev) => {
          console.log("Setting form data with new image");
          return {
            ...prev,
            profilePicture: file,
            profilePicturePreview: result,
          };
        });
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast.error("Failed to read the image file. Please try again.");
      };
      reader.readAsDataURL(file);
    } else {
      console.log("No file selected");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          profilePicture: file,
          profilePicturePreview: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (
      trimmedSkill &&
      !formData.skills.includes(trimmedSkill) &&
      formData.skills.length < MAX_SKILLS
    ) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill],
      }));
    }
    setNewSkillInput("");
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(newSkillInput);
    }
  };

  const toggleWeb3Interest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      web3Interests: prev.web3Interests.includes(interest)
        ? prev.web3Interests.filter((i) => i !== interest)
        : [...prev.web3Interests, interest],
    }));
  };

  const handleLocationSelect = (country: string) => {
    setFormData((prev) => ({ ...prev, location: country }));
    setLocationSearch(country);
    setShowLocationDropdown(false);
  };

  const filteredCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(locationSearch.toLowerCase()),
  );

  const bioCharactersLeft = 150 - formData.bio.length;

  const doSignAndBind = async (
    walletSigner: NonNullable<typeof signer>,
    connectedAccount: NonNullable<typeof walletAccount>,
  ) => {
    setWalletBindLoading(true);
    setWalletBindError("");
    try {
      // Get nonce from server
      const nonceRes = await fetch("/api/wallet/nonce", {
        method: "POST",
        credentials: "include",
      });
      if (!nonceRes.ok) throw new Error("Failed to get nonce from server");
      const { nonce } = await nonceRes.json();

      // Sign the message
      const message = `Bind wallet to Alphland: ${nonce}`;
      const { signature } = await walletSigner.signMessage({
        message,
        messageHasher: "alephium",
        signerAddress: connectedAccount.address,
      });

      // Send to server for verification and binding
      const bindRes = await fetch("/api/wallet/bind", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: connectedAccount.address,
          publicKey: connectedAccount.publicKey,
          signature,
          nonce,
        }),
      });
      const bindData = await bindRes.json();
      if (!bindRes.ok)
        throw new Error(bindData.error || "Failed to bind wallet");

      setFormData((prev) => ({
        ...prev,
        alphWalletAddress: connectedAccount.address,
      }));
    } catch (err: any) {
      if (
        err?.message?.toLowerCase().includes("cancelled") ||
        err?.message?.toLowerCase().includes("rejected")
      ) {
        setWalletBindError("Signing cancelled.");
      } else {
        setWalletBindError(err.message || "Failed to bind wallet");
      }
    } finally {
      setWalletBindLoading(false);
    }
  };

  // When wallet connects after user clicked "Connect Alephium Wallet", proceed with binding
  useEffect(() => {
    if (
      pendingBind &&
      connectionStatus === "connected" &&
      signer &&
      walletAccount
    ) {
      setPendingBind(false);
      doSignAndBind(signer, walletAccount);
    }
  }, [connectionStatus, pendingBind]);

  const handleBindWallet = async () => {
    if (connectionStatus === "connected" && signer && walletAccount) {
      await doSignAndBind(signer, walletAccount);
    } else {
      setPendingBind(true);
      connect();
    }
  };

  const handleUnbindWallet = async () => {
    setWalletBindLoading(true);
    setWalletBindError("");
    try {
      const res = await fetch("/api/wallet/unbind", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unbind wallet");
      }
      setFormData((prev) => ({ ...prev, alphWalletAddress: "" }));
    } catch (err: any) {
      setWalletBindError(err.message || "Failed to unbind wallet");
    } finally {
      setWalletBindLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("Please log in to update your profile");
      router.push("/auth/login");
      return;
    }

    // Validate required fields
    if (!formData.username || !formData.alphWalletAddress) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate username format
    const usernameValidation = validateUsername(formData.username);
    if (usernameValidation) {
      setUsernameError(usernameValidation);
      document
        .getElementsByName("username")[0]
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (formData.skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("=== Starting form submission ===");
      console.log("formData.profilePicture:", formData.profilePicture);
      console.log(
        "formData.profilePicturePreview starts with:",
        formData.profilePicturePreview?.substring(0, 50),
      );
      console.log(
        "formData.profilePicturePreview length:",
        formData.profilePicturePreview?.length,
      );

      // Upload profile picture to R2 if a new one was uploaded
      let imageUrl = null;
      if (formData.profilePicture && formData.profilePicturePreview) {
        console.log("Uploading profile picture to R2...");
        console.log(
          "Image preview starts with:",
          formData.profilePicturePreview.substring(0, 50),
        );
        console.log(
          "Image preview length:",
          formData.profilePicturePreview.length,
        );

        // Upload to R2
        const uploadResponse = await fetch("/api/upload/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: formData.profilePicturePreview,
            fileName: formData.profilePicture.name,
            type: "user",
          }),
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("Upload failed:", errorText);
          throw new Error("Failed to upload profile picture");
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
        console.log("Image uploaded successfully:", imageUrl);
      }

      // Prepare request body with optional image
      const requestBody: Record<string, unknown> = {
        username: formData.username,
        bio: formData.bio,
        wallet_address: formData.alphWalletAddress,
        github_username: formData.socials.github,
        twitter_username: formData.socials.twitter,
        discord_username: formData.socials.discord,
        linkedin_username: formData.socials.linkedin,
        telegram_username: formData.socials.telegram,
        website: formData.socials.website,
        location: formData.location,
        work_preference: formData.workPreference,
        current_employer: formData.currentEmployer,
        web3_familiarity: formData.web3Familiarity,
        looking_for: formData.lookingFor,
        skills: formData.skills,
        web3_interests: formData.web3Interests,
      };

      // Include image URL if uploaded
      if (imageUrl) {
        requestBody.image = imageUrl;
        console.log("Including image URL in update request:", imageUrl);
      }

      console.log("Updating user profile...");
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });
      console.log("Update response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Redirect to user profile page
      router.push(`/bounty/profile/${formData.username}`);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDeleteAccount = async () => {
    if (!session?.user) {
      toast.error("You must be logged in to delete your account");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/user/${session.user.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Log out the user and redirect to homepage
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again or contact support.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not logged in
  if (!session?.user && !isLoading) {
    return (
      <Layout
        title="Edit Profile - Alphland"
        description="Update your profile information"
      >
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
              Please log in
            </h1>
            <p className="text-light-charcoal dark:text-lightgrey mb-4">
              You need to be logged in to edit your profile.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout
        title="Edit Profile - Alphland"
        description="Update your profile information"
      >
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto mb-4"></div>
            <p className="text-light-charcoal dark:text-lightgrey">
              Loading profile...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Edit Profile - Alphland"
      description="Update your profile information"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black">
        <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-2">
              Edit Profile
            </h1>
            <p className="text-light-charcoal dark:text-lightgrey">
              Update your profile information and showcase your skills
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <section className="bg-white dark:bg-hero-dark rounded-lg p-6 sm:p-8 border border-border-grey dark:border-dark-charcoal">
              <h2 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-orange rounded-full"></span>
                Personal Information
              </h2>

              <div className="space-y-6">
                {/* Google Linked Account Info */}
                {isGoogleLinked && googleName && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      {/* <div className="flex-1">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                          Linked via Google: {googleName}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                          This name is synced from your Google account and
                          cannot be edited here.
                        </p>
                      </div> */}
                    </div>
                  </div>
                )}

                {/* Username Prompt - show if no username set */}
                {!formData.username && hasLoadedProfile && (
                  <div className="bg-orange/10 dark:bg-orange/20 border border-orange/30 rounded-lg p-4">
                    <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                      You are currently using your Google name for display. Set
                      a unique username below to personalize your profile.
                    </p>
                  </div>
                )}

                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-3">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-smoked-white dark:bg-light-black flex items-center justify-center overflow-hidden flex-shrink-0">
                      {formData.profilePicturePreview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={formData.profilePicturePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfilePictureChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={handleProfilePictureClick}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="flex-1 border-2 border-dashed border-border-grey dark:border-dark-charcoal rounded-lg p-4 text-center cursor-pointer hover:border-orange transition-colors"
                    >
                      <p className="text-sm font-medium text-black dark:text-white">
                        Choose or drag and drop media
                      </p>
                      <p className="text-xs text-light-charcoal dark:text-lightgrey">
                        Maximum size 5 MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    required
                    pattern="[a-zA-Z0-9_]+"
                    maxLength={30}
                    className={`w-full px-4 py-2 bg-smoked-white dark:bg-light-black border rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange ${
                      usernameError
                        ? "border-red-500 dark:border-red-500"
                        : "border-border-grey dark:border-dark-charcoal"
                    }`}
                  />
                  {usernameError && (
                    <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                  )}
                  {!usernameError && formData.username && (
                    <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1">
                      Only letters, numbers, and underscores
                    </p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    One-Line Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself"
                    rows={3}
                    maxLength={150}
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                  <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1">
                    {bioCharactersLeft} characters left
                  </p>
                </div>

                {/* Alph Wallet Address */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Alph Wallet Address*
                  </label>
                  {formData.alphWalletAddress ? (
                    <div className="flex items-center gap-3 px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg">
                      <span className="font-mono text-sm text-black dark:text-white truncate flex-1">
                        {formData.alphWalletAddress}
                      </span>
                      <button
                        type="button"
                        onClick={handleUnbindWallet}
                        disabled={walletBindLoading}
                        className="text-sm text-red-500 hover:text-red-400 font-medium shrink-0 disabled:opacity-50"
                      >
                        {walletBindLoading ? "..." : "Unbind"}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Mode tabs */}
                      <div className="flex gap-1 mb-3 p-1 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg w-fit">
                        <button
                          type="button"
                          onClick={() => {
                            setWalletMode("connect");
                            setWalletBindError("");
                          }}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            walletMode === "connect"
                              ? "bg-white dark:bg-hero-dark text-black dark:text-white shadow-sm"
                              : "text-light-charcoal dark:text-lightgrey hover:text-black dark:hover:text-white"
                          }`}
                        >
                          Connect Wallet
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setWalletMode("manual");
                            setWalletBindError("");
                          }}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            walletMode === "manual"
                              ? "bg-white dark:bg-hero-dark text-black dark:text-white shadow-sm"
                              : "text-light-charcoal dark:text-lightgrey hover:text-black dark:hover:text-white"
                          }`}
                        >
                          Enter Manually
                        </button>
                      </div>

                      {walletMode === "connect" ? (
                        <button
                          type="button"
                          onClick={handleBindWallet}
                          disabled={walletBindLoading}
                          className="flex items-center gap-2 px-4 py-2 border border-border-grey dark:border-dark-charcoal rounded-lg bg-white dark:bg-light-black hover:bg-smoked-white dark:hover:bg-hero-dark transition-colors text-black dark:text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {walletBindLoading ? (
                            <>
                              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            "Connect Alephium Wallet"
                          )}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualWalletInput}
                            onChange={(e) =>
                              setManualWalletInput(e.target.value)
                            }
                            placeholder="Enter your Alephium wallet address"
                            className="flex-1 px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!manualWalletInput.trim()) {
                                setWalletBindError(
                                  "Please enter a wallet address.",
                                );
                                return;
                              }
                              setFormData((prev) => ({
                                ...prev,
                                alphWalletAddress: manualWalletInput.trim(),
                              }));
                              setWalletBindError("");
                            }}
                            className="px-4 py-2 bg-orange text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                          >
                            Confirm
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {walletBindError && (
                    <p className="mt-2 text-sm text-red-500">
                      {walletBindError}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Socials Section */}
            <section className="bg-white dark:bg-hero-dark rounded-lg p-6 sm:p-8 border border-border-grey dark:border-dark-charcoal">
              <h2 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                Socials
              </h2>

              <div className="space-y-4">
                {/* Discord */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Discord
                  </label>
                  <input
                    type="text"
                    value={formData.socials.discord}
                    onChange={(e) =>
                      handleSocialChange("discord", e.target.value)
                    }
                    placeholder="username#1234"
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>

                {/* Twitter */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Twitter
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-r-0 border-border-grey dark:border-dark-charcoal rounded-l-lg text-light-charcoal dark:text-lightgrey text-sm">
                      x.com/
                    </span>
                    <input
                      type="text"
                      value={formData.socials.twitter}
                      onChange={(e) =>
                        handleSocialChange("twitter", e.target.value)
                      }
                      placeholder="username"
                      className="flex-1 px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-r-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>

                {/* GitHub */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    GitHub
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-r-0 border-border-grey dark:border-dark-charcoal rounded-l-lg text-light-charcoal dark:text-lightgrey text-sm">
                      github.com/
                    </span>
                    <input
                      type="text"
                      value={formData.socials.github}
                      onChange={(e) =>
                        handleSocialChange("github", e.target.value)
                      }
                      placeholder="username"
                      className="flex-1 px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-r-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    LinkedIn
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-r-0 border-border-grey dark:border-dark-charcoal rounded-l-lg text-light-charcoal dark:text-lightgrey text-sm">
                      linkedin.com/in/
                    </span>
                    <input
                      type="text"
                      value={formData.socials.linkedin}
                      onChange={(e) =>
                        handleSocialChange("linkedin", e.target.value)
                      }
                      placeholder="username"
                      className="flex-1 px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-r-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>

                {/* Telegram */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Telegram
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-r-0 border-border-grey dark:border-dark-charcoal rounded-l-lg text-light-charcoal dark:text-lightgrey text-sm">
                      t.me/
                    </span>
                    <input
                      type="text"
                      value={formData.socials.telegram}
                      onChange={(e) =>
                        handleSocialChange("telegram", e.target.value)
                      }
                      placeholder="username"
                      className="flex-1 px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-r-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Website
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-r-0 border-border-grey dark:border-dark-charcoal rounded-l-lg text-light-charcoal dark:text-lightgrey text-sm">
                      https://
                    </span>
                    <input
                      type="text"
                      value={formData.socials.website}
                      onChange={(e) =>
                        handleSocialChange("website", e.target.value)
                      }
                      placeholder="yourwebsite.com"
                      className="flex-1 px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-r-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Work Section */}
            <section className="bg-white dark:bg-hero-dark rounded-lg p-6 sm:p-8 border border-border-grey dark:border-dark-charcoal">
              <h2 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                Work
              </h2>

              <div className="space-y-6">
                {/* Web3 Interests */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-3">
                    What areas of Web3 are you most interested in?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEB3_INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleWeb3Interest(interest)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          formData.web3Interests.includes(interest)
                            ? "bg-orange text-white"
                            : "bg-smoked-white dark:bg-light-black text-black dark:text-white border border-border-grey dark:border-dark-charcoal hover:border-orange"
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    placeholder="Select your country"
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                  {showLocationDropdown && filteredCountries.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal rounded-lg shadow-lg">
                      {filteredCountries.slice(0, 10).map((country) => (
                        <button
                          key={country}
                          type="button"
                          onClick={() => handleLocationSelect(country)}
                          className="w-full px-4 py-2 text-left text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors"
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Web3 Familiarity */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    How familiar are you with Web3?
                  </label>
                  <select
                    name="web3Familiarity"
                    value={formData.web3Familiarity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                  >
                    <option value="">Select...</option>
                    <option value="new_to_crypto">New to crypto</option>
                    <option value="occasionally_contributing">
                      Occasionally contributing
                    </option>
                    <option value="contributing_regularly">
                      Contributing regularly
                    </option>
                  </select>
                </div>

                {/* Work Preference */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Work Preference
                  </label>
                  <select
                    name="workPreference"
                    value={formData.workPreference}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                  >
                    <option value="">Select...</option>
                    <option value="not_looking">Not looking for work</option>
                    <option value="freelance">Freelance</option>
                    <option value="fulltime">Fulltime</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                {/* Looking For */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Looking For
                  </label>
                  <input
                    type="text"
                    name="lookingFor"
                    value={formData.lookingFor}
                    onChange={handleInputChange}
                    placeholder="e.g., Smart contract development opportunities"
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                  <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1">
                    Describe what kind of work or opportunities you&apos;re
                    looking for
                  </p>
                </div>

                {/* Current Employer */}
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                    Current Employer
                  </label>
                  <input
                    type="text"
                    name="currentEmployer"
                    value={formData.currentEmployer}
                    onChange={handleInputChange}
                    placeholder="Company name"
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>
              </div>
            </section>

            {/* Skills Section */}
            <section className="bg-white dark:bg-hero-dark rounded-lg p-6 sm:p-8 border border-border-grey dark:border-dark-charcoal">
              <h2 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-accessible-green rounded-full"></span>
                Skills
              </h2>

              <div>
                <label className="block text-sm font-semibold text-black dark:text-white mb-3">
                  Skills Needed <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-light-charcoal dark:text-lightgrey">
                    ({formData.skills.length}/{MAX_SKILLS})
                  </span>
                </label>
                <p className="text-xs text-light-charcoal dark:text-lightgrey mb-4">
                  We will send notifications about new listings for your
                  selected skills. Type any skill and press Enter to add.
                </p>

                {/* Skill suggestions */}
                {formData.skills.length < MAX_SKILLS && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SKILL_OPTIONS.filter(
                      (skill) => !formData.skills.includes(skill),
                    )
                      .slice(0, 10)
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="px-3 py-1.5 bg-smoked-white dark:bg-light-black text-black dark:text-white border border-border-grey dark:border-dark-charcoal rounded-full text-sm hover:border-orange transition-colors"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                )}
                {formData.skills.length >= MAX_SKILLS && (
                  <p className="text-sm text-orange mb-4">
                    Maximum {MAX_SKILLS} skills reached
                  </p>
                )}

                {/* Selected skills */}
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.skills.map((skill) => (
                      <div
                        key={skill}
                        className="inline-flex items-center gap-2 bg-accessible-green/10 dark:bg-accessible-green/20 text-accessible-green px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-accessible-green/70 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom skill input */}
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder={
                    formData.skills.length >= MAX_SKILLS
                      ? `Maximum ${MAX_SKILLS} skills reached`
                      : "Type a skill and press Enter to add"
                  }
                  disabled={formData.skills.length >= MAX_SKILLS}
                  className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </section>

            {/* Submit Buttons */}
            <section className="space-y-6">
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-accessible-green hover:bg-accessible-green/90 text-white font-semibold px-8 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Updating..." : "Update Profile"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border border-border-grey dark:border-dark-charcoal text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black px-8 py-2 rounded-lg bg-transparent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </section>
          </form>

          {/* Danger Zone - Account Deletion */}
          {/* <section className="bg-white dark:bg-hero-dark rounded-lg p-6 sm:p-8 border-2 border-red-200 dark:border-red-900/30 mt-8">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-600 rounded-full"></span>
              Danger Zone
            </h2>
            <p className="text-sm text-light-charcoal dark:text-lightgrey mb-6">
              Once you delete your account, there is no going back. This action
              will permanently delete your profile, comments, and personal
              information. Your submissions will be anonymized but retained for
              bounty integrity.
            </p>
            <button
              type="button"
              onClick={() => {
                const confirmed = confirm(
                  "Are you absolutely sure you want to delete your account? This action cannot be undone.\n\nType 'DELETE' to confirm:",
                );
                if (confirmed) {
                  const secondConfirm = prompt(
                    'Please type "DELETE" to confirm account deletion:',
                  );
                  if (secondConfirm === "DELETE") {
                    handleDeleteAccount();
                  } else {
                    // User did not confirm — do nothing
                  }
                }
              }}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Delete Account
            </button>
          </section> */}
        </main>
      </div>
    </Layout>
  );
}
