/**
 * Better Auth configuration for Cloudflare D1
 * This file is specifically for D1 database connections
 */
import { betterAuth } from "better-auth";

// Import D1Database type from Cloudflare Workers types
type D1Database = any; // Fallback for when @cloudflare/workers-types is not available

/**
 * Create auth instance with D1 database binding
 * This should be called in your Cloudflare Worker with the D1 binding
 */
export function createAuthWithD1(
  db: D1Database,
  env: {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
  }
) {
  return betterAuth({
    // D1 Database configuration
    database: {
      provider: "sqlite", // D1 uses SQLite syntax
      db: db as any, // D1Database binding
    },

    // Email/Password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
        // TODO: Implement email sending (e.g., via Resend, SendGrid, etc.)
        console.log(`Password reset URL for ${user.email}: ${url}`);
      },
      sendVerificationEmail: async ({
        user,
        url,
      }: {
        user: any;
        url: string;
      }) => {
        // TODO: Implement email verification sending
        console.log(`Verification URL for ${user.email}: ${url}`);
      },
    },

    // Social authentication providers
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },

    // Session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session every 24 hours
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // Cache for 5 minutes
      },
    },

    // Security settings
    advanced: {
      generateId: () => {
        return crypto.randomUUID();
      },
      crossSubDomainCookies: {
        enabled: false,
      },
    },

    // Base URL for authentication endpoints
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,

    // Callback URLs after successful authentication
    callbacks: {
      async onSignIn(user: any) {
        console.log("User signed in:", user.email);
      },
      async onSignUp(user: any) {
        console.log("New user signed up:", user.email);
      },
    },
  });
}
