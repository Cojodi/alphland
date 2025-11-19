/**
 * Cloudflare Worker for Alphland API
 * This worker handles API requests and connects to D1 database
 */

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
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

    const user = await env.DB.prepare(
      `
      SELECT * FROM user_profiles WHERE user_id = ?
    `
    )
      .bind(id)
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

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
}
