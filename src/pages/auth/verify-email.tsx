import Button from "@/components/Button/Button";
import Layout from "@/components/Layout";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useState } from "react";

/**
 * Email Verification Page
 *
 * Shown after user signs up
 * Displays instructions to check email
 * Provides "Resend Email" button
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const { email } = router.query;
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleResendEmail = async () => {
    if (!email || typeof email !== "string") {
      setResendMessage("❌ Email address not found. Please sign up again.");
      return;
    }

    setResendLoading(true);
    setResendMessage("");

    try {
      // Call Better Auth's resend verification email endpoint
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      if (response.ok) {
        setResendMessage(
          "✅ Verification email sent! Please check your inbox and spam folder.",
        );
      } else {
        const error = await response.json();
        setResendMessage(
          `❌ Failed to send email: ${error.message || "Please try again later."}`,
        );
      }
    } catch (error) {
      console.error("Resend email error:", error);
      setResendMessage(
        "❌ Network error. Please check your connection and try again.",
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Layout
      title="Verify Your Email"
      description="Please check your email to verify your account"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {/* Email Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-accessible-green/10 mb-6">
              <svg
                className="h-8 w-8 text-accessible-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-extrabold text-black dark:text-white">
              Check Your Email
            </h2>
            <p className="mt-4 text-sm text-light-charcoal dark:text-lightgrey">
              We&apos;ve sent a verification link to{" "}
              <span className="font-medium text-black dark:text-white">
                {email || "your email address"}
              </span>
            </p>
            <p className="mt-2 text-sm text-light-charcoal dark:text-lightgrey">
              Please check your inbox (and spam folder) and click the
              verification link to complete your registration.
            </p>
          </div>

          <div className="bg-white dark:bg-hero-dark rounded-xl p-6 border border-border-grey dark:border-dark-charcoal space-y-4">
            {/* Resend Email Section */}
            <div className="text-center">
              <p className="text-sm text-light-charcoal dark:text-lightgrey mb-4">
                Didn&apos;t receive the email?
              </p>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={resendLoading}
                onClick={handleResendEmail}
              >
                {resendLoading ? "Sending..." : "Resend Verification Email"}
              </Button>

              {resendMessage && (
                <div
                  className={`mt-4 p-3 rounded text-sm ${
                    resendMessage.includes("✅")
                      ? "bg-accessible-green/10 text-accessible-green border border-accessible-green"
                      : "bg-red-500/10 text-red-500 border border-red-500"
                  }`}
                >
                  {resendMessage}
                </div>
              )}
            </div>

            {/* Helpful Tips */}
            <div className="pt-4 border-t border-border-grey dark:border-dark-charcoal">
              <p className="text-xs text-light-charcoal dark:text-lightgrey mb-2">
                Tips:
              </p>
              <ul className="text-xs text-light-charcoal dark:text-lightgrey space-y-1">
                <li>• Check your spam or junk folder</li>
                <li>• Add alph.land@alephium.org to your contacts</li>
                <li>• The verification link expires in 24 hours</li>
              </ul>
            </div>

            {/* Back to Login */}
            <div className="pt-4 text-center">
              <button
                onClick={() => router.push("/auth/login")}
                className="text-sm text-orange hover:text-orange/80 font-medium"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
