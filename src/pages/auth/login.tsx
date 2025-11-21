"use client";

import Button from "@/components/Button/Button";
import Layout from "@/components/Layout";
import {
  authClient,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  useSession,
} from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

/**
 * Login/Sign Up Page for Bounty System
 *
 * Authentication Flow:
 * 1. User submits form → authClient sends request to /api/auth/*
 * 2. Next.js rewrites proxy the request to Cloudflare Worker (localhost:8787)
 * 3. Worker handles auth with Better Auth → writes to D1 database
 * 4. Cookie is set on localhost:3000 domain (via proxy)
 * 5. User is redirected to /bounty/profile/edit
 *
 * Google OAuth Flow:
 * 1. User clicks Google button → redirect to Google
 * 2. Google redirects to /api/auth/callback/google (on localhost:3000)
 * 3. Next.js proxies to worker → worker validates token → creates session
 * 4. Worker redirects to callbackURL (/bounty)
 */
export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && !isPending) {
      router.push("/bounty/profile/edit");
    }
  }, [session, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        // Sign up with email/password
        const result = await signUpWithEmail(email, password, name);

        if (!result.success) {
          throw new Error((result.error as any)?.message || "Sign up failed");
        }

        // Show success message
        setError(
          "Account created! Please check your email to verify your account."
        );
        setIsSignUp(false);
      } else {
        // Sign in with email/password
        const result = await signInWithEmail(email, password);

        if (!result.success) {
          throw new Error((result.error as any)?.message || "Sign in failed");
        }

        // Redirect will happen via useEffect when session updates
        // Or force redirect after successful login
        router.push("/bounty/profile/edit");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Use authClient.signIn.social - this will redirect to Google
      // After Google auth, it will callback to /api/auth/callback/google
      // which gets proxied to the worker, then redirects to callbackURL
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/bounty/profile/edit", // Final redirect after successful auth
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
      title={isSignUp ? "Sign Up" : "Login"}
      description="Login or sign up to access bounties"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-black dark:text-white">
              {isSignUp ? "Create your account" : "Sign in to your account"}
            </h2>
            <p className="mt-2 text-center text-sm text-light-charcoal dark:text-lightgrey">
              {isSignUp
                ? "Already have an account? "
                : "Don't have an account? "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="font-medium text-orange hover:text-orange/80"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>

          <div className="bg-white dark:bg-hero-dark rounded-xl p-8 border border-border-grey dark:border-dark-charcoal">
            {error && (
              <div
                className={`mb-4 p-3 rounded ${
                  error.includes("check your email")
                    ? "bg-accessible-green/10 text-accessible-green border border-accessible-green"
                    : "bg-red-500/10 text-red-500 border border-red-500"
                }`}
              >
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {isSignUp && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-black dark:text-white mb-2"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-border-grey dark:border-dark-charcoal rounded-lg bg-smoked-white dark:bg-light-black text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-black dark:text-white mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-border-grey dark:border-dark-charcoal rounded-lg bg-smoked-white dark:bg-light-black text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-black dark:text-white mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-border-grey dark:border-dark-charcoal rounded-lg bg-smoked-white dark:bg-light-black text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Loading..." : isSignUp ? "Sign up" : "Sign in"}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-grey dark:border-dark-charcoal"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-hero-dark text-light-charcoal dark:text-lightgrey">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2 border border-border-grey dark:border-dark-charcoal rounded-lg bg-white dark:bg-light-black hover:bg-smoked-white dark:hover:bg-hero-dark transition-colors disabled:opacity-50"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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
                  <span className="text-black dark:text-white">Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
