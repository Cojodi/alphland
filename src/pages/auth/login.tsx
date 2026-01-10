import Button from "@/components/Button/Button";
import Layout from "@/components/Layout";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

/**
 * Login Page - Google OAuth Only
 *
 * Simplified login page supporting only Google authentication.
 * Email/Password authentication has been moved to /auth/email-login for future use.
 *
 * Flow:
 * 1. User clicks "Continue with Google"
 * 2. Redirects to Google OAuth
 * 3. Google returns user info
 * 4. Better Auth auto-creates user if first time
 * 5. User is redirected to the app
 */
export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get redirect URL from query params, default to /bounty
  const redirectUrl = (router.query.redirect as string) || "/bounty";

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && !isPending) {
      router.push(redirectUrl);
    }
  }, [session, isPending, router, redirectUrl]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectUrl,
      });
    } catch (err: any) {
      setError(err.message || "Google sign in failed");
      setLoading(false);
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

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border-grey dark:border-dark-charcoal rounded-lg bg-white dark:bg-light-black hover:bg-smoked-white dark:hover:bg-hero-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
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

            {/* Info Text */}
            <p className="mt-6 text-center text-xs text-light-charcoal dark:text-lightgrey">
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </p>

            {/* Divider - Optional Email Login Link */}
            {process.env.NODE_ENV === "development" && (
              <>
                <div className="my-6 flex items-center">
                  <div className="flex-1 border-t border-border-grey dark:border-dark-charcoal"></div>
                  <span className="px-4 text-xs text-light-charcoal dark:text-lightgrey">
                    Development Only
                  </span>
                  <div className="flex-1 border-t border-border-grey dark:border-dark-charcoal"></div>
                </div>

                <button
                  onClick={() => router.push("/auth/email-login")}
                  className="w-full text-sm text-orange hover:text-orange/80 font-medium"
                >
                  Email/Password Login (Coming Soon)
                </button>
              </>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-xs text-light-charcoal dark:text-lightgrey">
              New to Alphland? Your account will be created automatically when
              you sign in with Google.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
