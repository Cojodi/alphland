/**
 * Better Auth configuration for Cloudflare Worker with D1
 */
import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export function createAuth(
  db: any,
  env: {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
  }
) {
  // Create Kysely instance with D1 dialect
  const kysely = new Kysely({
    dialect: new D1Dialect({ database: db }),
  });

  return betterAuth({
    database: kysely as any,

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Disable for development
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || "",
        clientSecret: env.GOOGLE_CLIENT_SECRET || "",
        enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session every 24 hours
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // Cache for 5 minutes
      },
    },

    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
  });
}
