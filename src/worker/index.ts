/**
 * Cloudflare Worker for Alphland API
 * This worker handles API requests and connects to D1 database
 */
import { createAuth } from "./auth";
import {
  handleSubmissionsAPI,
  handleCommentsAPI,
  handleSponsorsAPI,
  handleNotificationsAPI,
  handleNotificationPreferencesAPI,
  handleUserDeletionAPI,
  handleBookmarksAPI,
  handleAccountLinkingAPI,
  handleImageUploadAPI,
  handleImageServingAPI,
  handleProofOfWorkAPI,
} from "./handlers";

// Type definition for D1Database (fallback for when @cloudflare/workers-types is not available)
type D1Database = any;
type R2Bucket = any;

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket; // R2 bucket for image storage
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string; // Frontend URL (e.g., http://localhost:3000)
  APP_URL?: string; // Same as BETTER_AUTH_URL
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
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
        console.log(`[AUTH] ${request.method} ${url.pathname}${url.search}`);
        console.log(
          `[AUTH] GOOGLE_CLIENT_ID: ${env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET"}`,
        );
        console.log(
          `[AUTH] GOOGLE_CLIENT_SECRET: ${env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET"}`,
        );
        console.log(`[AUTH] BETTER_AUTH_URL: ${env.BETTER_AUTH_URL}`);

        try {
          const auth = createAuth(
            env.DB,
            {
              GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
              GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
              BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
              BETTER_AUTH_URL: env.BETTER_AUTH_URL,
              APP_URL: env.APP_URL,
              RESEND_API_KEY: env.RESEND_API_KEY,
              FROM_EMAIL: env.FROM_EMAIL,
            },
            _ctx, // Pass ExecutionContext for background email sending
          );

          console.log("[AUTH] Auth instance created successfully");

          // Handle auth endpoints using better-auth
          const response = await auth.handler(request);
          console.log(`[AUTH] Response status: ${response.status}`);
          console.log(
            `[AUTH] Response headers:`,
            Object.fromEntries(response.headers),
          );

          const responseText = await response.text();
          console.log(`[AUTH] Response body:`, responseText.substring(0, 200));

          // Add CORS headers to auth responses (for non-redirect responses)
          if (response.status < 300 || response.status >= 400) {
            const newHeaders = new Headers(response.headers);
            Object.entries(corsHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value);
            });
            return new Response(responseText, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders,
            });
          }

          // Return response with original body for redirects
          return new Response(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        } catch (authError) {
          console.error("[AUTH] Error handling auth request:", authError);
          const errorMessage =
            authError instanceof Error ? authError.message : "Unknown error";
          return new Response(
            JSON.stringify({
              error: "Auth handler error",
              details: errorMessage,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }
      }

      // Health check endpoint
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({ status: "ok", timestamp: Date.now() }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      // Database test endpoint
      if (url.pathname === "/api/db-test") {
        const result = await env.DB.prepare("SELECT 1 as test").first();
        return new Response(JSON.stringify({ success: true, result }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Bounty overview stats endpoint
      if (url.pathname === "/api/bounty-overview") {
        const overview = await env.DB.prepare(
          "SELECT * FROM bounty_overview WHERE id = 1",
        ).first();

        return new Response(
          JSON.stringify({
            overview: overview || {
              total_value_usd: 0,
              total_value_alph: 0,
              list_number: 0,
              user_number: 0,
              sponsor_number: 0,
            },
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      // Recent earners endpoint - users with >1 submission in past week
      if (url.pathname === "/api/recent-earners") {
        try {
          const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;

          const { results } = await env.DB.prepare(
            `SELECT
              u.id,
              u.name,
              u.image,
              up.username,
              u.image as avatar_url,
              COUNT(s.id) as submission_count
            FROM bounty_submissions s
            JOIN user u ON s.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE s.created_at >= ?
            GROUP BY u.id, u.name, u.image, up.username
            HAVING COUNT(s.id) > 1
            ORDER BY submission_count DESC
            LIMIT 10`,
          )
            .bind(oneWeekAgo)
            .all();

          return new Response(
            JSON.stringify({
              earners: results || [],
            }),
            {
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        } catch (error) {
          console.error("Error fetching recent earners:", error);
          return new Response(
            JSON.stringify({
              error: "Internal server error",
              message: error instanceof Error ? error.message : "Unknown error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }
      }

      // Bounties API endpoints
      if (url.pathname.startsWith("/api/bounties")) {
        return handleBountiesAPI(request, env, url);
      }

      // User profile endpoints
      if (url.pathname.startsWith("/api/users")) {
        return handleUsersAPI(request, env, url, _ctx);
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

      // Notifications endpoints
      if (url.pathname.startsWith("/api/notifications")) {
        return handleNotificationsAPI(request, env, url);
      }

      // Notification preferences and mutes endpoints
      if (
        url.pathname.startsWith("/api/notification-preferences") ||
        url.pathname.startsWith("/api/notification-mutes")
      ) {
        return handleNotificationPreferencesAPI(request, env, url);
      }

      // Bookmarks endpoints
      if (url.pathname.startsWith("/api/bookmarks")) {
        return handleBookmarksAPI(request, env, url);
      }

      // Account linking endpoints
      if (url.pathname.startsWith("/api/account-linking")) {
        return handleAccountLinkingAPI(request, env, url);
      }

      // User deletion endpoint
      if (url.pathname.match(/^\/api\/user\/[^/]+$/)) {
        return handleUserDeletionAPI(request, env, url);
      }

      // Image upload endpoint
      if (url.pathname.startsWith("/api/upload/image")) {
        return handleImageUploadAPI(request, env, url);
      }

      // Image serving endpoint
      if (url.pathname.startsWith("/api/images/")) {
        return handleImageServingAPI(request, env, url);
      }

      // Proof of Work endpoints
      if (url.pathname.startsWith("/api/proof-of-work")) {
        return handleProofOfWorkAPI(request, env, url);
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
        },
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
  url: URL,
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
      SELECT b.*, s.name as sponsor_name, s.logo_url as sponsor_logo_url
      FROM bounties b
      LEFT JOIN sponsors s ON b.sponsor_id = s.id
      WHERE b.status != 'deleted'
      ORDER BY b.created_at DESC
    `,
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
      SELECT b.*,
             s.name as sponsor_name,
             s.logo_url as sponsor_logo_url,
             (SELECT COUNT(*) FROM bounty_submissions WHERE bounty_id = b.id) as submission_count
      FROM bounties b
      LEFT JOIN sponsors s ON b.sponsor_id = s.id
      WHERE b.id = ?
    `,
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
    try {
      const body = (await request.json()) as any;

      const id = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      // Get user_id from session or request
      const created_by = body.created_by || body.user_id;

      // Validate required fields
      if (!created_by) {
        return new Response(
          JSON.stringify({
            error: "User ID is required",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      if (!body.sponsor_id) {
        return new Response(
          JSON.stringify({
            error: "Sponsor ID is required",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      // Verify sponsor exists
      const sponsor = await env.DB.prepare(
        "SELECT id FROM sponsors WHERE id = ?",
      )
        .bind(body.sponsor_id)
        .first();

      if (!sponsor) {
        return new Response(
          JSON.stringify({
            error: "Sponsor not found",
          }),
          {
            status: 404,
            headers: corsHeaders,
          },
        );
      }

      // Verify user exists
      const user = await env.DB.prepare("SELECT id FROM user WHERE id = ?")
        .bind(created_by)
        .first();

      if (!user) {
        return new Response(
          JSON.stringify({
            error: "User not found",
          }),
          {
            status: 404,
            headers: corsHeaders,
          },
        );
      }

      // Convert arrays to JSON strings
      const requirements = JSON.stringify(body.requirements || []);
      const deliverables = JSON.stringify(body.deliverables || []);
      const skills = JSON.stringify(body.skills || []);

      // Build reward JSON
      const reward = JSON.stringify({
        token: body.reward_currency || "ALPH",
        amount: body.reward_amount || 0,
        usd_equivalent: body.reward_usd_value || 0,
      });

      // Normalize category and difficulty_level to lowercase for CHECK constraint
      const category = body.category ? body.category.toLowerCase() : null;
      const difficulty_level = body.difficulty_level
        ? body.difficulty_level.toLowerCase()
        : null;

      await env.DB.prepare(
        `
        INSERT INTO bounties (
          id, sponsor_id, title, description,
          requirements, deliverables, skills,
          reward, reward_type, reward_usd_value, tier_count,
          category, difficulty_level, dapp_name,
          start_date, end_date,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
        .bind(
          id,
          body.sponsor_id,
          body.title,
          body.description,
          requirements,
          deliverables,
          skills,
          reward,
          body.reward_type || "fixed",
          body.reward_usd_value || 0,
          body.tier_count || 5,
          category,
          difficulty_level,
          body.dapp_name || null,
          body.start_date,
          body.end_date,
          "open",
          now,
          now,
        )
        .run();

      const bounty = await env.DB.prepare("SELECT * FROM bounties WHERE id = ?")
        .bind(id)
        .first();

      // Update bounty_overview statistics
      try {
        // Get current overview
        const overview = await env.DB.prepare(
          "SELECT * FROM bounty_overview WHERE id = 1",
        ).first();

        // Calculate reward value - use USD value or ALPH amount
        const rewardCurrency = body.reward_currency || "ALPH";
        const rewardAmount = body.reward_amount || 0;
        const rewardUsdValue = body.reward_usd_value || 0;

        const rewardUsd =
          rewardCurrency === "USD" ? rewardAmount : rewardUsdValue;
        const rewardAlph = rewardCurrency === "ALPH" ? rewardAmount : 0;

        if (overview) {
          await env.DB.prepare(
            `UPDATE bounty_overview
             SET total_value_usd = total_value_usd + ?,
                 total_value_alph = total_value_alph + ?,
                 list_number = list_number + 1,
                 updated_at = ?
             WHERE id = 1`,
          )
            .bind(rewardUsd, rewardAlph, now)
            .run();
        } else {
          // Initialize overview if it doesn't exist
          await env.DB.prepare(
            `INSERT INTO bounty_overview (id, total_value_usd, total_value_alph, list_number, user_number, sponsor_number, updated_at)
             VALUES (1, ?, ?, 1, 0, 0, ?)`,
          )
            .bind(rewardUsd, rewardAlph, now)
            .run();
        }
      } catch (overviewError) {
        console.error("Failed to update bounty_overview:", overviewError);
        // Don't fail the bounty creation if overview update fails
      }

      return new Response(JSON.stringify({ bounty }), {
        status: 201,
        headers: corsHeaders,
      });
    } catch (error: any) {
      console.error("Error creating bounty:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to create bounty",
          details: error.message,
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // DELETE /api/bounties/:id - Delete (soft delete) a bounty
  if (
    request.method === "DELETE" &&
    pathname.match(/^\/api\/bounties\/[^/]+$/)
  ) {
    try {
      const id = pathname.split("/").pop();

      // Get the bounty before deleting to update overview
      const bounty = await env.DB.prepare(
        "SELECT reward, reward_usd_value, status FROM bounties WHERE id = ?",
      )
        .bind(id)
        .first();

      if (!bounty) {
        return new Response(JSON.stringify({ error: "Bounty not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      // Only update overview if bounty is not already deleted
      if (bounty.status !== "deleted") {
        const now = Math.floor(Date.now() / 1000);

        // Soft delete the bounty
        await env.DB.prepare(
          "UPDATE bounties SET status = 'deleted', updated_at = ? WHERE id = ?",
        )
          .bind(now, id)
          .run();

        // Update bounty_overview statistics
        try {
          // Parse reward JSON to get currency and amount
          const rewardData = JSON.parse(
            bounty.reward || '{"token":"ALPH","amount":0}',
          );
          const rewardCurrency = rewardData.token || "ALPH";
          const rewardAmount = rewardData.amount || 0;

          const rewardUsd =
            rewardCurrency === "USD"
              ? rewardAmount
              : bounty.reward_usd_value || 0;
          const rewardAlph = rewardCurrency === "ALPH" ? rewardAmount : 0;

          await env.DB.prepare(
            `UPDATE bounty_overview
             SET total_value_usd = CASE
                   WHEN total_value_usd - ? >= 0 THEN total_value_usd - ?
                   ELSE 0
                 END,
                 total_value_alph = CASE
                   WHEN total_value_alph - ? >= 0 THEN total_value_alph - ?
                   ELSE 0
                 END,
                 list_number = CASE
                   WHEN list_number > 0 THEN list_number - 1
                   ELSE 0
                 END,
                 updated_at = ?
             WHERE id = 1`,
          )
            .bind(rewardUsd, rewardUsd, rewardAlph, rewardAlph, now)
            .run();
        } catch (overviewError) {
          console.error(
            "Failed to update bounty_overview after deletion:",
            overviewError,
          );
          // Don't fail the deletion if overview update fails
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Bounty deleted successfully",
        }),
        {
          headers: corsHeaders,
        },
      );
    } catch (error: any) {
      console.error("Error deleting bounty:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to delete bounty",
          details: error.message,
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // PUT /api/bounties/:id - Update a bounty
  if (request.method === "PUT" && pathname.match(/^\/api\/bounties\/[^/]+$/)) {
    try {
      const id = pathname.split("/").pop();
      const body = (await request.json()) as any;
      const now = Math.floor(Date.now() / 1000);

      // Get the old bounty data to calculate overview changes
      const oldBounty = await env.DB.prepare(
        "SELECT reward, reward_usd_value, status FROM bounties WHERE id = ?",
      )
        .bind(id)
        .first();

      if (!oldBounty) {
        return new Response(JSON.stringify({ error: "Bounty not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];

      if (body.title !== undefined) {
        updates.push("title = ?");
        values.push(body.title);
      }
      if (body.description !== undefined) {
        updates.push("description = ?");
        values.push(body.description);
      }
      // Update reward JSON if reward fields provided
      if (
        body.reward_amount !== undefined ||
        body.reward_currency !== undefined
      ) {
        const oldRewardData = JSON.parse(
          oldBounty.reward || '{"token":"ALPH","amount":0}',
        );
        const newReward = JSON.stringify({
          token: body.reward_currency || oldRewardData.token || "ALPH",
          amount:
            body.reward_amount !== undefined
              ? body.reward_amount
              : oldRewardData.amount || 0,
          usd_equivalent:
            body.reward_usd_value !== undefined
              ? body.reward_usd_value
              : oldRewardData.usd_equivalent || 0,
        });
        updates.push("reward = ?");
        values.push(newReward);
      }
      if (body.reward_usd_value !== undefined) {
        updates.push("reward_usd_value = ?");
        values.push(body.reward_usd_value);
      }
      if (body.status !== undefined) {
        updates.push("status = ?");
        values.push(body.status);
      }
      if (body.category !== undefined) {
        updates.push("category = ?");
        values.push(body.category);
      }

      updates.push("updated_at = ?");
      values.push(now);
      values.push(id);

      if (updates.length > 1) {
        // More than just updated_at
        await env.DB.prepare(
          `UPDATE bounties SET ${updates.join(", ")} WHERE id = ?`,
        )
          .bind(...values)
          .run();

        // Update overview if reward changed
        if (
          body.reward_amount !== undefined ||
          body.reward_currency !== undefined ||
          body.reward_usd_value !== undefined
        ) {
          try {
            // Parse old reward
            const oldRewardData = JSON.parse(
              oldBounty.reward || '{"token":"ALPH","amount":0}',
            );
            const oldCurrency = oldRewardData.token || "ALPH";
            const oldAmount = oldRewardData.amount || 0;
            const oldRewardUsd =
              oldCurrency === "USD"
                ? oldAmount
                : oldBounty.reward_usd_value || 0;
            const oldRewardAlph = oldCurrency === "ALPH" ? oldAmount : 0;

            // Calculate new reward
            const newCurrency = body.reward_currency || oldCurrency;
            const newAmount =
              body.reward_amount !== undefined ? body.reward_amount : oldAmount;
            const newUsdValue =
              body.reward_usd_value !== undefined
                ? body.reward_usd_value
                : oldBounty.reward_usd_value || 0;
            const newRewardUsd =
              newCurrency === "USD" ? newAmount : newUsdValue;
            const newRewardAlph = newCurrency === "ALPH" ? newAmount : 0;

            const diffUsd = newRewardUsd - oldRewardUsd;
            const diffAlph = newRewardAlph - oldRewardAlph;

            await env.DB.prepare(
              `UPDATE bounty_overview
               SET total_value_usd = total_value_usd + ?,
                   total_value_alph = total_value_alph + ?,
                   updated_at = ?
               WHERE id = 1`,
            )
              .bind(diffUsd, diffAlph, now)
              .run();
          } catch (overviewError) {
            console.error(
              "Failed to update bounty_overview after edit:",
              overviewError,
            );
          }
        }
      }

      const updatedBounty = await env.DB.prepare(
        "SELECT * FROM bounties WHERE id = ?",
      )
        .bind(id)
        .first();

      return new Response(JSON.stringify({ bounty: updatedBounty }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      console.error("Error updating bounty:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to update bounty",
          details: error.message,
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
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
  url: URL,
  ctx?: any,
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
       WHERE up.username = ?`,
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
    const auth = createAuth(
      env.DB,
      {
        GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
        BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
        BETTER_AUTH_URL: env.BETTER_AUTH_URL,
        APP_URL: env.APP_URL,
        RESEND_API_KEY: env.RESEND_API_KEY,
        FROM_EMAIL: env.FROM_EMAIL,
      },
      ctx, // Pass ExecutionContext for background tasks
    );

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
      `SELECT * FROM user_profiles WHERE user_id = ?`,
    )
      .bind(userId)
      .first();

    if (!profile) {
      const profileId = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(
        `INSERT INTO user_profiles (id, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?)`,
      )
        .bind(profileId, userId, now, now)
        .run();

      profile = await env.DB.prepare(
        `SELECT * FROM user_profiles WHERE user_id = ?`,
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
      },
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
       WHERE up.user_id = ?`,
    )
      .bind(id)
      .first();

    // If user profile doesn't exist, create it
    if (!user) {
      const profileId = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(
        `INSERT INTO user_profiles (id, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?)`,
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
         WHERE up.user_id = ?`,
      )
        .bind(id)
        .first();
    }

    return new Response(JSON.stringify({ user }), {
      headers: corsHeaders,
    });
  }

  // GET /api/users/:id/stats - Get user public statistics
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/users\/[^/]+\/stats$/)
  ) {
    const id = pathname.split("/")[3]; // Extract user ID from /api/users/:id/stats

    // Get total submissions count
    const submissionsResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM bounty_submissions WHERE user_id = ?`,
    )
      .bind(id)
      .first();
    const totalSubmissions = (submissionsResult?.count as number) || 0;

    // Get approved submissions count (won)
    const wonResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM bounty_submissions WHERE user_id = ? AND status = 'approved'`,
    )
      .bind(id)
      .first();
    const totalWon = (wonResult?.count as number) || 0;

    // Get total earnings (sum of approved submission rewards in USD from feedback/reward field)
    const { results: approvedSubmissions } = await env.DB.prepare(
      `SELECT feedback, reward FROM bounty_submissions WHERE user_id = ? AND status = 'approved'`,
    )
      .bind(id)
      .all();

    let totalEarned = 0;
    for (const submission of approvedSubmissions) {
      // Try to get reward from the reward field first (if it's a JSON or number)
      if (submission.reward) {
        try {
          const rewardData =
            typeof submission.reward === "string"
              ? JSON.parse(submission.reward)
              : submission.reward;
          if (typeof rewardData === "object" && rewardData.usd_equivalent) {
            totalEarned += parseFloat(rewardData.usd_equivalent);
            continue;
          } else if (typeof rewardData === "number") {
            totalEarned += rewardData;
            continue;
          }
        } catch (e) {
          // Fall through to feedback parsing
        }
      }

      // Fallback: Extract USD amount from feedback notes
      const notes = submission.feedback as string;
      if (notes) {
        const usdMatch = notes.match(/for\s+\$?(\d+\.?\d*)\s*USD\s+bounty/i);
        if (usdMatch) {
          totalEarned += parseFloat(usdMatch[1]);
        }
      }
    }

    return new Response(
      JSON.stringify({
        stats: {
          submissions: totalSubmissions,
          won: totalWon,
          earned: totalEarned,
        },
      }),
      {
        headers: corsHeaders,
      },
    );
  }

  // PUT /api/users/:id - Update user profile
  if (request.method === "PUT" && pathname.match(/^\/api\/users\/[^/]+$/)) {
    const id = pathname.split("/").pop();
    const body = (await request.json()) as any;
    const now = Math.floor(Date.now() / 1000);

    // Check if username is taken (if provided and changed)
    if (body.username) {
      const existing = await env.DB.prepare(
        `SELECT id FROM user_profiles WHERE username = ? AND user_id != ?`,
      )
        .bind(body.username, id)
        .first();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Username already taken" }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }
    }

    // Update profile image in user table if provided
    if (body.image) {
      await env.DB.prepare(`UPDATE user SET image = ? WHERE id = ?`)
        .bind(body.image, id)
        .run();
    }

    // Update user name in user table if first/last name provided
    if (body.first_name || body.last_name) {
      const fullName =
        `${body.first_name || ""} ${body.last_name || ""}`.trim();
      if (fullName) {
        await env.DB.prepare(`UPDATE user SET name = ? WHERE id = ?`)
          .bind(fullName, id)
          .run();
      }
    }

    // Map frontend field names to database column names
    const github_url = body.github_url || body.github_username || null;
    const twitter_url = body.twitter_url || body.twitter_username || null;
    const linkedin_url = body.linkedin_url || body.linkedin_username || null;
    const telegram_url = body.telegram_url || body.telegram_username || null;
    const discord_url = body.discord_url || body.discord_username || null;
    const website_url = body.website_url || body.website || null;

    // Handle skills - accept either categorized skills or a single array
    let frontend_skills = body.frontend_skills || null;
    let backend_skills = body.backend_skills || null;
    let blockchain_skills = body.blockchain_skills || null;
    let design_skills = body.design_skills || null;
    let content_skills = body.content_skills || null;

    // If skills is provided as a single array, use it for all skill categories
    if (body.skills && Array.isArray(body.skills) && body.skills.length > 0) {
      const skillsJson = JSON.stringify(body.skills);
      frontend_skills = skillsJson;
      backend_skills = skillsJson;
      blockchain_skills = skillsJson;
    }

    // Update profile with all fields (allow clearing fields with empty strings)
    await env.DB.prepare(
      `UPDATE user_profiles
       SET username = ?,
           first_name = ?,
           last_name = ?,
           full_name = ?,
           bio = ?,
           avatar_url = ?,
           wallet_address = ?,
           github_url = ?,
           twitter_url = ?,
           linkedin_url = ?,
           telegram_url = ?,
           discord_url = ?,
           website_url = ?,
           location = ?,
           work_experience = ?,
           current_employer = ?,
           web3_interests = ?,
           web3_familiarity = ?,
           looking_for = ?,
           frontend_skills = ?,
           backend_skills = ?,
           blockchain_skills = ?,
           design_skills = ?,
           content_skills = ?,
           updated_at = ?
       WHERE user_id = ?`,
    )
      .bind(
        body.username || null,
        body.first_name || null,
        body.last_name || null,
        body.full_name || null,
        body.bio || null,
        body.avatar_url || null,
        body.wallet_address || null,
        github_url,
        twitter_url,
        linkedin_url,
        telegram_url,
        discord_url,
        website_url,
        body.location || null,
        body.work_experience || body.work_preference || null,
        body.current_employer || null,
        body.web3_interests ? JSON.stringify(body.web3_interests) : null,
        body.web3_familiarity || null,
        body.looking_for || null,
        frontend_skills,
        backend_skills,
        blockchain_skills,
        design_skills,
        content_skills,
        now,
        id,
      )
      .run();

    // Get updated user with image from user table
    const user = await env.DB.prepare(
      `SELECT up.*, u.image FROM user_profiles up
       JOIN user u ON up.user_id = u.id
       WHERE up.user_id = ?`,
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
