"use client";

import Layout from "@/components/Layout";
import Modal from "@/components/Modal/Modal";
import { useSession } from "@/lib/auth-client";
import { X, Plus, Upload } from "lucide-react";
import Image from "next/image";
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

interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  subSkills: string[];
  link: string;
}

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
  projects: Project[];
  skills: string[];
  keepPrivate: boolean;
}

export default function EditProfile() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newProject, setNewProject] = useState<Omit<Project, "id">>({
    title: "",
    description: "",
    skills: [],
    subSkills: [],
    link: "",
  });
  const [projectSkillInput, setProjectSkillInput] = useState("");
  const [projectSubSkillInput, setProjectSubSkillInput] = useState("");

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
    projects: [],
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
          const projects = profile.projects ? JSON.parse(profile.projects) : [];

          // Split name into first and last
          const nameParts = (profile.name || "").split(" ");

          setFormData((prev) => ({
            ...prev,
            username: profile.username || "",
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            bio: profile.bio || "",
            alphWalletAddress: profile.wallet_address || "",
            profilePicturePreview: profile.image || null,
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
            projects,
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
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialChange = (
    platform: keyof FormData["socials"],
    value: string
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
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
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
    country.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Project modal functions
  const openProjectModal = () => {
    setNewProject({
      title: "",
      description: "",
      skills: [],
      subSkills: [],
      link: "",
    });
    setProjectSkillInput("");
    setProjectSubSkillInput("");
    setIsProjectModalOpen(true);
  };

  const addProjectSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !newProject.skills.includes(trimmedSkill)) {
      setNewProject((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill],
      }));
    }
    setProjectSkillInput("");
  };

  const removeProjectSkill = (skill: string) => {
    setNewProject((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addProjectSubSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !newProject.subSkills.includes(trimmedSkill)) {
      setNewProject((prev) => ({
        ...prev,
        subSkills: [...prev.subSkills, trimmedSkill],
      }));
    }
    setProjectSubSkillInput("");
  };

  const removeProjectSubSkill = (skill: string) => {
    setNewProject((prev) => ({
      ...prev,
      subSkills: prev.subSkills.filter((s) => s !== skill),
    }));
  };

  const handleAddProject = () => {
    if (
      !newProject.title ||
      !newProject.description ||
      !newProject.link ||
      newProject.skills.length === 0 ||
      newProject.subSkills.length === 0
    ) {
      alert("Please fill in all required fields");
      return;
    }
    const project: Project = {
      ...newProject,
      id: Date.now().toString(),
    };
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, project],
    }));
    setIsProjectModalOpen(false);
  };

  const removeProject = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const bioCharactersLeft = 150 - formData.bio.length;
  const projectDescCharactersLeft = 180 - newProject.description.length;

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
      !formData.alphWalletAddress ||
      !formData.socials.github
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
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
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
          skills: formData.skills,
          web3_interests: formData.web3Interests,
          projects: formData.projects,
        }),
      });

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
          : "Failed to update profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
                        <Image
                          src={formData.profilePicturePreview}
                          alt="Profile"
                          width={80}
                          height={80}
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
                    GitHub <span className="text-red-500">*</span>
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
                      required
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

            {/* Proof of Work Section */}
            <section className="bg-white dark:bg-hero-dark rounded-lg p-6 sm:p-8 border border-border-grey dark:border-dark-charcoal">
              <h2 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>
                Proof of Work
              </h2>

              <p className="text-sm text-light-charcoal dark:text-lightgrey mb-4">
                Add projects you&apos;ve worked on to showcase your experience
              </p>

              {/* Existing Projects */}
              {formData.projects.length > 0 && (
                <div className="space-y-4 mb-6">
                  {formData.projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 bg-smoked-white dark:bg-light-black rounded-lg border border-border-grey dark:border-dark-charcoal"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-black dark:text-white">
                            {project.title}
                          </h3>
                          <p className="text-sm text-light-charcoal dark:text-lightgrey mt-1">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-1 bg-orange/10 text-orange rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-orange hover:underline mt-2 inline-block"
                          >
                            {project.link}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProject(project.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={openProjectModal}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white hover:border-orange transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Project
              </button>
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
                    (skill) => !formData.skills.includes(skill)
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
        </main>
      </div>

      {/* Add Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      >
        <div className="p-6">
          <h3 className="text-xl font-bold text-black mb-6">Add Project</h3>

          <div className="space-y-4">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newProject.title}
                onChange={(e) =>
                  setNewProject((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Project Title"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) =>
                  setNewProject((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Project Description"
                rows={4}
                maxLength={180}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-black resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {projectDescCharactersLeft} characters left
              </p>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Skills <span className="text-red-500">*</span>
              </label>
              {newProject.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {newProject.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeProjectSkill(skill)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={projectSkillInput}
                onChange={(e) => setProjectSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addProjectSkill(projectSkillInput);
                  }
                }}
                placeholder="Select..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sub Skills */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Sub Skills <span className="text-red-500">*</span>
              </label>
              {newProject.subSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {newProject.subSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeProjectSubSkill(skill)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={projectSubSkillInput}
                onChange={(e) => setProjectSubSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addProjectSubSkill(projectSubSkillInput);
                  }
                }}
                placeholder="Select..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Link */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={newProject.link}
                onChange={(e) =>
                  setNewProject((prev) => ({ ...prev, link: e.target.value }))
                }
                placeholder="https://example.com"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Project Button */}
            <button
              type="button"
              onClick={handleAddProject}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Add Project
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
