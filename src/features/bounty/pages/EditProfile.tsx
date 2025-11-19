"use client";

import Layout from "@/components/Layout";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface FormData {
  profilePicture: File | null;
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  socials: {
    youtube: string;
    twitter: string;
    github: string;
    linkedin: string;
    telegram: string;
    website: string;
  };
  web3Interests: string;
  communities: string[];
  workExperience: string;
  location: string;
  web3Familiarity: string;
  workPreference: string;
  currentEmployer: string;
  skills: string[];
  keepPrivate: boolean;
}

export default function EditProfile() {
  const [formData, setFormData] = useState<FormData>({
    profilePicture: null,
    username: "yy",
    firstName: "Yuanying",
    lastName: "Li",
    bio: "A full-stack dev who loves hackathons.",
    socials: {
      youtube: "yardize_yankee",
      twitter: "x.com/",
      github: "github.com/",
      linkedin: "linkedin.com/",
      telegram: "t.me/",
      website: "https://takashidesign.com",
    },
    web3Interests: "",
    communities: ["Superhuman Germany"],
    workExperience: "2 to 5 Years",
    location: "Germany",
    web3Familiarity: "Contributing regularly",
    workPreference: "Freelance",
    currentEmployer: "J_Navi",
    skills: [
      "Frontend",
      "React",
      "Backend",
      "Javascript",
      "Python",
      "C++",
      "Solidity",
      "Rust",
      "MongoDB",
      "Blockchain",
    ],
    keepPrivate: true,
  });

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

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const removeCommunity = (community: string) => {
    setFormData((prev) => ({
      ...prev,
      communities: prev.communities.filter((c) => c !== community),
    }));
  };

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

          <form className="space-y-8">
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
                      <Image
                        src="/user-avatar.jpg"
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 border-2 border-dashed border-border-grey dark:border-dark-charcoal rounded-lg p-4 text-center cursor-pointer hover:border-orange transition-colors">
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
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                </div>

                {/* First and Last Name */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
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
                    className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange"
                  />
                  <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1">
                    150 characters left
                  </p>
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
                  Skills Needed *
                </label>
                <p className="text-xs text-light-charcoal dark:text-lightgrey mb-4">
                  We will send notifications about new listings for your
                  selected skills
                </p>
                <div className="flex flex-wrap gap-2">
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
                <input
                  type="text"
                  placeholder="Add more skills"
                  className="mt-4 w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
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
                  className="bg-accessible-green hover:bg-accessible-green/90 text-white font-semibold px-8 py-2 rounded-lg transition-colors"
                >
                  Update Profile
                </button>
                <button
                  type="button"
                  className="border border-border-grey dark:border-dark-charcoal text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black px-8 py-2 rounded-lg bg-transparent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </section>
          </form>
        </main>
      </div>
    </Layout>
  );
}
