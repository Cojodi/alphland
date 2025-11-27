import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "@/lib/auth-client";
import Layout from "@/components/Layout";
import Image from "next/image";
import { Sparkles, PenLine, ChevronDown } from "lucide-react";

type CreationMethod = "generate" | "scratch" | null;

export default function CreateBountyPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [selectedMethod, setSelectedMethod] = useState<CreationMethod>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sponsor, setSponsor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSponsorData() {
      if (!session?.user?.id) {
        setLoading(false);
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
        setLoading(false);
      }
    }

    if (!isPending) {
      fetchSponsorData();
    }
  }, [session, isPending, router]);

  const handleMethodSelect = (method: CreationMethod) => {
    setSelectedMethod(method);
    setShowDropdown(false);

    // Navigate to the appropriate creation flow
    if (method === "generate") {
      router.push("/bounty/create/generate");
    } else if (method === "scratch") {
      router.push("/bounty/create/manual");
    }
  };

  if (loading || isPending) {
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

  return (
    <Layout title="Create Bounty - Alphland">
      <div className="min-h-screen bg-smoked-white dark:bg-light-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-black dark:text-white font-barlow mb-4">
              Create New Bounty
            </h1>
            <p className="text-lg text-light-charcoal dark:text-lightgrey font-barlow">
              Choose how you&apos;d like to create your bounty listing
            </p>
          </div>

          {/* Sponsor Info Card */}
          <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 mb-8">
            <div className="flex items-center gap-4">
              {sponsor.logo_url ? (
                <Image
                  src={sponsor.logo_url}
                  alt={sponsor.name}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-orange/10 rounded-lg flex items-center justify-center">
                  <span className="text-orange font-bold font-barlow text-lg">
                    {sponsor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-black dark:text-white font-barlow">
                  {sponsor.name}
                </h2>
                <p className="text-sm text-light-charcoal dark:text-lightgrey font-barlow">
                  Sponsor Account
                </p>
              </div>
              <ChevronDown className="w-5 h-5 text-light-charcoal dark:text-lightgrey" />
            </div>
          </div>

          {/* Main Creation Button with Dropdown */}
          <div className="space-y-4">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-orange hover:bg-orange/90 text-white font-barlow font-semibold px-8 py-4 text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <span className="text-2xl">+</span>
                Create New Listing
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal shadow-2xl overflow-hidden z-10">
                  {/* Generate with AI */}
                  <button
                    onClick={() => handleMethodSelect("generate")}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-orange/5 dark:hover:bg-orange/10 transition-colors border-b border-border-grey dark:border-dark-charcoal group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-orange/20 to-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-orange" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-black dark:text-white font-barlow group-hover:text-orange transition-colors">
                        Generate with AI
                      </div>
                      <div className="text-sm text-light-charcoal dark:text-lightgrey font-barlow">
                        Let AI help you create a comprehensive bounty
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-accessible-green/20 text-accessible-green rounded-full text-xs font-medium font-barlow">
                      2m
                    </div>
                  </button>

                  {/* Start from Scratch */}
                  <button
                    onClick={() => handleMethodSelect("scratch")}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-orange/5 dark:hover:bg-orange/10 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-light-charcoal/20 to-light-charcoal/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PenLine className="w-5 h-5 text-light-charcoal dark:text-lightgrey" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-black dark:text-white font-barlow group-hover:text-orange transition-colors">
                        Start from Scratch
                      </div>
                      <div className="text-sm text-light-charcoal dark:text-lightgrey font-barlow">
                        Create a bounty manually with full control
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-orange/20 text-orange rounded-full text-xs font-medium font-barlow">
                      10m
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Additional Options */}
            <div className="space-y-3 pt-4">
              <button
                onClick={() => router.push("/bounty/sponsor/dashboard")}
                className="w-full px-6 py-3 text-left text-light-charcoal dark:text-lightgrey hover:text-orange dark:hover:text-orange font-barlow font-medium transition-colors flex items-center gap-3 rounded-lg hover:bg-white dark:hover:bg-hero-dark"
              >
                <span className="text-lg">←</span>
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6">
              <div className="w-12 h-12 bg-orange/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-orange" />
              </div>
              <h3 className="text-lg font-semibold text-black dark:text-white font-barlow mb-2">
                AI-Powered Creation
              </h3>
              <p className="text-sm text-light-charcoal dark:text-lightgrey font-barlow leading-relaxed">
                Our AI helps you create professional bounty listings by asking
                the right questions and structuring your requirements.
              </p>
            </div>

            <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6">
              <div className="w-12 h-12 bg-accessible-green/10 rounded-lg flex items-center justify-center mb-4">
                <PenLine className="w-6 h-6 text-accessible-green" />
              </div>
              <h3 className="text-lg font-semibold text-black dark:text-white font-barlow mb-2">
                Full Control
              </h3>
              <p className="text-sm text-light-charcoal dark:text-lightgrey font-barlow leading-relaxed">
                Manually create your bounty with complete control over every
                detail and requirement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
