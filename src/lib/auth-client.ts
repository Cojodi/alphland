/**
 * Better Auth client for frontend usage
 * Use this in your React components
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

/**
 * Auth hooks for React components
 */
export const { useSession, signIn, signUp, signOut, useActiveOrganization } =
  authClient;

/**
 * Helper functions for authentication
 */

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string
) {
  try {
    const result = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: "/bounty", // Redirect to bounty list after signup
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error };
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  try {
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/bounty", // Redirect to bounty list after login
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error };
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/bounty", // Redirect after Google auth
    });
    return { success: true };
  } catch (error) {
    console.error("Google sign in error:", error);
    return { success: false, error };
  }
}

// Sign out
export async function signOutUser() {
  try {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/"; // Redirect to home after logout
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error };
  }
}

// Request password reset
export async function requestPasswordReset(email: string) {
  try {
    await authClient.forgetPassword({
      email,
      redirectTo: "/reset-password", // Page to handle password reset
    });
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error };
  }
}

// Reset password with token
export async function resetPassword(token: string, newPassword: string) {
  try {
    await authClient.resetPassword({
      newPassword,
      token,
    });
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error };
  }
}

// Verify email with token
export async function verifyEmail(token: string) {
  try {
    await authClient.verifyEmail({
      token,
    });
    return { success: true };
  } catch (error) {
    console.error("Email verification error:", error);
    return { success: false, error };
  }
}
