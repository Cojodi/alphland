"use client";

import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { X, Upload } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

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

const SKILL_OPTIONS = [
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
  "UI/UX Design",
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
  firstName: string;
  lastName: string;
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
  skills: string[];
  keepPrivate: boolean;
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
    firstName: "",
    lastName: "",
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
    skills: [],
    keepPrivate: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const data = await response.json();
          const profile = data.user;

          // Parse JSON fields
          const skills = profile.skills ? JSON.parse(profile.skills) : [];
          const web3Interests = profile.web3_interests
            ? JSON.parse(profile.web3_interests)
            : [];

          // Get first_name and last_name from profile, fallback to splitting name
          let firstName = profile.first_name || "";
          let lastName = profile.last_name || "";

          // Fallback: if no first/last name in profile, try splitting the name field
          if (!firstName && !lastName && profile.name) {
            const nameParts = profile.name.split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
          }

          setFormData((prev) => ({
            ...prev,
            username: profile.username || "",
            firstName,
            lastName,
            bio: profile.bio || "",
            alphWalletAddress: profile.wallet_address || "",
            // Keep the current preview if user has selected a new image, otherwise use profile image
            profilePicturePreview: prev.profilePicture
              ? prev.profilePicturePreview
              : profile.image || null,
            socials: {
              discord: profile.discord_username || "",
              twitter: profile.twitter_username || "",
              github: profile.github_username || "",
              linkedin: profile.linkedin_username || "",
              telegram: profile.telegram_username || "",
              website: profile.website || "",
            },
            location: profile.location || "",
            web3Familiarity: profile.web3_familiarity || "",
            workPreference: profile.work_preference || "",
            currentEmployer: profile.current_employer || "",
            skills,
            web3Interests,
          }));

          if (profile.location) {
            setLocationSearch(profile.location);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [session]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
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
        alert("File size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
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
        alert("Failed to read the image file. Please try again.");
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
        alert("File size must be less than 5MB");
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
    if (trimmedSkill && !formData.skills.includes(trimmedSkill)) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      alert("Please log in to update your profile");
      router.push("/auth/login");
      return;
    }

    // Validate required fields
    if (
      !formData.username ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.alphWalletAddress
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.skills.length === 0) {
      alert("Please add at least one skill");
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
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
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
      alert(
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
      alert("You must be logged in to delete your account");
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

      alert(
        "Your account has been successfully deleted. You will be redirected to the homepage.",
      );

      // Log out the user and redirect to homepage
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert(
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
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>

                {/* First and Last Name */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      required
                      className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      required
                      className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
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
                    Alph Wallet Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="alphWalletAddress"
                    value={formData.alphWalletAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your Alephium wallet address"
                    required
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange font-mono text-sm"
                  />
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
                </label>
                <p className="text-xs text-light-charcoal dark:text-lightgrey mb-4">
                  We will send notifications about new listings for your
                  selected skills. Type any skill and press Enter to add.
                </p>

                {/* Skill suggestions */}
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
                  placeholder="Type a skill and press Enter to add"
                  className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>
            </section>

            {/* Submit Buttons */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.keepPrivate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      keepPrivate: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-border-grey dark:border-dark-charcoal"
                />
                <label className="text-sm text-black dark:text-white cursor-pointer">
                  Keep my info private
                </label>
              </div>

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
                    alert("Account deletion cancelled.");
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
