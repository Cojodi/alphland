"use client";

import Layout from "@/components/Layout";
import { Upload, X, Check } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useCallback } from "react";

interface FormData {
  name: string;
  description: string;
  website_url: string;
  twitter_handle: string;
}

interface PhotoFile {
  file: File;
  preview: string;
}

export default function CreateSponsorProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<PhotoFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    website_url: "",
    twitter_handle: "",
  });

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
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files)
      .filter(
        (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
      )
      .slice(0, 5 - photoFiles.length)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setPhotoFiles([...photoFiles, ...newFiles]);
  };

  const removePhoto = useCallback(
    (index: number) => {
      const newPhotoFiles = photoFiles.filter((_, i) => i !== index);
      setPhotoFiles(newPhotoFiles);
    },
    [photoFiles]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        // TODO: Implement Cloudflare API call
        console.log("Submitting sponsor profile:", formData, photoFiles);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Redirect to dashboard after successful creation
        router.push("/bounty/sponsor/dashboard");
      } catch (error) {
        console.error("Error creating sponsor profile:", error);
      } finally {
        setLoading(false);
      }
    },
    [formData, photoFiles, router]
  );

  return (
    <Layout
      title="Create Sponsor Profile - Alphland"
      description="Set up your organization profile to launch bounties"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-3">
            Create Sponsor Profile
          </h1>
          <p className="text-light-charcoal dark:text-lightgrey text-lg">
            Set up your organization profile to launch bounties and engage with
            talented developers.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-hero-dark rounded-lg border border-border-grey dark:border-dark-charcoal">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Organization Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-orange rounded-full"></div>
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                      Organization Information
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-black dark:text-white">
                      Organization Name <span className="text-orange">*</span>
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
                      className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange"
                      placeholder="Enter your organization or project name"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-black dark:text-white">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey resize-none focus:outline-none focus:ring-2 focus:ring-orange"
                      placeholder="Tell us about your organization or project"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-black dark:text-white">
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={formData.website_url}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            website_url: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-black dark:text-white">
                        Twitter Handle
                      </label>
                      <input
                        type="text"
                        value={formData.twitter_handle}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            twitter_handle: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white placeholder:text-light-charcoal dark:placeholder:text-lightgrey focus:outline-none focus:ring-2 focus:ring-orange"
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Photos */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-accessible-green rounded-full"></div>
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                      Profile Photos
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-light-charcoal dark:text-lightgrey">
                      Add up to 5 photos to showcase your organization
                      (Optional, max 5MB each)
                    </p>

                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                        dragActive
                          ? "border-orange bg-orange/5"
                          : "border-border-grey dark:border-dark-charcoal hover:border-orange/50 hover:bg-smoked-white dark:hover:bg-light-black/50"
                      }`}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex justify-center mb-4">
                          <div
                            className={`p-3 rounded-lg ${
                              dragActive
                                ? "bg-orange/10"
                                : "bg-smoked-white dark:bg-light-black"
                            }`}
                          >
                            <Upload
                              className={`w-6 h-6 ${
                                dragActive
                                  ? "text-orange"
                                  : "text-light-charcoal dark:text-lightgrey"
                              }`}
                            />
                          </div>
                        </div>
                        <p
                          className={`font-semibold mb-1 ${
                            dragActive
                              ? "text-orange"
                              : "text-black dark:text-white"
                          }`}
                        >
                          {dragActive
                            ? "Drop photos here"
                            : "Click to upload or drag photos here"}
                        </p>
                        <p className="text-sm text-light-charcoal dark:text-lightgrey">
                          PNG, JPG, GIF • {5 - photoFiles.length} photos
                          remaining
                        </p>
                      </label>
                    </div>
                  </div>

                  {photoFiles.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                        <Check className="w-4 h-4 text-accessible-green" />
                        {photoFiles.length} photo
                        {photoFiles.length !== 1 ? "s" : ""} ready to upload
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {photoFiles.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-28 object-cover rounded-lg border border-border-grey dark:border-dark-charcoal shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute top-2 right-2 bg-orange text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-semibold">
                              {Math.round(photo.file.size / 1024)}KB
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="space-y-6 border-t border-border-grey dark:border-dark-charcoal pt-6">
                  <div className="flex items-start gap-3 p-4 bg-smoked-white dark:bg-light-black rounded-lg">
                    <input
                      type="checkbox"
                      id="privacy"
                      defaultChecked
                      className="w-4 h-4 mt-1 rounded border-border-grey dark:border-dark-charcoal cursor-pointer"
                    />
                    <label
                      htmlFor="privacy"
                      className="text-sm text-light-charcoal dark:text-lightgrey cursor-pointer leading-relaxed"
                    >
                      I agree to keep my organization information accurate and
                      updated. By creating this profile, you consent to display
                      your information on the platform.
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-accessible-green hover:bg-accessible-green/90 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !formData.name}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Creating Profile...
                      </div>
                    ) : (
                      "Create Sponsor Profile"
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
