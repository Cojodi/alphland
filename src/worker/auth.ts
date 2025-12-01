/**
 * Better Auth configuration for Cloudflare Worker with D1
 *
 * IMPORTANT: D1 Database Binding Context
 *
 * D1 binding is only available inside the request context in Cloudflare Workers.
 * We cannot create a static auth instance with D1 - it must be created per-request.
 *
 * Authentication Flow with Next.js Proxy:
 * 1. Frontend (localhost:3000) sends auth requests to /api/auth/*
 * 2. Next.js rewrites proxy these to Worker (localhost:8787)
 * 3. For Google OAuth:
 *    - BETTER_AUTH_URL must be the FRONTEND URL (localhost:3000)
 *    - Google redirects to localhost:3000/api/auth/callback/google
 *    - Next.js proxies callback to worker
 *    - Worker sets cookie, which appears on localhost:3000 domain
 */
import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { Resend } from "resend";

// Type definition for D1Database (fallback for when @cloudflare/workers-types is not available)
type D1Database = any;

export interface AuthEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  APP_URL?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
}

/**
 * Create auth instance with D1 database
 * Must be called within request context where D1 binding is available
 */
export function createAuth(db: D1Database, env: AuthEnv) {
  // Use APP_URL or BETTER_AUTH_URL as the public-facing URL
  const publicUrl = env.APP_URL || env.BETTER_AUTH_URL;

  // Create Kysely instance with D1 dialect
  const kysely = new Kysely<any>({
    dialect: new D1Dialect({ database: db }),
  });

  // Initialize Resend for email sending
  const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  const fromEmail = env.FROM_EMAIL || "onboarding@resend.dev";

  return betterAuth({
    // D1 uses SQLite syntax - must specify type
    database: {
      db: kysely,
      type: "sqlite",
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        if (!resend) {
          console.error("RESEND_API_KEY not configured");
          throw new Error("Email service not configured");
        }

        const { error } = await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: "Reset your password - Alphland",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reset Your Password</h2>
              <p>Hello ${user.name || "there"},</p>
              <p>We received a request to reset your password for your Alphland account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="color: #666; word-break: break-all;">${url}</p>
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
              <p style="color: #666; font-size: 12px;">This email was sent by Alphland</p>
            </div>
          `,
        });

        if (error) {
          console.error("Failed to send password reset email:", error);
          throw new Error("Failed to send email");
        }
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (!resend) {
          console.error("RESEND_API_KEY not configured");
          throw new Error("Email service not configured");
        }

        const { error } = await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: "Verify your email - Alphland",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to Alphland!</h2>
              <p>Hello ${user.name || "there"},</p>
              <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
              <p>Click the button below to verify your email:</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Verify Email</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="color: #666; word-break: break-all;">${url}</p>
              <p>If you didn't create an account with Alphland, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
              <p style="color: #666; font-size: 12px;">This email was sent by Alphland</p>
            </div>
          `,
        });

        if (error) {
          console.error("Failed to send verification email:", error);
          throw new Error("Failed to send email");
        }
      },
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || "",
        clientSecret: env.GOOGLE_CLIENT_SECRET || "",
        redirectURI: `${publicUrl}/api/auth/callback/google`,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: false, // Disabled: session data exceeds cookie size limit
      },
    },

    baseURL: publicUrl,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [publicUrl],

    advanced: {
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },
  });
}
