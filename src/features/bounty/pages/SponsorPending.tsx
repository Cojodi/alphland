"use client";

import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { Clock, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function SponsorPending() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Redirect if not logged in
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth/login?redirect=/bounty/sponsor");
    }
  }, [session, isPending, router]);

  // TODO: Check actual sponsor application status from API
  // If approved, redirect to dashboard
  // If rejected, show rejection message
  // If no application, redirect to sponsor form

  if (isPending) {
    return (
      <Layout title="Application Pending - Alphland">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Application Pending - Alphland"
      description="Your sponsor application is under review"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto text-center">
          {/* Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-orange/10 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-orange" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
            Application Under Review
          </h1>

          {/* Description */}
          <p className="text-light-charcoal dark:text-lightgrey mb-8 leading-relaxed">
            Thank you for applying to become a sponsor on Alphland! Our team is
            reviewing your application and will get back to you soon.
          </p>

          {/* Status Card */}
          <div className="bg-white dark:bg-hero-dark rounded-lg border border-border-grey dark:border-dark-charcoal p-6 mb-8">
            <h2 className="font-semibold text-black dark:text-white mb-4">
              What happens next?
            </h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accessible-green/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-accessible-green" />
                </div>
                <div>
                  <p className="font-medium text-black dark:text-white text-sm">
                    Application Submitted
                  </p>
                  <p className="text-xs text-light-charcoal dark:text-lightgrey">
                    Your information has been received
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-orange" />
                </div>
                <div>
                  <p className="font-medium text-black dark:text-white text-sm">
                    Under Review
                  </p>
                  <p className="text-xs text-light-charcoal dark:text-lightgrey">
                    Our team is reviewing your application (1-3 business days)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-smoked-white dark:bg-light-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-light-charcoal dark:text-lightgrey" />
                </div>
                <div>
                  <p className="font-medium text-light-charcoal dark:text-lightgrey text-sm">
                    Email Notification
                  </p>
                  <p className="text-xs text-light-charcoal dark:text-lightgrey">
                    You&apos;ll receive an email once approved
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <p className="text-sm text-light-charcoal dark:text-lightgrey mb-6">
            Have questions? Contact us via{" "}
            <a
              href="mailto:alph.land@alephium.org"
              className="text-orange hover:underline"
            >
              alph.land@alephium.org{" "}
            </a>{" "}
          </p>

          {/* Back Button */}
          <Link href="/bounty">
            <a className="inline-block bg-smoked-white dark:bg-light-black hover:bg-border-grey dark:hover:bg-dark-charcoal text-black dark:text-white font-medium py-2.5 px-6 rounded-lg transition-colors border border-border-grey dark:border-dark-charcoal">
              Back to Bounties
            </a>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
