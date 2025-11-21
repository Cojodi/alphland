/**
 * Cloudflare Worker for Alphland API
 * This worker handles API requests and connects to D1 database
 */
import { createAuth } from "./auth";
import {
  handleSubmissionsAPI,
  handleCommentsAPI,
  handleSponsorsAPI,
} from "./handlers";

// Type definition for D1Database (fallback for when @cloudflare/workers-types is not available)
type D1Database = any;

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string; // Frontend URL (e.g., http://localhost:3000)
  APP_URL?: string; // Same as BETTER_AUTH_URL
}

// Note: Do NOT cache auth instance globally
// D1 binding is only available within request context

const worker = {
  async fetch(request: Request, env: Env, _ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Get the origin from the request or use the configured frontend URL
    const requestOrigin = request.headers.get("Origin");
    const allowedOrigin =
      env.APP_URL || env.BETTER_AUTH_URL || "http://localhost:3000";

    // CORS headers - must allow credentials for cookie-based auth
    const corsHeaders = {
      // Use specific origin instead of "*" to allow credentials
      "Access-Control-Allow-Origin": requestOrigin || allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      "Access-Control-Allow-Credentials": "true", // Required for cookies
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    try {
      // Handle auth routes - create fresh auth instance per request
      // D1 binding is only available within request context
      if (url.pathname.startsWith("/api/auth/")) {
        const auth = createAuth(env.DB, {
          GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
          BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
          BETTER_AUTH_URL: env.BETTER_AUTH_URL,
          APP_URL: env.APP_URL,
        });

        // Handle auth endpoints using better-auth
        const response = await auth.handler(request);

        // Add CORS headers to auth responses (for non-redirect responses)
        if (response.status < 300 || response.status >= 400) {
          const newHeaders = new Headers(response.headers);
          Object.entries(corsHeaders).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        }

        return response;
      }

      // Health check endpoint
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({ status: "ok", timestamp: Date.now() }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Database test endpoint
      if (url.pathname === "/api/db-test") {
        const result = await env.DB.prepare("SELECT 1 as test").first();
        return new Response(JSON.stringify({ success: true, result }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Bounties API endpoints
      if (url.pathname.startsWith("/api/bounties")) {
        return handleBountiesAPI(request, env, url);
      }

      // User profile endpoints
      if (url.pathname.startsWith("/api/users")) {
        return handleUsersAPI(request, env, url);
      }

      // Submission endpoints
      if (url.pathname.startsWith("/api/submissions")) {
        return handleSubmissionsAPI(request, env, url);
      }

      // Comments endpoints
      if (url.pathname.startsWith("/api/comments")) {
        return handleCommentsAPI(request, env, url);
      }

      // Sponsors endpoints
      if (url.pathname.startsWith("/api/sponsors")) {
        return handleSponsorsAPI(request, env, url);
      }

      // Default 404
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  },
};

export default worker;

/**
 * Handle Bounties API requests
 */
async function handleBountiesAPI(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const pathname = url.pathname;

  // GET /api/bounties - List all bounties
  if (request.method === "GET" && pathname === "/api/bounties") {
    const { results } = await env.DB.prepare(
      `
      SELECT * FROM bounties
      WHERE status != 'deleted'
      ORDER BY created_at DESC
    `
    ).all();

    return new Response(JSON.stringify({ bounties: results }), {
      headers: corsHeaders,
    });
  }

  // GET /api/bounties/:id - Get single bounty
  if (request.method === "GET" && pathname.match(/^\/api\/bounties\/[^/]+$/)) {
    const id = pathname.split("/").pop();
    const bounty = await env.DB.prepare(
      `
      SELECT * FROM bounties WHERE id = ?
    `
    )
      .bind(id)
      .first();

    if (!bounty) {
      return new Response(JSON.stringify({ error: "Bounty not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ bounty }), {
      headers: corsHeaders,
    });
  }

  // POST /api/bounties - Create new bounty
  if (request.method === "POST" && pathname === "/api/bounties") {
    const body = (await request.json()) as any;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `
      INSERT INTO bounties (
        id, title, description, reward_amount, reward_currency,
        difficulty, category, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        id,
        body.title,
        body.description,
        body.reward_amount,
        body.reward_currency || "ALPH",
        body.difficulty,
        body.category,
        "open",
        body.created_by,
        now,
        now
      )
      .run();

    const bounty = await env.DB.prepare("SELECT * FROM bounties WHERE id = ?")
      .bind(id)
      .first();

    return new Response(JSON.stringify({ bounty }), {
      status: 201,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
}

/**
 * Handle Users API requests
 */
async function handleUsersAPI(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const pathname = url.pathname;

  // GET /api/users/username/:username - Get user profile by username
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/users\/username\/[^/]+$/)
  ) {
    const username = pathname.split("/").pop();

    // Join with user table to get email, name, image
    const user = await env.DB.prepare(
      `SELECT
        up.*,
        u.email,
        u.name,
        u.image
       FROM user_profiles up
       JOIN user u ON up.user_id = u.id
       WHERE up.username = ?`
    )
      .bind(username)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ user }), {
      headers: corsHeaders,
    });
  }

  // GET /api/users/me - Get current user's profile (requires auth)
  if (request.method === "GET" && pathname === "/api/users/me") {
    // Get session from cookie
    const auth = createAuth(env.DB, {
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
      APP_URL: env.APP_URL,
    });

    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = session.user.id;

    // Get or create user profile
    let profile = await env.DB.prepare(
      `SELECT * FROM user_profiles WHERE user_id = ?`
    )
      .bind(userId)
      .first();

    if (!profile) {
      const profileId = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(
        `INSERT INTO user_profiles (id, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?)`
      )
        .bind(profileId, userId, now, now)
        .run();

      profile = await env.DB.prepare(
        `SELECT * FROM user_profiles WHERE user_id = ?`
      )
        .bind(userId)
        .first();
    }

    return new Response(
      JSON.stringify({
        user: {
          ...profile,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        },
      }),
      {
        headers: corsHeaders,
      }
    );
  }

  // GET /api/users/:id - Get user profile by user_id
  if (request.method === "GET" && pathname.match(/^\/api\/users\/[^/]+$/)) {
    const id = pathname.split("/").pop();

    let user = await env.DB.prepare(
      `SELECT
        up.*,
        u.email,
        u.name,
        u.image
       FROM user_profiles up
       JOIN user u ON up.user_id = u.id
       WHERE up.user_id = ?`
    )
      .bind(id)
      .first();

    // If user profile doesn't exist, create it
    if (!user) {
      const profileId = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(
        `INSERT INTO user_profiles (id, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?)`
      )
        .bind(profileId, id, now, now)
        .run();

      user = await env.DB.prepare(
        `SELECT
          up.*,
          u.email,
          u.name,
          u.image
         FROM user_profiles up
         JOIN user u ON up.user_id = u.id
         WHERE up.user_id = ?`
      )
        .bind(id)
        .first();
    }

    return new Response(JSON.stringify({ user }), {
      headers: corsHeaders,
    });
  }

  // PUT /api/users/:id - Update user profile
  if (request.method === "PUT" && pathname.match(/^\/api\/users\/[^/]+$/)) {
    const id = pathname.split("/").pop();
    const body = (await request.json()) as any;
    const now = Math.floor(Date.now() / 1000);

    // Check if username is taken (if provided and changed)
    if (body.username) {
      const existing = await env.DB.prepare(
        `SELECT id FROM user_profiles WHERE username = ? AND user_id != ?`
      )
        .bind(body.username, id)
        .first();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Username already taken" }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }
    }

    // Update profile with all fields
    await env.DB.prepare(
      `UPDATE user_profiles
       SET username = COALESCE(?, username),
           bio = COALESCE(?, bio),
           wallet_address = COALESCE(?, wallet_address),
           github_username = COALESCE(?, github_username),
           twitter_username = COALESCE(?, twitter_username),
           discord_username = COALESCE(?, discord_username),
           linkedin_username = COALESCE(?, linkedin_username),
           telegram_username = COALESCE(?, telegram_username),
           website = COALESCE(?, website),
           location = COALESCE(?, location),
           work_preference = COALESCE(?, work_preference),
           current_employer = COALESCE(?, current_employer),
           web3_familiarity = COALESCE(?, web3_familiarity),
           skills = COALESCE(?, skills),
           web3_interests = COALESCE(?, web3_interests),
           projects = COALESCE(?, projects),
           updated_at = ?
       WHERE user_id = ?`
    )
      .bind(
        body.username || null,
        body.bio || null,
        body.wallet_address || null,
        body.github_username || null,
        body.twitter_username || null,
        body.discord_username || null,
        body.linkedin_username || null,
        body.telegram_username || null,
        body.website || null,
        body.location || null,
        body.work_preference || null,
        body.current_employer || null,
        body.web3_familiarity || null,
        body.skills ? JSON.stringify(body.skills) : null,
        body.web3_interests ? JSON.stringify(body.web3_interests) : null,
        body.projects ? JSON.stringify(body.projects) : null,
        now,
        id
      )
      .run();

    const user = await env.DB.prepare(
      `SELECT * FROM user_profiles WHERE user_id = ?`
    )
      .bind(id)
      .first();

    return new Response(JSON.stringify({ user }), {
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
}
