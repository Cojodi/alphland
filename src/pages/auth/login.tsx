import Layout from "@/components/Layout";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

/**
 * Login Page - Google OAuth + Email OTP
 *
 * Flow:
 * 1. User picks Google → OAuth redirect
 * 2. User picks Email OTP → enter email → "Send Code" → enter 6-digit OTP → verify → redirect
 */
export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Email OTP state
  const [otpStep, setOtpStep] = useState<"idle" | "enterEmail" | "enterOtp">(
    "idle",
  );
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Get redirect URL from query params, default to /bounty
  const redirectUrl = (router.query.redirect as string) || "/bounty";

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && !isPending) {
      router.push(redirectUrl);
    }
  }, [session, isPending, router, redirectUrl]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectUrl,
      });
    } catch (err: any) {
      setError(err.message || "Google sign in failed");
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOtpLoading(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (result.error) {
        setError(result.error.message || "Failed to send code");
      } else {
        setOtpStep("enterOtp");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send code");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOtpLoading(true);
    try {
      const result = await authClient.signIn.emailOtp({
        email,
        otp,
      });
      if (result.error) {
        setError(result.error.message || "Invalid code");
      } else {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  // Show loading while checking session
  if (isPending) {
    return (
      <Layout title="Loading..." description="Checking authentication status">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="text-black dark:text-white">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Sign In"
      description="Sign in to access Alphland bounties and features"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-black dark:text-white">
              Welcome to Alphland
            </h2>
            <p className="mt-2 text-sm text-light-charcoal dark:text-lightgrey">
              Sign in to access bounties and participate in the Alephium
              ecosystem
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-hero-dark rounded-xl p-8 border border-border-grey dark:border-dark-charcoal">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 rounded bg-red-500/10 text-red-500 border border-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading || otpLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border-grey dark:border-dark-charcoal rounded-lg bg-white dark:bg-light-black hover:bg-smoked-white dark:hover:bg-hero-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-black dark:text-white">
                    Connecting...
                  </span>
                </div>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-black dark:text-white font-medium">
                    Continue with Google
                  </span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-border-grey dark:border-dark-charcoal"></div>
              <span className="px-4 text-xs text-light-charcoal dark:text-lightgrey">
                or
              </span>
              <div className="flex-1 border-t border-border-grey dark:border-dark-charcoal"></div>
            </div>

            {/* Email OTP */}
            {otpStep === "idle" && (
              <button
                onClick={() => {
                  setError("");
                  setOtpStep("enterEmail");
                }}
                disabled={googleLoading}
                className="w-full px-4 py-3 border border-border-grey dark:border-dark-charcoal rounded-lg bg-white dark:bg-light-black hover:bg-smoked-white dark:hover:bg-hero-dark transition-colors text-black dark:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue with Email
              </button>
            )}

            {otpStep === "enterEmail" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-border-grey dark:border-dark-charcoal bg-white dark:bg-light-black text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full px-4 py-3 rounded-lg bg-orange hover:bg-orange/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Sending...
                    </span>
                  ) : (
                    "Send Code"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep("idle");
                    setError("");
                  }}
                  className="w-full text-sm text-light-charcoal dark:text-lightgrey hover:text-black dark:hover:text-white"
                >
                  Back
                </button>
              </form>
            )}

            {otpStep === "enterOtp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-sm text-light-charcoal dark:text-lightgrey">
                  A 6-digit code was sent to{" "}
                  <span className="text-black dark:text-white font-medium">
                    {email}
                  </span>
                  . Enter it below.
                </p>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">
                    Verification code
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="w-full px-4 py-3 rounded-lg border border-border-grey dark:border-dark-charcoal bg-white dark:bg-light-black text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange/50 text-center text-2xl tracking-widest"
                  />
                </div>
                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="w-full px-4 py-3 rounded-lg bg-orange hover:bg-orange/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Verifying...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep("enterEmail");
                    setOtp("");
                    setError("");
                  }}
                  className="w-full text-sm text-light-charcoal dark:text-lightgrey hover:text-black dark:hover:text-white"
                >
                  Resend code
                </button>
              </form>
            )}

            {/* Info Text */}
            {otpStep === "idle" && (
              <p className="mt-6 text-center text-xs text-light-charcoal dark:text-lightgrey">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-xs text-light-charcoal dark:text-lightgrey">
              New to Alphland? Your account will be created automatically when
              you sign in.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
