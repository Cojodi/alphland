"use client";

import Modal from "@/components/Modal/Modal";
import { X, Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { normalizeUrl } from "../utils/validators";

interface Work {
  id: string;
  title: string;
  description: string;
  skills: string[];
  link: string;
}

interface ProofOfWorkSectionProps {
  works?: Work[];
  username?: string;
  userId?: string;
  isOwnProfile?: boolean;
  onUpdate?: () => void;
}

const SKILL_OPTIONS = [
  "Frontend",
  "Backend",
  "Full-stack",
  "Smart Contracts",
  "Solidity",
  "Rust",
  "JavaScript",
  "TypeScript",
  "Python",
  "React",
  "Vue",
  "Node.js",
  "UI/UX Design",
  "Blockchain",
];

export function ProofOfWorkSection({
  works = [],
  username,
  userId,
  isOwnProfile = false,
  onUpdate,
}: ProofOfWorkSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newWork, setNewWork] = useState<Omit<Work, "id">>({
    title: "",
    description: "",
    skills: [],
    link: "",
  });
  const [skillInput, setSkillInput] = useState("");

  const isEmpty = works.length === 0;

  const openAddModal = () => {
    setEditingWork(null);
    setNewWork({
      title: "",
      description: "",
      skills: [],
      link: "",
    });
    setSkillInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (work: Work) => {
    setEditingWork(work);
    setNewWork({
      title: work.title,
      description: work.description,
      skills: work.skills,
      link: work.link,
    });
    setSkillInput("");
    setIsModalOpen(true);
  };

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !newWork.skills.includes(trimmedSkill)) {
      setNewWork((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill],
      }));
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setNewWork((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async () => {
    if (
      !newWork.title ||
      !newWork.description ||
      !newWork.link ||
      newWork.skills.length === 0
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (!userId || !username) {
      alert("User information is missing");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingWork
        ? `/api/proof-of-work/${editingWork.id}`
        : "/api/proof-of-work";
      const method = editingWork ? "PUT" : "POST";

      const payload = {
        user_id: userId,
        username,
        title: newWork.title,
        description: newWork.description,
        skills: newWork.skills,
        link: newWork.link,
      };

      console.log("Submitting proof of work:", payload);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save proof of work");
      }

      setIsModalOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error saving proof of work:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save proof of work",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this proof of work?")) {
      return;
    }

    try {
      const response = await fetch(`/api/proof-of-work/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete proof of work");
      }

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting proof of work:", error);
      alert("Failed to delete proof of work");
    }
  };

  return (
    <div className="bg-white dark:bg-hero-dark rounded-xl p-8 border border-border-grey dark:border-dark-charcoal">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Proof of Work
        </h2>
        {isOwnProfile && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-orange text-white rounded-lg font-medium hover:bg-orange/90 transition-colors"
          >
            <Plus size={18} />
            Add
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="py-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-smoked-white dark:bg-light-black rounded-full flex items-center justify-center">
            <div className="text-4xl text-light-charcoal dark:text-lightgrey">
              📋
            </div>
          </div>
          <p className="text-light-charcoal dark:text-lightgrey mb-6 text-lg">
            {isOwnProfile
              ? "Add some proof of work to build your profile"
              : "No proof of work yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {works.map((work) => (
            <div
              key={work.id}
              className="p-4 border border-border-grey dark:border-dark-charcoal rounded-lg hover:border-orange transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-black dark:text-white">
                  {work.title}
                </h3>
                {isOwnProfile && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(work)}
                      className="text-orange hover:text-orange/80 transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(work.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-light-charcoal dark:text-lightgrey mb-2">
                {work.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {work.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-orange/10 text-orange rounded text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <a
                href={work.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-orange hover:text-orange/80 transition-colors"
              >
                View Work →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-black dark:text-white mb-6">
            {editingWork ? "Edit" : "Add"} Proof of Work
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newWork.title}
                onChange={(e) =>
                  setNewWork((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Project Title"
                className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newWork.description}
                onChange={(e) =>
                  setNewWork((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your project"
                rows={4}
                maxLength={180}
                className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange"
              />
              <p className="text-xs text-light-charcoal dark:text-lightgrey mt-1 text-right">
                {180 - newWork.description.length} characters left
              </p>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                Skills <span className="text-red-500">*</span>
              </label>
              {/* Skill suggestions */}
              <div className="flex flex-wrap gap-2 mb-2">
                {SKILL_OPTIONS.filter(
                  (skill) => !newWork.skills.includes(skill),
                )
                  .slice(0, 8)
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
              {newWork.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {newWork.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange/10 text-orange rounded-full text-sm"
                    >
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Custom skill input */}
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                placeholder="Type a skill and press Enter"
                className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
              />
            </div>

            {/* Link */}
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                Link <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newWork.link}
                onChange={(e) =>
                  setNewWork((prev) => ({ ...prev, link: e.target.value }))
                }
                onBlur={(e) =>
                  setNewWork((prev) => ({
                    ...prev,
                    link: normalizeUrl(e.target.value),
                  }))
                }
                placeholder="https://example.com"
                className="w-full px-4 py-2 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-orange hover:bg-orange/90 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                style={{ color: "#FFFFFF" }}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingWork
                    ? "Update Proof of Work"
                    : "Add Proof of Work"}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-smoked-white dark:bg-light-black border-2 border-border-grey dark:border-dark-charcoal text-black dark:text-white hover:bg-border-grey dark:hover:bg-dark-charcoal rounded-lg transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
