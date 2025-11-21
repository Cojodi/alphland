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
  BETTER_AUTH_URL: string;
}

// Cache auth instance per request
let authInstance: any = null;

const worker = {
  async fetch(request: Request, env: Env, _ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for development
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    try {
      // Initialize auth if handling auth routes
      if (url.pathname.startsWith("/api/auth/")) {
        if (!authInstance) {
          authInstance = createAuth(env.DB, {
            GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
            BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
            BETTER_AUTH_URL: env.BETTER_AUTH_URL,
          });
        }

        // Handle auth endpoints using better-auth
        return await authInstance.api.handler(request);
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

  // GET /api/users/:id - Get user profile
  if (request.method === "GET" && pathname.match(/^\/api\/users\/[^/]+$/)) {
    const id = pathname.split("/").pop();

    let user = await env.DB.prepare(
      `SELECT * FROM user_profiles WHERE user_id = ?`
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
        `SELECT * FROM user_profiles WHERE user_id = ?`
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

    // Update profile
    await env.DB.prepare(
      `UPDATE user_profiles
       SET username = COALESCE(?, username),
           bio = COALESCE(?, bio),
           wallet_address = COALESCE(?, wallet_address),
           github_username = COALESCE(?, github_username),
           twitter_username = COALESCE(?, twitter_username),
           discord_username = COALESCE(?, discord_username),
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
