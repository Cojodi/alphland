/**
 * Account Linking Page
 * Shown when user needs to confirm account linking after OAuth attempt
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Button from "@/components/Button/Button";
import {
  getAccountLinkRequest,
  confirmAccountLink,
  rejectAccountLink,
  getProviderDisplayName,
} from "@/lib/account-linking-client";

export default function LinkAccountPage() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [linkRequest, setLinkRequest] = useState<any>(null);

  useEffect(() => {
    if (token && typeof token === "string") {
      loadLinkRequest(token);
    }
  }, [token]);

  const loadLinkRequest = async (tokenStr: string) => {
    try {
      setLoading(true);
      setError("");
      const request = await getAccountLinkRequest(tokenStr);

      if (!request) {
        setError("Link request not found or has expired");
        return;
      }

      setLinkRequest(request);
    } catch (err) {
      console.error("Error loading link request:", err);
      setError("Failed to load account linking request");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!token || typeof token !== "string") return;

    try {
      setProcessing(true);
      setError("");
      await confirmAccountLink(token);

      // Success - redirect to login
      router.push("/auth/login?linked=true");
    } catch (err: any) {
      console.error("Error confirming link:", err);
      setError(err.message || "Failed to link accounts");
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!token || typeof token !== "string") return;

    try {
      setProcessing(true);
      await rejectAccountLink(token);

      // Redirect back to login
      router.push("/auth/login");
    } catch (err) {
      console.error("Error rejecting link:", err);
      router.push("/auth/login");
    }
  };

  if (loading) {
    return (
      <Layout title="Link Account" description="Linking your account">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="text-black dark:text-white">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error && !linkRequest) {
    return (
      <Layout title="Link Account" description="Account linking error">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full bg-white dark:bg-hero-dark rounded-xl p-8 border border-border-grey dark:border-dark-charcoal">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-black dark:text-white mb-2">
                Link Request Not Found
              </h2>
              <p className="text-light-charcoal dark:text-lightgrey mb-6">
                {error}
              </p>
              <Button
                onClick={() => router.push("/auth/login")}
                variant="primary"
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!linkRequest) {
    return null;
  }

  const existingProviderName = getProviderDisplayName(
    linkRequest.pending_provider_id === "google" ? "credential" : "google",
  );
  const attemptedProviderName = getProviderDisplayName(
    linkRequest.pending_provider_id,
  );

  return (
    <Layout title="Link Account" description="Link your accounts">
      <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white dark:bg-hero-dark rounded-xl p-8 border border-border-grey dark:border-dark-charcoal">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-orange"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
              Account Already Exists
            </h2>
          </div>

          <div className="mb-6 space-y-4">
            <p className="text-light-charcoal dark:text-lightgrey">
              We found an existing account with the email address:
            </p>
            <div className="bg-smoked-white dark:bg-light-black rounded-lg p-3 border border-border-grey dark:border-dark-charcoal">
              <p className="font-mono text-sm text-black dark:text-white break-all">
                {linkRequest.pending_email}
              </p>
            </div>
            <p className="text-light-charcoal dark:text-lightgrey">
              This account was created using{" "}
              <strong>{existingProviderName}</strong>. You tried to sign in with{" "}
              <strong>{attemptedProviderName}</strong>.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-black dark:text-white mb-2">
              Link Your Accounts?
            </h3>
            <p className="text-sm text-light-charcoal dark:text-lightgrey">
              Link your {attemptedProviderName} login to your existing account?
              You&apos;ll be able to sign in using either method.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleConfirm}
              disabled={processing}
              variant="primary"
              className="w-full"
            >
              {processing ? "Linking..." : "Yes, Link My Accounts"}
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              variant="secondary"
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          <p className="mt-4 text-xs text-center text-light-charcoal dark:text-lightgrey">
            You can manage connected accounts in your profile settings after
            linking.
          </p>
        </div>
      </div>
    </Layout>
  );
}
