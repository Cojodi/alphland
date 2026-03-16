/**
 * Enhanced auth functions that handle account linking
 * These wrapper functions check for account conflicts before signing in
 */
import { authClient } from "./auth-client";
import { checkAccountConflict } from "./account-linking-client";

export interface AuthConflictResult {
  hasConflict: boolean;
  existingProvider?: "google" | "credential";
  existingUser?: any;
  email?: string;
}

/**
 * Sign in with Google - checks for conflicts first
 * Returns conflict info if account exists with different provider
 */
export async function signInWithGoogleWithLinking(
  callbackURL?: string,
): Promise<{ conflict?: AuthConflictResult }> {
  // Note: For Google OAuth, we can't easily check beforehand since we need
  // the user's email from Google. The conflict check will happen server-side
  // in a custom callback handler or via Better Auth hooks.

  // For now, proceed with normal Google sign in
  // The server will handle account linking if needed
  try {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: callbackURL || "/bounty",
    });
    return {};
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
}

/**
 * Sign in with email/password - checks for conflicts first
 * Returns conflict info if account exists with Google
 */
export async function signInWithEmailWithLinking(
  email: string,
  password: string,
  callbackURL?: string,
): Promise<{ success: boolean; conflict?: AuthConflictResult; error?: any }> {
  try {
    // First check if there's a conflict
    const conflictCheck = await checkAccountConflict(email, "credential");

    if (
      conflictCheck.hasConflict &&
      conflictCheck.existingAccount?.providerId === "google"
    ) {
      // Return conflict info instead of proceeding
      return {
        success: false,
        conflict: {
          hasConflict: true,
          existingProvider: "google",
          existingUser: conflictCheck.existingUser,
          email,
        },
      };
    }

    // No conflict, proceed with normal sign in
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: callbackURL || "/bounty",
    });

    return { success: true };
  } catch (error) {
    console.error("Email sign in error:", error);
    return { success: false, error };
  }
}

/**
 * Sign up with email/password - checks for conflicts first
 * Returns conflict info if account exists with Google
 */
export async function signUpWithEmailWithLinking(
  email: string,
  password: string,
  name: string,
  callbackURL?: string,
): Promise<{
  success: boolean;
  conflict?: AuthConflictResult;
  data?: any;
  error?: any;
}> {
  try {
    // Check if there's already an account with this email from Google
    const conflictCheck = await checkAccountConflict(email, "credential");

    if (
      conflictCheck.hasConflict &&
      conflictCheck.existingAccount?.providerId === "google"
    ) {
      // Return conflict info instead of proceeding
      return {
        success: false,
        conflict: {
          hasConflict: true,
          existingProvider: "google",
          existingUser: conflictCheck.existingUser,
          email,
        },
      };
    }

    // No conflict, proceed with normal sign up
    const result = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: callbackURL || "/bounty?verified=true",
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Email sign up error:", error);
    return { success: false, error };
  }
}
