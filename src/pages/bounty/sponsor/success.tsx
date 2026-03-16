import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { CheckCircle, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SponsorSuccess() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [sponsor, setSponsor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSponsor() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/sponsors/user/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setSponsor(data.sponsor);
        }
      } catch (error) {
        console.error("Error fetching sponsor:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!isPending) {
      fetchSponsor();
    }
  }, [session?.user?.id, isPending]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth/login?redirect=/bounty/sponsor");
    }
  }, [isPending, session, router]);

  if (isPending || loading) {
    return (
      <Layout title="Success - Alphland">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent" />
        </div>
      </Layout>
    );
  }

  // If no sponsor found, redirect to create
  if (!sponsor) {
    return (
      <Layout title="Success - Alphland">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <p className="text-light-charcoal dark:text-lightgrey">
              No sponsor profile found. Please create one first.
            </p>
            <Link href="/bounty/new/sponsor">
              <a className="inline-block bg-orange hover:bg-orange/90 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
                Create Sponsor Profile
              </a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Congratulations - Alphland">
      <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="bg-white dark:bg-hero-dark rounded-2xl border border-border-grey dark:border-dark-charcoal p-8 sm:p-12 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-accessible-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-accessible-green" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-black dark:text-white font-barlow mb-4">
              Congratulations!
            </h1>

            {/* Message */}
            <p className="text-lg text-light-charcoal dark:text-lightgrey font-barlow mb-2">
              You&apos;re now a sponsor on Alphland
            </p>
            <p className="text-light-charcoal dark:text-lightgrey font-barlow mb-8">
              Welcome,{" "}
              <span className="text-orange font-semibold">{sponsor.name}</span>!
              Your sponsor profile has been created successfully. You can now
              create bounties and manage submissions.
            </p>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link href="/bounty/sponsor/dashboard">
                <a className="w-full bg-orange hover:bg-orange/90 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 font-barlow">
                  Go to Sponsor Dashboard
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Link>

              <Link href="/bounty/create">
                <a className="w-full border-2 border-orange text-orange hover:bg-orange/5 font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 font-barlow">
                  <Plus className="w-5 h-5" />
                  Create Your First Bounty
                </a>
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-border-grey dark:border-dark-charcoal">
              <p className="text-sm text-light-charcoal dark:text-lightgrey font-barlow">
                Need help getting started?{" "}
                <Link href="/bounty">
                  <a className="text-orange hover:underline">
                    Browse existing bounties
                  </a>
                </Link>{" "}
                for inspiration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
