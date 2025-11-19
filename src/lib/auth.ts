/**
 * Better Auth configuration for Alphland Bounty
 * Supports: Email/Password login and Google OAuth
 */
import { betterAuth } from "better-auth";

// Note: This configuration will be used in Cloudflare Workers environment
// D1 binding will be available via env.DB

export const auth = betterAuth({
  // Database configuration
  // Database will be configured at runtime with D1 binding
  database: {
    provider: "sqlite",
    url: process.env.DATABASE_URL || "file:./dev.db",
  },

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Users must verify email before login
    sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
      // TODO: Implement email sending (e.g., via Resend, SendGrid, etc.)
      console.log(`Password reset URL for ${user.email}: ${url}`);
      // Example with Resend:
      // await resend.emails.send({
      //   from: 'noreply@alph.land',
      //   to: user.email,
      //   subject: 'Reset your password',
      //   html: `Click here to reset: ${url}`
      // });
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
      // Example with Resend:
      // await resend.emails.send({
      //   from: 'noreply@alph.land',
      //   to: user.email,
      //   subject: 'Verify your email',
      //   html: `Click here to verify: ${url}`
      // });
    },
  },

  // Social authentication providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Callback URL will be: https://yourdomain.com/api/auth/callback/google
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
      // Use crypto.randomUUID() for generating IDs
      return crypto.randomUUID();
    },
    crossSubDomainCookies: {
      enabled: false,
    },
  },

  // Base URL for authentication endpoints
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET!,

  // Callback URLs after successful authentication
  callbacks: {
    async onSignIn(user: any) {
      console.log("User signed in:", user.email);
      // You can add custom logic here, e.g., create user_profile
    },
    async onSignUp(user: any) {
      console.log("New user signed up:", user.email);
      // TODO: Create user_profile entry in database
      // This is where you'd insert into user_profiles table
    },
  },
});

/**
 * Type definitions for Better Auth
 */
export type AuthSession = typeof auth.$Infer.Session;
