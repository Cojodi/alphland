/**
 * Client-side utilities for account linking
 */

const API_BASE_URL =
  typeof window !== "undefined" ? window.location.origin : "";

export interface AccountLinkRequest {
  id: string;
  existing_user_id: string;
  pending_email: string;
  pending_provider_id: string;
  pending_account_id: string;
  provider_data: string | null;
  token: string;
  expires_at: number;
  created_at: number;
}

export interface ConnectedAccount {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: number;
}

/**
 * Check if an email has an account conflict with a different provider
 */
export async function checkAccountConflict(
  email: string,
  providerId: string,
): Promise<{
  hasConflict: boolean;
  existingUser?: any;
  existingAccount?: any;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/account-linking/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, providerId }),
    });

    if (!response.ok) {
      throw new Error("Failed to check account conflict");
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking account conflict:", error);
    throw error;
  }
}

/**
 * Create an account link request
 */
export async function createAccountLinkRequest(
  existingUserId: string,
  email: string,
  providerId: string,
  accountId: string,
  providerData?: any,
): Promise<AccountLinkRequest> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/account-linking/request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          existingUserId,
          email,
          providerId,
          accountId,
          providerData,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to create account link request");
    }

    const data = await response.json();
    return data.linkRequest;
  } catch (error) {
    console.error("Error creating account link request:", error);
    throw error;
  }
}

/**
 * Get an account link request by token
 */
export async function getAccountLinkRequest(
  token: string,
): Promise<AccountLinkRequest | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/account-linking/request/${token}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to get account link request");
    }

    const data = await response.json();
    return data.linkRequest;
  } catch (error) {
    console.error("Error getting account link request:", error);
    throw error;
  }
}

/**
 * Confirm and link accounts
 */
export async function confirmAccountLink(
  token: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/account-linking/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to link accounts");
    }

    return await response.json();
  } catch (error) {
    console.error("Error confirming account link:", error);
    throw error;
  }
}

/**
 * Reject an account link request
 */
export async function rejectAccountLink(
  token: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/account-linking/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Failed to reject account link");
    }

    return await response.json();
  } catch (error) {
    console.error("Error rejecting account link:", error);
    throw error;
  }
}

/**
 * Get all connected accounts for a user
 */
export async function getUserConnectedAccounts(
  userId: string,
): Promise<ConnectedAccount[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/account-linking/connected/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to get connected accounts");
    }

    const data = await response.json();
    return data.accounts;
  } catch (error) {
    console.error("Error getting connected accounts:", error);
    throw error;
  }
}

/**
 * Disconnect/unlink an account
 */
export async function disconnectAccount(
  userId: string,
  accountId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/account-linking/disconnect`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId, accountId }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to disconnect account");
    }

    return await response.json();
  } catch (error) {
    console.error("Error disconnecting account:", error);
    throw error;
  }
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(providerId: string): string {
  const providerNames: Record<string, string> = {
    google: "Google",
    credential: "Email/Password",
  };
  return providerNames[providerId] || providerId;
}
