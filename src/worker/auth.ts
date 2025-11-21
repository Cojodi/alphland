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

// Type definition for D1Database (fallback for when @cloudflare/workers-types is not available)
type D1Database = any;

export interface AuthEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  APP_URL?: string;
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

  return betterAuth({
    // D1 uses SQLite syntax - must specify type
    database: {
      db: kysely,
      type: "sqlite",
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
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
        enabled: true,
        maxAge: 5 * 60,
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
