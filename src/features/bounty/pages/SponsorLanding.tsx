"use client";

import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { Check, Users, Trophy, Megaphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const FEATURES = [
  {
    icon: Users,
    title: "Get Alephium Native Talent",
    description:
      "Instantly tap into a global network of skilled designers, developers, and creators eager to solve your problem.",
  },
  {
    icon: Trophy,
    title: "Results, Not Resumes",
    description:
      "Skip interviews and vetting headaches — reward based on actual work done, not just claims.",
  },
  {
    icon: Megaphone,
    title: "Turn Work Into Buzz",
    description:
      "Each bounty puts your project in front of the entire Alephium community of builders, creators, and early adopters.",
  },
];

export default function SponsorLanding() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [existingSponsor, setExistingSponsor] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if user already has a sponsor profile
  useEffect(() => {
    const checkSponsorStatus = async () => {
      if (!session?.user?.id) {
        setCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(`/api/sponsors/user/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setExistingSponsor(data.sponsor);
          // If user is already a sponsor, redirect to dashboard
          if (data.sponsor && !data.sponsor.is_banned) {
            router.push("/bounty/sponsor/dashboard");
          }
        }
      } catch (error) {
        console.error("Error checking sponsor status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (!isPending) {
      checkSponsorStatus();
    }
  }, [session?.user?.id, isPending, router]);

  const handlePostForFree = () => {
    if (!session?.user) {
      // Not logged in, redirect to login with redirect back
      router.push("/auth/login?redirect=/bounty/new/sponsor");
    } else if (existingSponsor?.is_banned) {
      // Banned sponsor
      toast.error(
        "Your sponsor account has been banned. Please contact support.",
      );
    } else if (existingSponsor) {
      // Already a sponsor, go to dashboard
      router.push("/bounty/sponsor/dashboard");
    } else {
      // Not a sponsor, go to create sponsor form
      router.push("/bounty/new/sponsor");
    }
  };

  if (isPending || checkingStatus) {
    return (
      <Layout title="Become a Sponsor - Alphland">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Become a Sponsor - Alphland"
      description="Post bounties and hire the best talent from the Alephium ecosystem"
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-smoked-white via-white to-clay/10 dark:from-light-black dark:via-hero-dark dark:to-dark-charcoal overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accessible-green/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black dark:text-white mb-6 leading-tight">
              Ship Faster With <span className="text-orange">Alephium</span>{" "}
              Freelancers
            </h1>
            <p className="text-lg sm:text-xl text-light-charcoal dark:text-lightgrey mb-10 max-w-2xl mx-auto">
              Access a global network of talented developers, designers, and
              creators ready to help build on Alephium.
            </p>

            <button
              onClick={handlePostForFree}
              className="inline-flex items-center gap-2 bg-orange hover:bg-orange/90 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              Post for Free
            </button>

            <p className="mt-6 text-sm text-light-charcoal dark:text-lightgrey">
              Trusted by Top Teams on Alephium
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="bg-smoked-white dark:bg-light-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">
              Why Choose Alphland?
            </h2>
            <p className="text-light-charcoal dark:text-lightgrey max-w-2xl mx-auto">
              The easiest way to find and hire talent from the Alephium
              ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-hero-dark rounded-xl p-8 border border-border-grey dark:border-dark-charcoal hover:border-orange/30 transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-12 h-12 bg-accessible-green/20 rounded-full flex items-center justify-center mb-6">
                  <Check className="w-6 h-6 text-accessible-green" />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-light-charcoal dark:text-lightgrey leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white dark:bg-hero-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                Create Your Profile
              </h3>
              <p className="text-light-charcoal dark:text-lightgrey">
                Set up your sponsor profile with your company details and start
                posting bounties immediately.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                Post a Bounty
              </h3>
              <p className="text-light-charcoal dark:text-lightgrey">
                Describe your project, set requirements, and define rewards.
                Your bounty goes live instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                Review & Reward
              </h3>
              <p className="text-light-charcoal dark:text-lightgrey">
                Receive submissions, review the work, and reward the best
                contributors directly.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handlePostForFree}
              className="inline-flex items-center gap-2 bg-orange hover:bg-orange/90 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-smoked-white dark:bg-light-black py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
              <h3 className="font-bold text-black dark:text-white mb-2">
                Is it free to post bounties?
              </h3>
              <p className="text-light-charcoal dark:text-lightgrey">
                Yes, creating a sponsor profile and posting bounties is
                completely free. You only pay the rewards you define for your
                bounties.
              </p>
            </div>

            <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
              <h3 className="font-bold text-black dark:text-white mb-2">
                How do I pay bounty winners?
              </h3>
              <p className="text-light-charcoal dark:text-lightgrey">
                Payments are made directly to the winner&apos;s wallet address.
                You can use ALPH or other supported tokens on the Alephium
                network.
              </p>
            </div>

            <div className="bg-white dark:bg-hero-dark rounded-lg p-6 border border-border-grey dark:border-dark-charcoal">
              <h3 className="font-bold text-black dark:text-white mb-2">
                Who can participate in bounties?
              </h3>
              <p className="text-light-charcoal dark:text-lightgrey">
                Anyone in the Alephium ecosystem can participate. We have
                developers, designers, content creators, and community builders
                ready to help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-hero-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Build with the Best?
          </h2>
          <p className="text-lightgrey mb-8 max-w-2xl mx-auto">
            Join the growing community of sponsors who are shipping faster with
            Alphland.
          </p>
          <button
            onClick={handlePostForFree}
            className="inline-flex items-center gap-2 bg-orange hover:bg-orange/90 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200"
          >
            Become a Sponsor
          </button>
        </div>
      </section>
    </Layout>
  );
}
