/**
 * Cloudflare Worker for Alphland API
 * This worker handles API requests and connects to D1 database
 */
import { createAuth } from "./auth";
import { verifySignedMessage } from "@alephium/web3";
import { DAPP_LIST } from "./dappList";
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
  handleSubmitDappAPI,
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
  GITHUB_ISSUES_TOKEN?: string; // GitHub token for creating issues
  GITHUB_BOT_TOKEN?: string; // unused — dApp submissions use GITHUB_ISSUES_TOKEN
  INTERNAL_SECRET?: string; // shared secret for internal Vercel → Worker calls
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

      // ==========================================
      // Admin Analytics APIs
      // ==========================================

      // GET /api/admin/user-stats - User statistics overview
      if (url.pathname === "/api/admin/user-stats") {
        const nowMs = Date.now();
        // better-auth stores createdAt as ISO strings — compare using ISO format
        const todayStartIso = new Date(
          nowMs - (nowMs % (86400 * 1000)),
        ).toISOString();
        const weekAgoIso = new Date(nowMs - 7 * 86400 * 1000).toISOString();
        const monthAgoIso = new Date(nowMs - 30 * 86400 * 1000).toISOString();
        const twoWeeksAgoIso = new Date(
          nowMs - 14 * 86400 * 1000,
        ).toISOString();

        // Total users
        const totalUsers = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM user`,
        ).first();

        // New users today
        const newToday = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM user WHERE createdAt >= ?`,
        )
          .bind(todayStartIso)
          .first();

        // New users this week
        const newThisWeek = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM user WHERE createdAt >= ?`,
        )
          .bind(weekAgoIso)
          .first();

        // New users this month
        const newThisMonth = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM user WHERE createdAt >= ?`,
        )
          .bind(monthAgoIso)
          .first();

        // WAU - users with sessions in last 7 days
        const wau = await env.DB.prepare(
          `SELECT COUNT(DISTINCT userId) as count FROM session WHERE createdAt >= ?`,
        )
          .bind(weekAgoIso)
          .first();

        // MAU - users with sessions in last 30 days
        const mau = await env.DB.prepare(
          `SELECT COUNT(DISTINCT userId) as count FROM session WHERE createdAt >= ?`,
        )
          .bind(monthAgoIso)
          .first();

        // Daily new users for last 14 days (for trend chart)
        const { results: dailyTrend } = await env.DB.prepare(
          `SELECT
            DATE(createdAt) as date,
            COUNT(*) as count
          FROM user
          WHERE createdAt >= ?
          GROUP BY DATE(createdAt)
          ORDER BY date ASC`,
        )
          .bind(twoWeeksAgoIso)
          .all();

        return new Response(
          JSON.stringify({
            total_users: totalUsers?.count || 0,
            new_today: newToday?.count || 0,
            new_this_week: newThisWeek?.count || 0,
            new_this_month: newThisMonth?.count || 0,
            wau: wau?.count || 0,
            mau: mau?.count || 0,
            daily_trend: dailyTrend || [],
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      // GET /api/admin/users - User list with search
      if (url.pathname === "/api/admin/users") {
        const search = url.searchParams.get("search") || "";
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        // Try query with is_banned column first, fallback without it
        let query = `
          SELECT
            u.id, u.email, u.name, u.image, COALESCE(u.is_banned, 0) as is_banned, u.createdAt,
            COALESCE(u.role, NULL) as role,
            up.username, up.wallet_address,
            (SELECT COUNT(*) FROM bounty_submissions WHERE user_id = u.id) as submission_count,
            (SELECT COUNT(*) FROM bounty_submissions WHERE user_id = u.id AND status = 'approved') as approved_count,
            (SELECT COUNT(*) FROM bookmarks WHERE user_id = u.id) as bookmark_count
          FROM user u
          LEFT JOIN user_profiles up ON u.id = up.user_id
        `;

        const params: any[] = [];
        if (search) {
          query += ` WHERE u.email LIKE ? OR u.name LIKE ? OR up.username LIKE ?`;
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY u.createdAt DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        let results;
        try {
          const response = await env.DB.prepare(query)
            .bind(...params)
            .all();
          results = response.results;
        } catch (error) {
          // Fallback query without is_banned if column doesn't exist
          console.error(
            "Admin users query failed, trying without is_banned:",
            error,
          );
          let fallbackQuery = `
            SELECT
              u.id, u.email, u.name, u.image, 0 as is_banned, u.createdAt,
              NULL as role,
              up.username, up.wallet_address,
              (SELECT COUNT(*) FROM bounty_submissions WHERE user_id = u.id) as submission_count,
              (SELECT COUNT(*) FROM bounty_submissions WHERE user_id = u.id AND status = 'approved') as approved_count,
              (SELECT COUNT(*) FROM bookmarks WHERE user_id = u.id) as bookmark_count
            FROM user u
            LEFT JOIN user_profiles up ON u.id = up.user_id
          `;
          const fallbackParams: any[] = [];
          if (search) {
            fallbackQuery += ` WHERE u.email LIKE ? OR u.name LIKE ? OR up.username LIKE ?`;
            fallbackParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
          }
          fallbackQuery += ` ORDER BY u.createdAt DESC LIMIT ? OFFSET ?`;
          fallbackParams.push(limit, offset);
          const response = await env.DB.prepare(fallbackQuery)
            .bind(...fallbackParams)
            .all();
          results = response.results;
        }

        // Get total count
        let countQuery = `SELECT COUNT(*) as count FROM user u LEFT JOIN user_profiles up ON u.id = up.user_id`;
        if (search) {
          countQuery += ` WHERE u.email LIKE ? OR u.name LIKE ? OR up.username LIKE ?`;
          const countResult = await env.DB.prepare(countQuery)
            .bind(`%${search}%`, `%${search}%`, `%${search}%`)
            .first();
          return new Response(
            JSON.stringify({ users: results, total: countResult?.count || 0 }),
            { headers: { "Content-Type": "application/json", ...corsHeaders } },
          );
        }

        const countResult = await env.DB.prepare(countQuery).first();
        return new Response(
          JSON.stringify({ users: results, total: countResult?.count || 0 }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      // GET /api/admin/users/:id - User details
      if (url.pathname.match(/^\/api\/admin\/users\/[^/]+$/)) {
        const userId = url.pathname.split("/").pop();

        const user = await env.DB.prepare(
          `SELECT u.*, up.username, up.bio, up.wallet_address, up.location
           FROM user u
           LEFT JOIN user_profiles up ON u.id = up.user_id
           WHERE u.id = ?`,
        )
          .bind(userId)
          .first();

        if (!user) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Recent sessions (last 10)
        const { results: sessions } = await env.DB.prepare(
          `SELECT ipAddress, userAgent, createdAt
           FROM session
           WHERE userId = ?
           ORDER BY createdAt DESC
           LIMIT 10`,
        )
          .bind(userId)
          .all();

        // User submissions
        const { results: submissions } = await env.DB.prepare(
          `SELECT s.*, b.title as bounty_title
           FROM bounty_submissions s
           JOIN bounties b ON s.bounty_id = b.id
           WHERE s.user_id = ?
           ORDER BY s.created_at DESC
           LIMIT 20`,
        )
          .bind(userId)
          .all();

        // User bookmarks
        const { results: bookmarks } = await env.DB.prepare(
          `SELECT bm.*, b.title, b.status
           FROM bookmarks bm
           JOIN bounties b ON bm.bounty_id = b.id
           WHERE bm.user_id = ?
           ORDER BY bm.created_at DESC
           LIMIT 20`,
        )
          .bind(userId)
          .all();

        return new Response(
          JSON.stringify({ user, sessions, submissions, bookmarks }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      // PUT /api/admin/users/:id/ban - Ban user
      if (
        request.method === "PUT" &&
        url.pathname.match(/^\/api\/admin\/users\/[^/]+\/ban$/)
      ) {
        const userId = url.pathname.split("/")[4];
        const now = Date.now();

        try {
          await env.DB.prepare(
            `UPDATE user SET is_banned = 1, updatedAt = ? WHERE id = ?`,
          )
            .bind(now, userId)
            .run();

          // Also ban their sponsor if they have one (ignore errors if columns don't exist)
          try {
            await env.DB.prepare(
              `UPDATE sponsors SET is_banned = 1, banned_at = ?, updated_at = ? WHERE user_id = ?`,
            )
              .bind(Math.floor(now / 1000), Math.floor(now / 1000), userId)
              .run();
          } catch {
            // Sponsor ban columns may not exist yet
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (error) {
          console.error("Failed to ban user:", error);
          return new Response(
            JSON.stringify({
              error:
                "Failed to ban user. Please run migration 020_add_user_is_banned.sql first.",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }
      }

      // PUT /api/admin/users/:id/unban - Unban user
      if (
        request.method === "PUT" &&
        url.pathname.match(/^\/api\/admin\/users\/[^/]+\/unban$/)
      ) {
        const userId = url.pathname.split("/")[4];
        const now = Date.now();

        try {
          await env.DB.prepare(
            `UPDATE user SET is_banned = 0, updatedAt = ? WHERE id = ?`,
          )
            .bind(now, userId)
            .run();

          // Also unban their sponsor if they have one (ignore errors if columns don't exist)
          try {
            await env.DB.prepare(
              `UPDATE sponsors SET is_banned = 0, banned_at = NULL, updated_at = ? WHERE user_id = ?`,
            )
              .bind(Math.floor(now / 1000), userId)
              .run();
          } catch {
            // Sponsor ban columns may not exist yet
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (error) {
          console.error("Failed to unban user:", error);
          return new Response(
            JSON.stringify({
              error:
                "Failed to unban user. Please run migration 020_add_user_is_banned.sql first.",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }
      }

      // GET /api/admin/submission-stats - Submission analysis
      if (url.pathname === "/api/admin/submission-stats") {
        // Total submissions and approved
        const totals = await env.DB.prepare(
          `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
          FROM bounty_submissions`,
        ).first();

        // Users who have submitted
        const usersWithSubmissions = await env.DB.prepare(
          `SELECT COUNT(DISTINCT user_id) as count FROM bounty_submissions`,
        ).first();

        // Average submissions per user (who submitted)
        const avgSubmissions = usersWithSubmissions?.count
          ? (totals?.total || 0) / (usersWithSubmissions.count as number)
          : 0;

        // Global acceptance rate
        const acceptanceRate = totals?.total
          ? ((totals.approved as number) / (totals.total as number)) * 100
          : 0;

        // Top success rate users (min 2 submissions)
        const { results: topUsers } = await env.DB.prepare(
          `SELECT
            s.user_id,
            u.name,
            u.email,
            up.username,
            COUNT(*) as total_submissions,
            SUM(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END) as approved,
            ROUND(SUM(CASE WHEN s.status = 'approved' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as success_rate
          FROM bounty_submissions s
          JOIN user u ON s.user_id = u.id
          LEFT JOIN user_profiles up ON s.user_id = up.user_id
          GROUP BY s.user_id
          HAVING COUNT(*) >= 2
          ORDER BY success_rate DESC, approved DESC
          LIMIT 10`,
        ).all();

        // Average reward for approved submissions
        // Get reward from bounties table, not submissions
        const avgReward = await env.DB.prepare(
          `SELECT AVG(
             CASE
               WHEN b.reward_currency = 'USD' THEN b.reward_amount
               ELSE COALESCE(b.reward_usd_value, 0)
             END
           ) as avg_amount
           FROM bounty_submissions s
           JOIN bounties b ON s.bounty_id = b.id
           WHERE s.status = 'approved'`,
        ).first();

        return new Response(
          JSON.stringify({
            total_submissions: totals?.total || 0,
            approved_submissions: totals?.approved || 0,
            users_with_submissions: usersWithSubmissions?.count || 0,
            avg_submissions_per_user: Math.round(avgSubmissions * 10) / 10,
            acceptance_rate: Math.round(acceptanceRate * 10) / 10,
            avg_reward: avgReward?.avg_amount || 0,
            top_users: topUsers || [],
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      // GET /api/admin/bounty-popularity - Bounty popularity stats
      if (url.pathname === "/api/admin/bounty-popularity") {
        // Most bookmarked bounties
        const { results: mostBookmarked } = await env.DB.prepare(
          `SELECT
            b.id, b.title, b.status,
            COALESCE(sp.name, 'Unknown') as sponsor_name,
            COUNT(bm.id) as bookmark_count
          FROM bounties b
          LEFT JOIN sponsors sp ON b.sponsor_id = sp.id
          LEFT JOIN bookmarks bm ON b.id = bm.bounty_id
          WHERE b.status != 'deleted'
          GROUP BY b.id
          ORDER BY bookmark_count DESC
          LIMIT 10`,
        ).all();

        // Most submissions bounties
        const { results: mostSubmissions } = await env.DB.prepare(
          `SELECT
            b.id, b.title, b.status,
            COALESCE(sp.name, 'Unknown') as sponsor_name,
            COUNT(s.id) as submission_count
          FROM bounties b
          LEFT JOIN sponsors sp ON b.sponsor_id = sp.id
          LEFT JOIN bounty_submissions s ON b.id = s.bounty_id
          WHERE b.status != 'deleted'
          GROUP BY b.id
          ORDER BY submission_count DESC
          LIMIT 10`,
        ).all();

        // Most comments bounties
        const { results: mostComments } = await env.DB.prepare(
          `SELECT
            b.id, b.title, b.status,
            COALESCE(sp.name, 'Unknown') as sponsor_name,
            COUNT(c.id) as comment_count
          FROM bounties b
          LEFT JOIN sponsors sp ON b.sponsor_id = sp.id
          LEFT JOIN bounty_comments c ON b.id = c.bounty_id AND c.deleted_at IS NULL
          WHERE b.status != 'deleted'
          GROUP BY b.id
          ORDER BY comment_count DESC
          LIMIT 10`,
        ).all();

        return new Response(
          JSON.stringify({
            most_bookmarked: mostBookmarked || [],
            most_submissions: mostSubmissions || [],
            most_comments: mostComments || [],
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      // ==========================================
      // End Admin Analytics APIs
      // ==========================================

      // Bounty overview stats endpoint - compute dynamically
      if (url.pathname === "/api/bounty-overview") {
        // Get bounty stats
        const bountyStats = await env.DB.prepare(
          `SELECT
            COUNT(*) as list_number,
            COALESCE(SUM(CASE WHEN reward_currency = 'USD' THEN reward_amount ELSE 0 END), 0) as total_value_usd,
            COALESCE(SUM(CASE WHEN reward_currency = 'ALPH' THEN reward_amount ELSE 0 END), 0) as total_value_alph
          FROM bounties`,
        ).first();

        // Get user count
        const userCount = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM user`,
        ).first();

        // Get sponsor count (non-banned if column exists, otherwise all)
        let sponsorCount;
        try {
          sponsorCount = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM sponsors WHERE is_banned = 0 OR is_banned IS NULL`,
          ).first();
        } catch {
          // Fallback if is_banned column doesn't exist yet
          sponsorCount = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM sponsors`,
          ).first();
        }

        const overview = {
          id: 1,
          total_value_usd: bountyStats?.total_value_usd || 0,
          total_value_alph: bountyStats?.total_value_alph || 0,
          list_number: bountyStats?.list_number || 0,
          user_number: userCount?.count || 0,
          sponsor_number: sponsorCount?.count || 0,
          updated_at: Math.floor(Date.now() / 1000),
        };

        return new Response(JSON.stringify({ overview }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Recent earners endpoint - users with submissions in past week
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
            HAVING COUNT(s.id) >= 1
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

      // Wallet endpoints
      if (url.pathname.startsWith("/api/wallet")) {
        return handleUsersAPI(request, env, url, _ctx);
      }

      // Internal endpoints (active-addresses counts, etc.)
      if (url.pathname.startsWith("/api/internal")) {
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

      // GitHub Issues API - for report submissions
      if (url.pathname === "/api/github/issues" && request.method === "POST") {
        if (!env.GITHUB_ISSUES_TOKEN) {
          return new Response(
            JSON.stringify({ error: "GitHub token not configured" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        try {
          const body = (await request.json()) as {
            title: string;
            body: string;
            labels?: string[];
          };

          if (!body.title || !body.body) {
            return new Response(
              JSON.stringify({ error: "Title and body are required" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          const githubResponse = await fetch(
            "https://api.github.com/repos/alph-land/alphland/issues",
            {
              method: "POST",
              headers: {
                Authorization: `token ${env.GITHUB_ISSUES_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
                "User-Agent": "Alphland-Report-Bot",
              },
              body: JSON.stringify({
                title: body.title,
                body: body.body,
                labels: body.labels || ["report"],
              }),
            },
          );

          if (!githubResponse.ok) {
            const errorData = await githubResponse.text();
            console.error("GitHub API error:", errorData);
            return new Response(
              JSON.stringify({
                error: "Failed to create issue",
                details: errorData,
              }),
              {
                status: githubResponse.status,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              },
            );
          }

          const issue = (await githubResponse.json()) as {
            html_url: string;
            number: number;
          };
          return new Response(
            JSON.stringify({
              success: true,
              issue_url: issue.html_url,
              issue_number: issue.number,
            }),
            {
              status: 201,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        } catch (error) {
          console.error("Error creating GitHub issue:", error);
          return new Response(
            JSON.stringify({
              error: "Failed to create issue",
              message: error instanceof Error ? error.message : "Unknown error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }
      }

      // dApp submission endpoint
      if (url.pathname === "/api/submit-dapp" && request.method === "POST") {
        return handleSubmitDappAPI(request, env, url);
      }

      // Apple App Store compliance list: name, developer, url only
      if (url.pathname === "/api/dapp-list" && request.method === "GET") {
        return new Response(JSON.stringify(DAPP_LIST), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            ...corsHeaders,
          },
        });
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

  // ── Scheduled: index active addresses from Alephium Explorer ──────────────
  // Runs every hour via cron trigger. Reads the cursor from indexer_state,
  // fetches blocks since last run, extracts sender addresses, and upserts into
  // active_addresses. After 7 days the dashboard will show real data.
  async scheduled(_event: any, env: Env, ctx: any): Promise<void> {
    const EXPLORER = "https://lb-fullnode-alephium.notrustverify.ch";
    const MAX_WINDOW_MS = 2 * 60 * 60_000; // process at most 2 hours per run
    const now = Date.now();

    try {
      // Read cursor — if missing, start 1 hour ago (collect forward from now)
      const cursorRow = (await env.DB.prepare(
        `SELECT value FROM indexer_state WHERE key = 'active_addr_cursor'`,
      ).first()) as { value: string } | null;

      const fromTs = cursorRow?.value
        ? Math.min(Number(cursorRow.value), now - 60_000)
        : now - 60 * 60_000;

      const toTs = Math.min(now, fromTs + MAX_WINDOW_MS);

      // Fetch blocks in the time window
      const res = await fetch(
        `${EXPLORER}/blockflow/blocks?fromTs=${fromTs}&toTs=${toTs}`,
        { headers: { Accept: "application/json" } },
      );

      if (!res.ok) {
        console.error(`[active-addr] blocks fetch failed: ${res.status}`);
        return;
      }

      type AlphOutput = { address?: string };
      type AlphTx = {
        unsigned?: { inputs?: unknown[]; fixedOutputs?: AlphOutput[] };
      };
      type AlphBlock = { timestamp?: number; transactions?: AlphTx[] };
      const data = (await res.json()) as { blocks?: AlphBlock[][] };

      if (!Array.isArray(data?.blocks)) {
        console.warn("[active-addr] unexpected blocks response shape");
        return;
      }

      // Collect address → max timestamp seen (from fixedOutputs; skip coinbase txs)
      const addrMap = new Map<string, number>();
      for (const shardBlocks of data.blocks) {
        for (const block of shardBlocks) {
          const ts = block.timestamp ?? toTs;
          for (const tx of block.transactions ?? []) {
            // Skip coinbase transactions (no inputs)
            if (
              !Array.isArray(tx.unsigned?.inputs) ||
              tx.unsigned.inputs.length === 0
            )
              continue;
            for (const output of tx.unsigned?.fixedOutputs ?? []) {
              if (output.address) {
                const prev = addrMap.get(output.address) ?? 0;
                addrMap.set(output.address, Math.max(prev, ts));
              }
            }
          }
        }
      }

      console.log(
        `[active-addr] window ${new Date(fromTs).toISOString()} → ${new Date(toTs).toISOString()}: ${addrMap.size} unique senders`,
      );

      // Batch upsert in chunks of 100 to stay within D1 batch limits
      if (addrMap.size > 0) {
        const stmt = env.DB.prepare(
          `INSERT INTO active_addresses (address, last_seen_at) VALUES (?, ?)
           ON CONFLICT(address) DO UPDATE
             SET last_seen_at = MAX(last_seen_at, excluded.last_seen_at)`,
        );
        const entries = Array.from(addrMap.entries());
        for (let i = 0; i < entries.length; i += 100) {
          const chunk = entries.slice(i, i + 100);
          await env.DB.batch(
            chunk.map(([addr, ts]: [string, number]) => stmt.bind(addr, ts)),
          );
        }
      }

      // Advance cursor
      await env.DB.prepare(
        `INSERT INTO indexer_state (key, value) VALUES ('active_addr_cursor', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
        .bind(String(toTs))
        .run();

      // Cleanup in background — don't block the scheduled handler
      ctx.waitUntil(
        env.DB.prepare(`DELETE FROM active_addresses WHERE last_seen_at < ?`)
          .bind(now - 31 * 24 * 3600_000)
          .run(),
      );
    } catch (err: any) {
      console.error("[active-addr] scheduled error:", err?.message ?? err);
    }
  },
};

export default worker;

/**
 * Transform bounty object to include computed reward field for backwards compatibility
 */
function transformBounty(bounty: any) {
  if (!bounty) return bounty;
  return {
    ...bounty,
    reward: {
      amount: bounty.reward_amount || 0,
      token: bounty.reward_currency || "ALPH",
      usd_equivalent: bounty.reward_usd_value || 0,
    },
  };
}

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

  // GET /api/bounties - List all bounties (with optional dapp_name filter)
  if (request.method === "GET" && pathname === "/api/bounties") {
    const dappName = url.searchParams.get("dapp_name");

    let query = `
      SELECT b.*, s.name as sponsor_name, s.logo_url as sponsor_logo_url,
             s.is_verified as sponsor_is_verified,
             (SELECT COUNT(*) FROM bounty_submissions WHERE bounty_id = b.id) as submission_count
      FROM bounties b
      LEFT JOIN sponsors s ON b.sponsor_id = s.id
      WHERE b.status != 'deleted'
    `;

    const params: string[] = [];

    // Filter by dapp_name if provided (case-insensitive)
    if (dappName) {
      query += ` AND LOWER(b.dapp_name) = LOWER(?)`;
      params.push(dappName);
    }

    query += ` ORDER BY b.created_at DESC`;

    const { results } =
      params.length > 0
        ? await env.DB.prepare(query)
            .bind(...params)
            .all()
        : await env.DB.prepare(query).all();

    return new Response(
      JSON.stringify({ bounties: results.map(transformBounty) }),
      {
        headers: corsHeaders,
      },
    );
  }

  // GET /api/bounties/:id - Get single bounty
  if (request.method === "GET" && pathname.match(/^\/api\/bounties\/[^/]+$/)) {
    const id = pathname.split("/").pop();
    const bounty = await env.DB.prepare(
      `
      SELECT b.*,
             s.name as sponsor_name,
             s.logo_url as sponsor_logo_url,
             s.is_verified as sponsor_is_verified,
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

    return new Response(JSON.stringify({ bounty: transformBounty(bounty) }), {
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

      // Verify sponsor exists and is verified
      const sponsor = (await env.DB.prepare(
        "SELECT id, is_verified, is_banned FROM sponsors WHERE id = ?",
      )
        .bind(body.sponsor_id)
        .first()) as {
        id: string;
        is_verified: number;
        is_banned: number;
      } | null;

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

      // God users bypass the is_verified check
      const creatorRole = (await env.DB.prepare(
        "SELECT role FROM user WHERE id = ?",
      )
        .bind(created_by)
        .first()) as { role: string | null } | null;
      const creatorIsGod = creatorRole?.role === "god";

      if (!sponsor.is_verified && !creatorIsGod) {
        return new Response(
          JSON.stringify({
            error:
              "Sponsor account is pending review. Please wait for admin approval before creating bounties.",
          }),
          {
            status: 403,
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

      // Normalize category and difficulty to lowercase for CHECK constraint
      const category = body.category ? body.category.toLowerCase() : null;
      const difficulty =
        body.difficulty || body.difficulty_level
          ? (body.difficulty || body.difficulty_level).toLowerCase()
          : null;

      await env.DB.prepare(
        `
        INSERT INTO bounties (
          id, sponsor_id, title, description,
          requirements, deliverables, skills,
          reward_amount, reward_currency, reward_type, reward_usd_value, tier_count,
          category, difficulty, dapp_name,
          start_date, end_date,
          status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          body.reward_amount || 0,
          body.reward_currency || "ALPH",
          body.reward_type || "fixed",
          body.reward_usd_value || 0,
          body.tier_count || 5,
          category,
          difficulty,
          body.dapp_name || null,
          body.start_date,
          body.end_date,
          "open",
          created_by,
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

      return new Response(JSON.stringify({ bounty: transformBounty(bounty) }), {
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

  // POST /api/bounties/:id/republish - Create a new copy of an existing bounty with updated dates
  if (
    request.method === "POST" &&
    pathname.match(/^\/api\/bounties\/[^/]+\/republish$/)
  ) {
    try {
      const id = pathname.split("/")[3];
      const body = (await request.json()) as {
        user_id: string;
        end_date: string;
        start_date?: string;
      };

      if (!body.user_id || !body.end_date) {
        return new Response(
          JSON.stringify({ error: "user_id and end_date are required" }),
          { status: 400, headers: corsHeaders },
        );
      }

      const original = (await env.DB.prepare(
        "SELECT * FROM bounties WHERE id = ? AND status != 'deleted'",
      )
        .bind(id)
        .first()) as any | null;

      if (!original) {
        return new Response(JSON.stringify({ error: "Bounty not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      // Verify the requesting user owns the sponsor, or is a god user
      const sponsor = (await env.DB.prepare(
        "SELECT user_id FROM sponsors WHERE id = ?",
      )
        .bind(original.sponsor_id)
        .first()) as { user_id: string } | null;

      const creatorRole = (await env.DB.prepare(
        "SELECT role FROM user WHERE id = ?",
      )
        .bind(body.user_id)
        .first()) as { role: string | null } | null;
      const isGod = creatorRole?.role === "god";

      if (!isGod && sponsor?.user_id !== body.user_id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: corsHeaders,
        });
      }

      const newId = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);
      const startDate =
        body.start_date || new Date().toISOString().split("T")[0];

      await env.DB.prepare(
        `INSERT INTO bounties (
          id, sponsor_id, title, description,
          requirements, deliverables, skills,
          reward_amount, reward_currency, reward_type, reward_usd_value, tier_count,
          category, difficulty, dapp_name,
          start_date, end_date,
          status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          newId,
          original.sponsor_id,
          original.title,
          original.description,
          original.requirements,
          original.deliverables,
          original.skills,
          original.reward_amount,
          original.reward_currency,
          original.reward_type,
          original.reward_usd_value,
          original.tier_count,
          original.category,
          original.difficulty,
          original.dapp_name,
          startDate,
          body.end_date,
          "open",
          body.user_id,
          now,
          now,
        )
        .run();

      // Update bounty_overview
      try {
        const rewardCurrency = original.reward_currency || "ALPH";
        const rewardUsd =
          rewardCurrency === "USD"
            ? original.reward_amount
            : original.reward_usd_value || 0;
        const rewardAlph =
          rewardCurrency === "ALPH" ? original.reward_amount : 0;

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
      } catch {
        // don't fail if overview update fails
      }

      const newBounty = await env.DB.prepare(
        "SELECT * FROM bounties WHERE id = ?",
      )
        .bind(newId)
        .first();

      return new Response(
        JSON.stringify({ bounty: transformBounty(newBounty) }),
        { status: 201, headers: corsHeaders },
      );
    } catch (error: any) {
      console.error("Error republishing bounty:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to republish bounty",
          details: error.message,
        }),
        { status: 500, headers: corsHeaders },
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
        "SELECT reward_amount, reward_currency, reward_usd_value, status FROM bounties WHERE id = ?",
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
          // Get reward values from actual columns
          const rewardCurrency = bounty.reward_currency || "ALPH";
          const rewardAmount = bounty.reward_amount || 0;

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
        "SELECT reward_amount, reward_currency, reward_usd_value, status FROM bounties WHERE id = ?",
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
      // Update reward fields if provided
      if (body.reward_amount !== undefined) {
        updates.push("reward_amount = ?");
        values.push(body.reward_amount);
      }
      if (body.reward_currency !== undefined) {
        updates.push("reward_currency = ?");
        values.push(body.reward_currency);
      }
      if (body.reward_usd_value !== undefined) {
        updates.push("reward_usd_value = ?");
        values.push(body.reward_usd_value);
      }
      if (body.status !== undefined) {
        updates.push("status = ?");
        // "closed" is not in the DB CHECK constraint — store as "cancelled"
        values.push(body.status === "closed" ? "cancelled" : body.status);
      }
      if (body.category !== undefined) {
        updates.push("category = ?");
        values.push(body.category);
      }
      if (body.start_date !== undefined) {
        updates.push("start_date = ?");
        values.push(body.start_date);
      }
      if (body.end_date !== undefined) {
        updates.push("end_date = ?");
        values.push(body.end_date);
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
            // Get old reward values from actual columns
            const oldCurrency = oldBounty.reward_currency || "ALPH";
            const oldAmount = oldBounty.reward_amount || 0;
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

      return new Response(
        JSON.stringify({ bounty: transformBounty(updatedBounty) }),
        {
          headers: corsHeaders,
        },
      );
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
  // Get the origin from the request for CORS
  const requestOrigin = request.headers.get("Origin");
  const allowedOrigin =
    requestOrigin ||
    env.APP_URL ||
    env.BETTER_AUTH_URL ||
    "http://localhost:3000";

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
  };

  const pathname = url.pathname;

  // GET /api/users/username/:username - Get user profile by username
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/users\/username\/[^/]+$/)
  ) {
    try {
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

      // Transform data to match frontend expectations
      const transformedUser = {
        ...user,
        // Map username fields to URL fields for frontend compatibility
        github_url: user.github_username || null,
        twitter_url: user.twitter_username || null,
        discord_url: user.discord_url || user.discord_username || null, // Keep discord_url as is
        linkedin_url: user.linkedin_username || null,
        telegram_url: user.telegram_username || null,
        website_url: user.website || null,
        // Map skills field to frontend_skills for backward compatibility
        frontend_skills: user.skills || null,
        backend_skills: null, // These are no longer separate in the DB
        blockchain_skills: null,
      };

      return new Response(JSON.stringify({ user: transformedUser }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      console.error("Error fetching user by username:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch user",
          message: error.message || "Unknown error",
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // GET /api/users/me - Get current user's profile (requires auth)
  if (request.method === "GET" && pathname === "/api/users/me") {
    try {
      console.log("[GET /api/users/me] Request received");
      console.log(
        "[GET /api/users/me] Cookie header:",
        request.headers.get("Cookie")?.substring(0, 100),
      );

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
      console.log(
        "[GET /api/users/me] Session found:",
        session?.user ? "yes" : "no",
      );

      if (!session?.user) {
        console.log("[GET /api/users/me] No session, returning 401");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const userId = session.user.id;
      console.log("[GET /api/users/me] User ID:", userId);

      // Get or create user profile
      let profile = await env.DB.prepare(
        `SELECT * FROM user_profiles WHERE user_id = ?`,
      )
        .bind(userId)
        .first();

      if (!profile) {
        console.log("[GET /api/users/me] Profile not found, creating new one");
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
        console.log("[GET /api/users/me] New profile created");
      }

      console.log(
        "[GET /api/users/me] Profile found, username:",
        profile?.username || "none",
      );
      console.log("[GET /api/users/me] Returning user data");

      // Check if user has a Google account linked
      const googleAccount = await env.DB.prepare(
        `SELECT id, accountId FROM account WHERE userId = ? AND providerId = 'google'`,
      )
        .bind(userId)
        .first();

      // Transform data to match frontend expectations
      const transformedProfile = {
        ...profile,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        // Map username fields to URL fields for frontend compatibility
        github_url: profile.github_username || null,
        twitter_url: profile.twitter_username || null,
        discord_url: profile.discord_url || profile.discord_username || null,
        linkedin_url: profile.linkedin_username || null,
        telegram_url: profile.telegram_username || null,
        website_url: profile.website || null,
        // Map skills field to individual skill categories for EditProfile
        frontend_skills: profile.skills || null,
        backend_skills: null,
        blockchain_skills: null,
        // Google linked account info
        isGoogleLinked: !!googleAccount,
        googleName: googleAccount ? session.user.name : null,
      };

      return new Response(
        JSON.stringify({
          user: transformedProfile,
        }),
        {
          headers: corsHeaders,
        },
      );
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch profile",
          message: error.message || "Unknown error",
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // GET /api/users/:id - Get user profile by user_id
  if (request.method === "GET" && pathname.match(/^\/api\/users\/[^/]+$/)) {
    try {
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

      // Transform data to match frontend expectations
      const transformedUser = {
        ...user,
        // Map username fields to URL fields for frontend compatibility
        github_url: user.github_username || null,
        twitter_url: user.twitter_username || null,
        discord_url: user.discord_url || user.discord_username || null,
        linkedin_url: user.linkedin_username || null,
        telegram_url: user.telegram_username || null,
        website_url: user.website || null,
        // Map skills field to individual skill categories
        frontend_skills: user.skills || null,
        backend_skills: null,
        blockchain_skills: null,
      };

      return new Response(JSON.stringify({ user: transformedUser }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      console.error("Error fetching user by id:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch user",
          message: error.message || "Unknown error",
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // GET /api/users/:id/stats - Get user public statistics
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/users\/[^/]+\/stats$/)
  ) {
    try {
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

      // Get total earnings (sum of approved submission rewards in USD from reviewer_notes field)
      const { results: approvedSubmissions } = await env.DB.prepare(
        `SELECT reviewer_notes FROM bounty_submissions WHERE user_id = ? AND status = 'approved'`,
      )
        .bind(id)
        .all();

      let totalEarned = 0;
      let totalAlphEarned = 0;
      for (const submission of approvedSubmissions) {
        // Format written by SubmissionReviewModal: "Reward: X ALPH (for Y USD bounty)"
        // Extract both the actual ALPH paid and the USD reference value.
        // Handle legacy entries with locale-formatted numbers (e.g. "1,500").
        const notes = submission.reviewer_notes as string;
        if (notes) {
          const usdMatch = notes.match(
            /for\s+\$?([\d,]+\.?\d*)\s*USD\s+bounty/i,
          );
          if (usdMatch) {
            totalEarned += parseFloat(usdMatch[1].replace(/,/g, ""));
          }
          const alphMatch = notes.match(/Reward:\s+([\d.]+)\s*ALPH/i);
          if (alphMatch) {
            totalAlphEarned += parseFloat(alphMatch[1]);
          }
        }
      }

      return new Response(
        JSON.stringify({
          stats: {
            submissions: totalSubmissions,
            won: totalWon,
            earned: totalEarned,
            alph_earned: totalAlphEarned,
          },
        }),
        {
          headers: corsHeaders,
        },
      );
    } catch (error: any) {
      console.error("Error fetching user stats:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch user stats",
          message: error.message || "Unknown error",
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // PUT /api/god/current-sponsor - God users switch their active sponsor context
  if (request.method === "PUT" && pathname === "/api/god/current-sponsor") {
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
      ctx,
    );
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const roleRow = (await env.DB.prepare("SELECT role FROM user WHERE id = ?")
      .bind(session.user.id)
      .first()) as { role: string | null } | null;
    if (roleRow?.role !== "god") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders,
      });
    }
    const body = (await request.json()) as { sponsor_id: string | null };
    const now = Date.now();
    await env.DB.prepare(
      "UPDATE user SET sponsor_id = ?, updatedAt = ? WHERE id = ?",
    )
      .bind(body.sponsor_id ?? null, now, session.user.id)
      .run();
    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  }

  // PUT /api/users/:id - Update user profile
  if (request.method === "PUT" && pathname.match(/^\/api\/users\/[^/]+$/)) {
    try {
      const id = pathname.split("/").pop();
      const body = (await request.json()) as any;
      const now = Math.floor(Date.now() / 1000);

      // Check if profile exists, create if it doesn't (fail-safe in case trigger didn't run)
      const profile = await env.DB.prepare(
        `SELECT id FROM user_profiles WHERE user_id = ?`,
      )
        .bind(id)
        .first();

      if (!profile) {
        console.log(
          `[PUT /api/users/${id}] Profile not found, creating new one`,
        );
        const profileId = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO user_profiles (id, user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?)`,
        )
          .bind(profileId, id, now, now)
          .run();
      }

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

      // Handle discord_url separately (it's the only social field that has a _url column)
      const discord_url = body.discord_url || null;

      // Combine skills into single JSON field (DB only has one 'skills' column)
      let skillsJson = null;
      if (body.skills && Array.isArray(body.skills) && body.skills.length > 0) {
        skillsJson = JSON.stringify(body.skills);
      }

      // Prepare web3_interests JSON
      const web3InterestsJson =
        body.web3_interests && Array.isArray(body.web3_interests)
          ? JSON.stringify(body.web3_interests)
          : null;

      console.log(
        `[PUT /api/users/${id}] Updating profile with skills:`,
        skillsJson,
      );
      console.log(
        `[PUT /api/users/${id}] Updating profile with web3_interests:`,
        web3InterestsJson,
      );
      console.log(
        `[PUT /api/users/${id}] Updating profile with social links:`,
        {
          github: body.github_username,
          twitter: body.twitter_username,
          discord: body.discord_username,
          linkedin: body.linkedin_username,
          telegram: body.telegram_username,
          website: body.website,
        },
      );

      // Update profile with fields that match the actual database schema
      // When username is set, mark is_default_username = 0 (user has set a custom username)
      const updateResult = await env.DB.prepare(
        `UPDATE user_profiles
         SET username = ?,
             bio = ?,
             wallet_address = ?,
             github_username = ?,
             twitter_username = ?,
             linkedin_username = ?,
             telegram_username = ?,
             discord_username = ?,
             discord_url = ?,
             website = ?,
             location = ?,
             work_preference = ?,
             current_employer = ?,
             web3_interests = ?,
             web3_familiarity = ?,
             looking_for = ?,
             skills = ?,
             is_default_username = CASE WHEN ? IS NOT NULL THEN 0 ELSE is_default_username END,
             updated_at = ?
         WHERE user_id = ?`,
      )
        .bind(
          body.username || null,
          body.bio || null,
          body.wallet_address || null,
          body.github_username || null,
          body.twitter_username || null,
          body.linkedin_username || null,
          body.telegram_username || null,
          body.discord_username || null,
          discord_url,
          body.website || null,
          body.location || null,
          body.work_preference || null,
          body.current_employer || null,
          web3InterestsJson,
          body.web3_familiarity || null,
          body.looking_for || null,
          skillsJson,
          body.username || null, // Used for is_default_username CASE check
          now,
          id,
        )
        .run();

      console.log(
        `[PUT /api/users/${id}] Update result:`,
        updateResult.meta.changes,
        "rows affected",
      );

      // Verify the update was successful
      if (updateResult.meta.changes === 0) {
        console.error(`[PUT /api/users/${id}] WARNING: Update affected 0 rows`);
      }

      // Get updated user with image from user table
      const user = await env.DB.prepare(
        `SELECT up.*, u.image FROM user_profiles up
         JOIN user u ON up.user_id = u.id
         WHERE up.user_id = ?`,
      )
        .bind(id)
        .first();

      console.log(
        `[PUT /api/users/${id}] Profile updated successfully for user:`,
        user?.username,
      );

      return new Response(JSON.stringify({ user }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to update profile",
          message: error.message || "Unknown error",
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // POST /api/wallet/nonce - Generate nonce for wallet binding
  if (request.method === "POST" && url.pathname === "/api/wallet/nonce") {
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
        ctx,
      );
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: corsHeaders,
        });
      }
      const userId = session.user.id;
      const nonce = crypto.randomUUID();
      const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 minutes

      await env.DB.prepare("DELETE FROM wallet_nonces WHERE user_id = ?")
        .bind(userId)
        .run();
      await env.DB.prepare(
        "INSERT INTO wallet_nonces (id, user_id, nonce, expires_at) VALUES (?, ?, ?, ?)",
      )
        .bind(crypto.randomUUID(), userId, nonce, expiresAt)
        .run();

      return new Response(JSON.stringify({ nonce }), { headers: corsHeaders });
    } catch (error: any) {
      console.error("[POST /api/wallet/nonce] Error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // POST /api/wallet/bind - Verify signature and bind wallet address
  if (request.method === "POST" && url.pathname === "/api/wallet/bind") {
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
        ctx,
      );
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: corsHeaders,
        });
      }
      const userId = session.user.id;
      const body = (await request.json()) as {
        address: string;
        publicKey: string;
        signature: string;
        nonce: string;
      };

      // Validate nonce
      const nonceRow = (await env.DB.prepare(
        "SELECT nonce, expires_at FROM wallet_nonces WHERE user_id = ? AND nonce = ?",
      )
        .bind(userId, body.nonce)
        .first()) as { nonce: string; expires_at: number } | null;

      if (!nonceRow) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired nonce" }),
          { status: 400, headers: corsHeaders },
        );
      }
      if (nonceRow.expires_at < Math.floor(Date.now() / 1000)) {
        await env.DB.prepare("DELETE FROM wallet_nonces WHERE user_id = ?")
          .bind(userId)
          .run();
        return new Response(JSON.stringify({ error: "Nonce expired" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Verify Alephium signature
      const message = `Bind wallet to Alphland: ${body.nonce}`;
      const isValid = verifySignedMessage(
        message,
        "alephium",
        body.publicKey,
        body.signature,
      );
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Check address not already bound to another account
      const existing = (await env.DB.prepare(
        "SELECT user_id FROM user_profiles WHERE wallet_address = ? AND user_id != ?",
      )
        .bind(body.address, userId)
        .first()) as { user_id: string } | null;
      if (existing) {
        return new Response(
          JSON.stringify({
            error: "This wallet address is already bound to another account",
          }),
          { status: 400, headers: corsHeaders },
        );
      }

      // Consume nonce and save wallet address
      const now = Math.floor(Date.now() / 1000);
      await env.DB.prepare("DELETE FROM wallet_nonces WHERE user_id = ?")
        .bind(userId)
        .run();
      await env.DB.prepare(
        "UPDATE user_profiles SET wallet_address = ?, updated_at = ? WHERE user_id = ?",
      )
        .bind(body.address, now, userId)
        .run();

      console.log(
        `[POST /api/wallet/bind] Wallet ${body.address} bound to user ${userId}`,
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      console.error("[POST /api/wallet/bind] Error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // POST /api/wallet/unbind - Remove bound wallet address
  if (request.method === "POST" && url.pathname === "/api/wallet/unbind") {
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
        ctx,
      );
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: corsHeaders,
        });
      }
      const userId = session.user.id;
      const now = Math.floor(Date.now() / 1000);
      await env.DB.prepare(
        "UPDATE user_profiles SET wallet_address = NULL, updated_at = ? WHERE user_id = ?",
      )
        .bind(now, userId)
        .run();

      console.log(
        `[POST /api/wallet/unbind] Wallet unbound for user ${userId}`,
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: corsHeaders,
      });
    } catch (error: any) {
      console.error("[POST /api/wallet/unbind] Error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // ── Internal: active address indexing ──────────────────────────────────────
  // POST /api/internal/active-addresses — batch upsert addresses + update cursor
  if (
    url.pathname === "/api/internal/active-addresses" &&
    request.method === "POST"
  ) {
    const authHeader = request.headers.get("Authorization");
    if (
      !env.INTERNAL_SECRET ||
      authHeader !== `Bearer ${env.INTERNAL_SECRET}`
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    try {
      const body = (await request.json()) as {
        addresses?: { address: string; ts: number }[];
        cursor?: number;
      };
      const { addresses = [], cursor } = body;

      // Batch upsert — keep the most recent last_seen_at per address
      if (addresses.length > 0) {
        const stmt = env.DB.prepare(
          `INSERT INTO active_addresses (address, last_seen_at) VALUES (?, ?)
           ON CONFLICT(address) DO UPDATE
             SET last_seen_at = MAX(last_seen_at, excluded.last_seen_at)`,
        );
        await env.DB.batch(
          addresses.map(({ address, ts }: { address: string; ts: number }) =>
            stmt.bind(address, ts),
          ),
        );
      }

      // Update cursor
      if (cursor != null) {
        await env.DB.prepare(
          `INSERT INTO indexer_state (key, value) VALUES ('active_addr_cursor', ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        )
          .bind(String(cursor))
          .run();
      }

      // Clean up entries older than 31 days
      await env.DB.prepare(
        `DELETE FROM active_addresses WHERE last_seen_at < ?`,
      )
        .bind(Date.now() - 31 * 24 * 3600_000)
        .run();

      return new Response(
        JSON.stringify({ ok: true, indexed: addresses.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // GET /api/internal/active-addresses/counts — return 7d/30d unique address counts
  if (
    url.pathname === "/api/internal/active-addresses/counts" &&
    request.method === "GET"
  ) {
    const authHeader = request.headers.get("Authorization");
    if (
      !env.INTERNAL_SECRET ||
      authHeader !== `Bearer ${env.INTERNAL_SECRET}`
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    try {
      const now = Date.now();
      const [r7d, r30d, cursorRow] = (await Promise.all([
        env.DB.prepare(
          `SELECT COUNT(*) as c FROM active_addresses WHERE last_seen_at > ?`,
        )
          .bind(now - 7 * 24 * 3600_000)
          .first(),
        env.DB.prepare(
          `SELECT COUNT(*) as c FROM active_addresses WHERE last_seen_at > ?`,
        )
          .bind(now - 30 * 24 * 3600_000)
          .first(),
        env.DB.prepare(
          `SELECT value FROM indexer_state WHERE key = 'active_addr_cursor'`,
        ).first(),
      ])) as [
        { c: number } | null,
        { c: number } | null,
        { value: string } | null,
      ];

      return new Response(
        JSON.stringify({
          count7d: r7d?.c ?? 0,
          count30d: r30d?.c ?? 0,
          cursor: cursorRow?.value ? Number(cursorRow.value) : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
}
