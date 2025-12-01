/**
 * Account Linking Utilities
 * Handles account conflict detection and linking for Better Auth
 */
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { Env } from "./index";

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

/**
 * Check if an email already exists with a different provider
 */
export async function checkAccountConflict(
  db: D1Database,
  email: string,
  providerId: string,
): Promise<{
  hasConflict: boolean;
  existingUser?: any;
  existingAccount?: any;
}> {
  const kysely = new Kysely<any>({
    dialect: new D1Dialect({ database: db }),
  });

  // Check if user exists with this email
  const existingUser = await kysely
    .selectFrom("user")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();

  if (!existingUser) {
    return { hasConflict: false };
  }

  // Check if account exists with different provider
  const existingAccount = await kysely
    .selectFrom("account")
    .selectAll()
    .where("userId", "=", existingUser.id)
    .executeTakeFirst();

  if (!existingAccount) {
    return { hasConflict: false };
  }

  // If trying to sign in with Google but account exists with credential (email/password)
  if (providerId === "google" && existingAccount.providerId === "credential") {
    return { hasConflict: true, existingUser, existingAccount };
  }

  // If trying to sign in with email/password but account exists with Google
  if (providerId === "credential" && existingAccount.providerId === "google") {
    return { hasConflict: true, existingUser, existingAccount };
  }

  return { hasConflict: false };
}

/**
 * Create an account link request
 */
export async function createAccountLinkRequest(
  db: D1Database,
  existingUserId: string,
  email: string,
  providerId: string,
  accountId: string,
  providerData?: any,
): Promise<AccountLinkRequest> {
  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + 30 * 60 * 1000; // 30 minutes

  const kysely = new Kysely<any>({
    dialect: new D1Dialect({ database: db }),
  });

  await kysely
    .insertInto("account_link_requests")
    .values({
      id,
      existing_user_id: existingUserId,
      pending_email: email,
      pending_provider_id: providerId,
      pending_account_id: accountId,
      provider_data: providerData ? JSON.stringify(providerData) : null,
      token,
      expires_at: expiresAt,
      created_at: now,
    })
    .execute();

  return {
    id,
    existing_user_id: existingUserId,
    pending_email: email,
    pending_provider_id: providerId,
    pending_account_id: accountId,
    provider_data: providerData ? JSON.stringify(providerData) : null,
    token,
    expires_at: expiresAt,
    created_at: now,
  };
}

/**
 * Get account link request by token
 */
export async function getAccountLinkRequest(
  db: D1Database,
  token: string,
): Promise<AccountLinkRequest | null> {
  const kysely = new Kysely<any>({
    dialect: new D1Dialect({ database: db }),
  });

  const request = await kysely
    .selectFrom("account_link_requests")
    .selectAll()
    .where("token", "=", token)
    .executeTakeFirst();

  if (!request) {
    return null;
  }

  // Check if expired
  if (request.expires_at < Date.now()) {
    // Clean up expired request
    await kysely
      .deleteFrom("account_link_requests")
      .where("token", "=", token)
      .execute();
    return null;
  }

  return request as AccountLinkRequest;
}

/**
 * Link accounts by adding new provider to existing user
 */
export async function linkAccounts(
  db: D1Database,
  linkRequest: AccountLinkRequest,
): Promise<{ success: boolean; error?: string }> {
  const kysely = new Kysely<any>({
    dialect: new D1Dialect({ database: db }),
  });

  try {
    // Check if account already exists for this provider
    const existingProviderAccount = await kysely
      .selectFrom("account")
      .selectAll()
      .where("userId", "=", linkRequest.existing_user_id)
      .where("providerId", "=", linkRequest.pending_provider_id)
      .executeTakeFirst();

    if (existingProviderAccount) {
      return {
        success: false,
        error: "Account already linked with this provider",
      };
    }

    // Parse provider data
    const providerData = linkRequest.provider_data
      ? JSON.parse(linkRequest.provider_data)
      : {};

    // Create new account entry for the provider
    const accountId = crypto.randomUUID();
    const now = Date.now();

    await kysely
      .insertInto("account")
      .values({
        id: accountId,
        accountId: linkRequest.pending_account_id,
        providerId: linkRequest.pending_provider_id,
        userId: linkRequest.existing_user_id,
        accessToken: providerData.accessToken || null,
        refreshToken: providerData.refreshToken || null,
        idToken: providerData.idToken || null,
        expiresAt: providerData.expiresAt || null,
        password: null,
        createdAt: now,
        updatedAt: now,
      })
      .execute();

    // Delete the link request
    await kysely
      .deleteFrom("account_link_requests")
      .where("id", "=", linkRequest.id)
      .execute();

    return { success: true };
  } catch (error) {
    console.error("Error linking accounts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Reject/Cancel account link request
 */
export async function rejectAccountLinkRequest(
  db: D1Database,
  token: string,
): Promise<boolean> {
  const kysely = new Kysely<any>({
    dialect: new D1Dialect({ database: db }),
  });

  const result = await kysely
    .deleteFrom("account_link_requests")
    .where("token", "=", token)
    .execute();

  return true;
}

/**
 * Get all connected accounts for a user
 */
export async function getUserConnectedAccounts(
  db: D1Database,
  userId: string,
): Promise<any[]> {
  const kysely = new Kysely<any>({
    dialect: new D1Dialect({ database: db }),
  });

  const accounts = await kysely
    .selectFrom("account")
    .select(["id", "providerId", "accountId", "createdAt"])
    .where("userId", "=", userId)
    .execute();

  return accounts;
}

/**
 * Disconnect/Unlink an account
 */
export async function disconnectAccount(
  db: D1Database,
  userId: string,
  accountId: string,
): Promise<{ success: boolean; error?: string }> {
  const kysely = new Kysely<any>({
    dialect: new D1Dialect({ database: db }),
  });

  try {
    // Check if user has multiple accounts
    const accounts = await kysely
      .selectFrom("account")
      .selectAll()
      .where("userId", "=", userId)
      .execute();

    if (accounts.length <= 1) {
      return {
        success: false,
        error: "Cannot disconnect the only authentication method",
      };
    }

    // Delete the account
    await kysely
      .deleteFrom("account")
      .where("id", "=", accountId)
      .where("userId", "=", userId)
      .execute();

    return { success: true };
  } catch (error) {
    console.error("Error disconnecting account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

type D1Database = any;
