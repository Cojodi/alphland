/**
 * Better Auth configuration for Alphland Bounty
 * Supports: Email/Password login and Google OAuth
 */
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import path from "path";

// Initialize SQLite database for development
const dbPath = path.join(process.cwd(), "dev.db");
const sqliteDb = new Database(dbPath);

// Create Kysely instance
const db = new Kysely({
  dialect: new SqliteDialect({
    database: sqliteDb,
  }),
});

export const auth = betterAuth({
  // Database configuration using Kysely
  database: db as any,

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for development
  },

  // Social authentication providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
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

  // Base URL for authentication endpoints
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "development-secret-change-in-production-please-minimum-32-chars-required",
});

/**
 * Type definitions for Better Auth
 */
export type AuthSession = typeof auth.$Infer.Session;
