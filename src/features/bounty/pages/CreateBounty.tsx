import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "@/lib/auth-client";
import Layout from "@/components/Layout";
import Image from "next/image";
import { PenLine, ChevronDown, Sparkles } from "lucide-react";
import { toast } from "react-toastify";

export default function CreateBountyPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
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

  const handleManualCreate = () => {
    router.push("/bounty/create/manual");
  };

  const handleAIGenerate = () => {
    // V2 Feature - Coming Soon
    toast.info(
      "Coming Soon: AI-powered bounty generation will be available in V2!",
    );
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
              Create a comprehensive bounty listing for your project
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

          {/* Creation Options */}
          <div className="space-y-4">
            {/* Manual Creation */}
            <button
              onClick={handleManualCreate}
              className="w-full bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 hover:shadow-box-image-shadow-hover hover:border-orange dark:hover:border-orange transition-all duration-300 text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accessible-green/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-accessible-green/20 transition-colors">
                  <PenLine className="w-6 h-6 text-accessible-green" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-black dark:text-white font-barlow mb-2 group-hover:text-orange transition-colors">
                    Manual Creation
                  </h3>
                  <p className="text-sm text-light-charcoal dark:text-lightgrey font-barlow leading-relaxed">
                    Create your bounty with complete control over every detail
                    and requirement.
                  </p>
                </div>
              </div>
            </button>

            {/* AI Generation - V2 Feature */}
            <button
              onClick={handleAIGenerate}
              className="w-full bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6 transition-all duration-300 text-left relative overflow-hidden opacity-60 cursor-not-allowed"
            >
              {/* V2 Badge */}
              <div className="absolute top-3 right-3 bg-orange/10 text-orange text-xs font-bold px-2 py-1 rounded">
                COMING SOON
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-orange" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-black dark:text-white font-barlow mb-2">
                    AI Generate
                  </h3>
                  <p className="text-sm text-light-charcoal dark:text-lightgrey font-barlow leading-relaxed">
                    Let AI help you create a comprehensive bounty listing with
                    intelligent suggestions.
                  </p>
                </div>
              </div>
            </button>

            {/* Back to Dashboard */}
            <div className="pt-4">
              <button
                onClick={() => router.push("/bounty/sponsor/dashboard")}
                className="w-full px-6 py-3 text-left text-light-charcoal dark:text-lightgrey hover:text-orange dark:hover:text-orange font-barlow font-medium transition-colors flex items-center gap-3 rounded-lg hover:bg-white dark:hover:bg-hero-dark"
              >
                <span className="text-lg">←</span>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
