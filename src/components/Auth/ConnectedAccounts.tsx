/**
 * Connected Accounts Management Component
 * Allows users to view and manage their connected authentication providers
 */
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import {
  getUserConnectedAccounts,
  disconnectAccount,
  getProviderDisplayName,
  type ConnectedAccount,
} from "@/lib/account-linking-client";
import Button from "../Button/Button";

export default function ConnectedAccounts() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadConnectedAccounts();
    }
  }, [session]);

  const loadConnectedAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      const connectedAccounts = await getUserConnectedAccounts(
        session!.user.id,
      );
      setAccounts(connectedAccounts);
    } catch (err) {
      console.error("Error loading connected accounts:", err);
      setError("Failed to load connected accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string, providerId: string) => {
    if (accounts.length <= 1) {
      setError("You cannot disconnect your only authentication method");
      return;
    }

    const providerName = getProviderDisplayName(providerId);
    const confirmed = window.confirm(
      `Are you sure you want to disconnect ${providerName}? You will no longer be able to sign in using this method.`,
    );

    if (!confirmed) return;

    try {
      setDisconnecting(accountId);
      setError("");
      await disconnectAccount(session!.user.id, accountId);
      await loadConnectedAccounts();
    } catch (err: any) {
      console.error("Error disconnecting account:", err);
      setError(err.message || "Failed to disconnect account");
    } finally {
      setDisconnecting(null);
    }
  };

  const getProviderIcon = (providerId: string) => {
    if (providerId === "google") {
      return (
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
      );
    }

    if (providerId === "credential") {
      return (
        <svg
          className="w-5 h-5 text-light-charcoal dark:text-lightgrey"
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
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-light-charcoal dark:text-lightgrey">
          Loading connected accounts...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
          Connected Accounts
        </h3>
        <p className="text-sm text-light-charcoal dark:text-lightgrey">
          Manage how you sign in to your account. You can connect multiple
          authentication methods for easier access.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-500">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between p-4 bg-smoked-white dark:bg-light-black rounded-lg border border-border-grey dark:border-dark-charcoal"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal flex items-center justify-center">
                {getProviderIcon(account.providerId)}
              </div>
              <div>
                <div className="font-medium text-black dark:text-white">
                  {getProviderDisplayName(account.providerId)}
                </div>
                <div className="text-xs text-light-charcoal dark:text-lightgrey">
                  Connected on{" "}
                  {new Date(account.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-accessible-green/10 text-accessible-green border border-accessible-green">
                Connected
              </span>
              {accounts.length > 1 && (
                <Button
                  onClick={() =>
                    handleDisconnect(account.id, account.providerId)
                  }
                  disabled={disconnecting === account.id}
                  variant="secondary"
                  className="text-sm"
                >
                  {disconnecting === account.id
                    ? "Disconnecting..."
                    : "Disconnect"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 1 && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-light-charcoal dark:text-lightgrey">
            You can connect additional authentication methods by signing in with
            them. When prompted, choose to link them to your existing account.
          </p>
        </div>
      )}
    </div>
  );
}
