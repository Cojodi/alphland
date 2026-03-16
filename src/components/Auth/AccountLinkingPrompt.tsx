/**
 * Account Linking Prompt Component
 * Displays when a user tries to log in with a different provider than their existing account
 */
import { useState } from "react";
import Button from "../Button/Button";

interface AccountLinkingPromptProps {
  email: string;
  existingProvider: "google" | "credential";
  attemptedProvider: "google" | "credential";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function AccountLinkingPrompt({
  email,
  existingProvider,
  attemptedProvider,
  onConfirm,
  onCancel,
  loading = false,
}: AccountLinkingPromptProps) {
  const getProviderName = (provider: string) => {
    if (provider === "google") return "Google";
    if (provider === "credential") return "Email/Password";
    return provider;
  };

  const existingProviderName = getProviderName(existingProvider);
  const attemptedProviderName = getProviderName(attemptedProvider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 bg-white dark:bg-hero-dark rounded-xl p-6 border border-border-grey dark:border-dark-charcoal shadow-2xl">
        <div className="mb-4">
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
          <h3 className="text-xl font-bold text-black dark:text-white mb-2">
            Account Already Exists
          </h3>
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-light-charcoal dark:text-lightgrey">
            We found an existing account with the email address:
          </p>
          <div className="bg-smoked-white dark:bg-light-black rounded-lg p-3 border border-border-grey dark:border-dark-charcoal">
            <p className="font-mono text-sm text-black dark:text-white break-all">
              {email}
            </p>
          </div>
          <p className="text-light-charcoal dark:text-lightgrey">
            This account was created using{" "}
            <strong>{existingProviderName}</strong>. You are trying to sign in
            with <strong>{attemptedProviderName}</strong>.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-black dark:text-white mb-2">
            Link Your Accounts?
          </h4>
          <p className="text-sm text-light-charcoal dark:text-lightgrey">
            Would you like to link your {attemptedProviderName} login to your
            existing account? This will allow you to sign in using either
            method.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onConfirm}
            disabled={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? "Linking..." : "Yes, Link My Accounts"}
          </Button>
          <Button
            onClick={onCancel}
            disabled={loading}
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
  );
}
