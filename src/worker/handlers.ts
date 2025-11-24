/**
 * API Handler Functions for Cloudflare Worker
 * Separate file for better organization
 */
import { Env } from "./index";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

/**
 * Handle Submissions API requests
 */
export async function handleSubmissionsAPI(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const pathname = url.pathname;

  // POST /api/submissions - Create submission
  if (request.method === "POST" && pathname === "/api/submissions") {
    const body = (await request.json()) as any;
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO bounty_submissions (
        id, bounty_id, submitted_by, submission_url, description,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
    )
      .bind(
        id,
        body.bounty_id,
        body.submitted_by,
        body.submission_url,
        body.description || null,
        now,
        now
      )
      .run();

    const submission = await env.DB.prepare(
      `SELECT * FROM bounty_submissions WHERE id = ?`
    )
      .bind(id)
      .first();

    return new Response(JSON.stringify({ submission }), {
      status: 201,
      headers: corsHeaders,
    });
  }

  // GET /api/submissions/:id - Get submission
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/submissions\/[^/]+$/)
  ) {
    const id = pathname.split("/").pop();

    const submission = await env.DB.prepare(
      `SELECT * FROM bounty_submissions WHERE id = ?`
    )
      .bind(id)
      .first();

    if (!submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ submission }), {
      headers: corsHeaders,
    });
  }

  // GET /api/submissions/user/:userId - Get user's submissions
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/submissions\/user\/[^/]+$/)
  ) {
    const userId = pathname.split("/").pop();

    const { results } = await env.DB.prepare(
      `SELECT s.*, b.title as bounty_title
       FROM bounty_submissions s
       JOIN bounties b ON s.bounty_id = b.id
       WHERE s.submitted_by = ?
       ORDER BY s.created_at DESC`
    )
      .bind(userId)
      .all();

    return new Response(JSON.stringify({ submissions: results }), {
      headers: corsHeaders,
    });
  }

  // GET /api/submissions/bounty/:bountyId - Get bounty's submissions
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/submissions\/bounty\/[^/]+$/)
  ) {
    const bountyId = pathname.split("/").pop();

    const { results } = await env.DB.prepare(
      `SELECT s.*, u.username as user_username
       FROM bounty_submissions s
       LEFT JOIN user_profiles u ON s.submitted_by = u.user_id
       WHERE s.bounty_id = ?
       ORDER BY s.created_at DESC`
    )
      .bind(bountyId)
      .all();

    return new Response(JSON.stringify({ submissions: results }), {
      headers: corsHeaders,
    });
  }

  // GET /api/submissions/sponsor/:sponsorId - Get sponsor's submissions
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/submissions\/sponsor\/[^/]+$/)
  ) {
    const sponsorId = pathname.split("/").pop();

    const { results } = await env.DB.prepare(
      `SELECT s.*, b.title as bounty_title, u.username as user_username
       FROM bounty_submissions s
       JOIN bounties b ON s.bounty_id = b.id
       LEFT JOIN user_profiles u ON s.submitted_by = u.user_id
       WHERE b.sponsor_id = ?
       ORDER BY s.created_at DESC`
    )
      .bind(sponsorId)
      .all();

    return new Response(JSON.stringify({ submissions: results }), {
      headers: corsHeaders,
    });
  }

  // PUT /api/submissions/:id - Update submission
  if (
    request.method === "PUT" &&
    pathname.match(/^\/api\/submissions\/[^/]+$/)
  ) {
    const id = pathname.split("/").pop();
    const body = (await request.json()) as any;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `UPDATE bounty_submissions
       SET status = ?,
           reviewer_notes = ?,
           transaction_hash = ?,
           reviewed_at = ?,
           updated_at = ?
       WHERE id = ?`
    )
      .bind(
        body.status,
        body.reviewer_notes || null,
        body.transaction_hash || null,
        now,
        now,
        id
      )
      .run();

    const submission = await env.DB.prepare(
      `SELECT * FROM bounty_submissions WHERE id = ?`
    )
      .bind(id)
      .first();

    return new Response(JSON.stringify({ submission }), {
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
}

/**
 * Handle Comments API requests
 */
export async function handleCommentsAPI(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const pathname = url.pathname;

  // GET /api/comments/bounty/:bountyId - Get bounty's comments with like counts
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/comments\/bounty\/[^/]+$/)
  ) {
    const bountyId = pathname.split("/").pop();
    const userId = url.searchParams.get("user_id");

    // Get comments with like counts and user info
    const { results } = await env.DB.prepare(
      `SELECT
        c.*,
        u.username as user_username,
        usr.image as user_avatar,
        (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count,
        ${
          userId
            ? `(SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) as user_liked`
            : "0 as user_liked"
        }
       FROM bounty_comments c
       LEFT JOIN user_profiles u ON c.user_id = u.user_id
       LEFT JOIN user usr ON c.user_id = usr.id
       WHERE c.bounty_id = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`
    )
      .bind(...(userId ? [userId, bountyId] : [bountyId]))
      .all();

    return new Response(JSON.stringify({ comments: results }), {
      headers: corsHeaders,
    });
  }

  // POST /api/comments - Create comment
  if (request.method === "POST" && pathname === "/api/comments") {
    const body = (await request.json()) as any;
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO bounty_comments (
        id, bounty_id, user_id, content, parent_comment_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.bounty_id,
        body.user_id,
        body.content,
        body.parent_comment_id || null,
        now,
        now
      )
      .run();

    const comment = await env.DB.prepare(
      `SELECT c.*, u.username as user_username, usr.image as user_avatar
       FROM bounty_comments c
       LEFT JOIN user_profiles u ON c.user_id = u.user_id
       LEFT JOIN user usr ON c.user_id = usr.id
       WHERE c.id = ?`
    )
      .bind(id)
      .first();

    return new Response(JSON.stringify({ comment }), {
      status: 201,
      headers: corsHeaders,
    });
  }

  // PUT /api/comments/:id - Edit comment
  if (request.method === "PUT" && pathname.match(/^\/api\/comments\/[^/]+$/)) {
    const id = pathname.split("/").pop();
    const body = (await request.json()) as any;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `UPDATE bounty_comments SET content = ?, updated_at = ? WHERE id = ?`
    )
      .bind(body.content, now, id)
      .run();

    const comment = await env.DB.prepare(
      `SELECT c.*, u.username as user_username, usr.image as user_avatar,
       (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count
       FROM bounty_comments c
       LEFT JOIN user_profiles u ON c.user_id = u.user_id
       LEFT JOIN user usr ON c.user_id = usr.id
       WHERE c.id = ?`
    )
      .bind(id)
      .first();

    return new Response(JSON.stringify({ comment }), {
      headers: corsHeaders,
    });
  }

  // DELETE /api/comments/:id - Delete comment (soft delete)
  if (
    request.method === "DELETE" &&
    pathname.match(/^\/api\/comments\/[^/]+$/)
  ) {
    const id = pathname.split("/").pop();
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `UPDATE bounty_comments SET deleted_at = ? WHERE id = ?`
    )
      .bind(now, id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  }

  // POST /api/comments/:id/like - Like a comment
  if (
    request.method === "POST" &&
    pathname.match(/^\/api\/comments\/[^/]+\/like$/)
  ) {
    const commentId = pathname.split("/").slice(-2)[0];
    const body = (await request.json()) as any;
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Check if already liked
    const existing = await env.DB.prepare(
      `SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?`
    )
      .bind(commentId, body.user_id)
      .first();

    if (existing) {
      return new Response(JSON.stringify({ error: "Already liked" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    await env.DB.prepare(
      `INSERT INTO comment_likes (id, comment_id, user_id, created_at)
       VALUES (?, ?, ?, ?)`
    )
      .bind(id, commentId, body.user_id, now)
      .run();

    const likeCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?`
    )
      .bind(commentId)
      .first();

    return new Response(
      JSON.stringify({ success: true, like_count: likeCount?.count || 0 }),
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  }

  // DELETE /api/comments/:id/like - Unlike a comment
  if (
    request.method === "DELETE" &&
    pathname.match(/^\/api\/comments\/[^/]+\/like$/)
  ) {
    const commentId = pathname.split("/").slice(-2)[0];
    const userId = url.searchParams.get("user_id");

    await env.DB.prepare(
      `DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?`
    )
      .bind(commentId, userId)
      .run();

    const likeCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?`
    )
      .bind(commentId)
      .first();

    return new Response(
      JSON.stringify({ success: true, like_count: likeCount?.count || 0 }),
      {
        headers: corsHeaders,
      }
    );
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
}

/**
 * Handle Sponsors API requests
 */
export async function handleSponsorsAPI(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const pathname = url.pathname;

  // GET /api/sponsors/:id - Get sponsor
  if (request.method === "GET" && pathname.match(/^\/api\/sponsors\/[^/]+$/)) {
    const id = pathname.split("/").pop();

    const sponsor = await env.DB.prepare(`SELECT * FROM sponsors WHERE id = ?`)
      .bind(id)
      .first();

    if (!sponsor) {
      return new Response(JSON.stringify({ error: "Sponsor not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ sponsor }), {
      headers: corsHeaders,
    });
  }

  // GET /api/sponsors/user/:userId - Get sponsor by user ID
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/sponsors\/user\/[^/]+$/)
  ) {
    const userId = pathname.split("/").pop();

    const sponsor = await env.DB.prepare(
      `SELECT * FROM sponsors WHERE user_id = ?`
    )
      .bind(userId)
      .first();

    if (!sponsor) {
      return new Response(JSON.stringify({ error: "Sponsor not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ sponsor }), {
      headers: corsHeaders,
    });
  }

  // POST /api/sponsors - Create sponsor (auto-approved)
  if (request.method === "POST" && pathname === "/api/sponsors") {
    const body = (await request.json()) as any;
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Check if is_banned column exists
    let hasNewColumns = false;
    try {
      await env.DB.prepare(`SELECT is_banned FROM sponsors LIMIT 1`).first();
      hasNewColumns = true;
    } catch {
      hasNewColumns = false;
    }

    if (hasNewColumns) {
      await env.DB.prepare(
        `INSERT INTO sponsors (
          id, user_id, name, username, description, entity_name, industry,
          logo_url, website, twitter, discord, telegram, wallet_address,
          contact_first_name, contact_last_name, contact_username, contact_telegram,
          status, approved_at, is_banned, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, 0, ?, ?)`
      )
        .bind(
          id,
          body.user_id,
          body.name,
          body.username || null,
          body.description || null,
          body.entity_name || null,
          body.industry || null,
          body.logo_url || null,
          body.website || null,
          body.twitter || null,
          body.discord || null,
          body.telegram || null,
          body.wallet_address || null,
          body.contact_first_name || null,
          body.contact_last_name || null,
          body.contact_username || null,
          body.contact_telegram || null,
          now, // approved_at
          now, // created_at
          now // updated_at
        )
        .run();
    } else {
      // Legacy insert without is_banned column
      await env.DB.prepare(
        `INSERT INTO sponsors (
          id, user_id, name, username, description, entity_name, industry,
          logo_url, website, twitter, discord, telegram, wallet_address,
          contact_first_name, contact_last_name, contact_username, contact_telegram,
          status, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)`
      )
        .bind(
          id,
          body.user_id,
          body.name,
          body.username || null,
          body.description || null,
          body.entity_name || null,
          body.industry || null,
          body.logo_url || null,
          body.website || null,
          body.twitter || null,
          body.discord || null,
          body.telegram || null,
          body.wallet_address || null,
          body.contact_first_name || null,
          body.contact_last_name || null,
          body.contact_username || null,
          body.contact_telegram || null,
          now, // approved_at
          now, // created_at
          now // updated_at
        )
        .run();
    }

    // Try to update user's is_sponsor flag (may fail if columns don't exist)
    try {
      await env.DB.prepare(
        `UPDATE user SET is_sponsor = 1, sponsor_id = ? WHERE id = ?`
      )
        .bind(id, body.user_id)
        .run();
    } catch {
      // Columns don't exist yet, skip
    }

    const sponsor = await env.DB.prepare(`SELECT * FROM sponsors WHERE id = ?`)
      .bind(id)
      .first();

    return new Response(JSON.stringify({ sponsor }), {
      status: 201,
      headers: corsHeaders,
    });
  }

  // PUT /api/sponsors/:id - Update sponsor
  if (request.method === "PUT" && pathname.match(/^\/api\/sponsors\/[^/]+$/)) {
    const id = pathname.split("/").pop();
    const body = (await request.json()) as any;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `UPDATE sponsors
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           logo_url = COALESCE(?, logo_url),
           website = COALESCE(?, website),
           twitter = COALESCE(?, twitter),
           discord = COALESCE(?, discord),
           telegram = COALESCE(?, telegram),
           wallet_address = COALESCE(?, wallet_address),
           updated_at = ?
       WHERE id = ?`
    )
      .bind(
        body.name || null,
        body.description || null,
        body.logo_url || null,
        body.website || null,
        body.twitter || null,
        body.discord || null,
        body.telegram || null,
        body.wallet_address || null,
        now,
        id
      )
      .run();

    const sponsor = await env.DB.prepare(`SELECT * FROM sponsors WHERE id = ?`)
      .bind(id)
      .first();

    return new Response(JSON.stringify({ sponsor }), {
      headers: corsHeaders,
    });
  }

  // PUT /api/sponsors/:id/approve - Approve sponsor
  if (
    request.method === "PUT" &&
    pathname.match(/^\/api\/sponsors\/[^/]+\/approve$/)
  ) {
    const id = pathname.split("/").slice(-2)[0];
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `UPDATE sponsors
       SET status = 'approved',
           approved_at = ?,
           rejected_at = NULL,
           rejection_reason = NULL,
           updated_at = ?
       WHERE id = ?`
    )
      .bind(now, now, id)
      .run();

    const sponsor = await env.DB.prepare(`SELECT * FROM sponsors WHERE id = ?`)
      .bind(id)
      .first();

    if (!sponsor) {
      return new Response(JSON.stringify({ error: "Sponsor not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ sponsor }), {
      headers: corsHeaders,
    });
  }

  // PUT /api/sponsors/:id/reject - Reject sponsor
  if (
    request.method === "PUT" &&
    pathname.match(/^\/api\/sponsors\/[^/]+\/reject$/)
  ) {
    const id = pathname.split("/").slice(-2)[0];
    const body = (await request.json()) as any;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `UPDATE sponsors
       SET status = 'rejected',
           rejected_at = ?,
           rejection_reason = ?,
           approved_at = NULL,
           updated_at = ?
       WHERE id = ?`
    )
      .bind(now, body.reason || null, now, id)
      .run();

    const sponsor = await env.DB.prepare(`SELECT * FROM sponsors WHERE id = ?`)
      .bind(id)
      .first();

    if (!sponsor) {
      return new Response(JSON.stringify({ error: "Sponsor not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ sponsor }), {
      headers: corsHeaders,
    });
  }

  // PUT /api/sponsors/:id/ban - Ban sponsor
  if (
    request.method === "PUT" &&
    pathname.match(/^\/api\/sponsors\/[^/]+\/ban$/)
  ) {
    const id = pathname.split("/").slice(-2)[0];
    const now = Math.floor(Date.now() / 1000);

    // Get sponsor to find user_id
    const sponsor = (await env.DB.prepare(`SELECT * FROM sponsors WHERE id = ?`)
      .bind(id)
      .first()) as any;

    if (!sponsor) {
      return new Response(JSON.stringify({ error: "Sponsor not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Check if is_banned column exists
    let hasNewColumns = false;
    try {
      await env.DB.prepare(`SELECT is_banned FROM sponsors LIMIT 1`).first();
      hasNewColumns = true;
    } catch {
      hasNewColumns = false;
    }

    if (!hasNewColumns) {
      return new Response(
        JSON.stringify({
          error:
            "Ban feature requires database migration. Please run: sql/d1/15_sponsor_ban_fields.sql",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Ban the sponsor
    await env.DB.prepare(
      `UPDATE sponsors
       SET is_banned = 1,
           banned_at = ?,
           updated_at = ?
       WHERE id = ?`
    )
      .bind(now, now, id)
      .run();

    // Also ban the user (set is_banned on user table)
    try {
      await env.DB.prepare(`UPDATE user SET is_banned = 1 WHERE id = ?`)
        .bind(sponsor.user_id)
        .run();
    } catch {
      // User columns don't exist yet
    }

    const updatedSponsor = await env.DB.prepare(
      `SELECT * FROM sponsors WHERE id = ?`
    )
      .bind(id)
      .first();

    return new Response(JSON.stringify({ sponsor: updatedSponsor }), {
      headers: corsHeaders,
    });
  }

  // PUT /api/sponsors/:id/unban - Unban sponsor
  if (
    request.method === "PUT" &&
    pathname.match(/^\/api\/sponsors\/[^/]+\/unban$/)
  ) {
    const id = pathname.split("/").slice(-2)[0];
    const now = Math.floor(Date.now() / 1000);

    // Get sponsor to find user_id
    const sponsor = (await env.DB.prepare(`SELECT * FROM sponsors WHERE id = ?`)
      .bind(id)
      .first()) as any;

    if (!sponsor) {
      return new Response(JSON.stringify({ error: "Sponsor not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Check if is_banned column exists
    let hasNewColumns = false;
    try {
      await env.DB.prepare(`SELECT is_banned FROM sponsors LIMIT 1`).first();
      hasNewColumns = true;
    } catch {
      hasNewColumns = false;
    }

    if (!hasNewColumns) {
      return new Response(
        JSON.stringify({
          error:
            "Unban feature requires database migration. Please run: sql/d1/15_sponsor_ban_fields.sql",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Unban the sponsor
    await env.DB.prepare(
      `UPDATE sponsors
       SET is_banned = 0,
           banned_at = NULL,
           updated_at = ?
       WHERE id = ?`
    )
      .bind(now, id)
      .run();

    // Also unban the user
    try {
      await env.DB.prepare(`UPDATE user SET is_banned = 0 WHERE id = ?`)
        .bind(sponsor.user_id)
        .run();
    } catch {
      // User columns don't exist yet
    }

    const updatedSponsor = await env.DB.prepare(
      `SELECT * FROM sponsors WHERE id = ?`
    )
      .bind(id)
      .first();

    return new Response(JSON.stringify({ sponsor: updatedSponsor }), {
      headers: corsHeaders,
    });
  }

  // GET /api/sponsors - List all sponsors (for admin)
  if (request.method === "GET" && pathname === "/api/sponsors") {
    const isBanned = url.searchParams.get("is_banned");
    const status = url.searchParams.get("status");

    // Check if is_banned column exists
    let hasIsBannedColumn = false;
    try {
      await env.DB.prepare(`SELECT is_banned FROM sponsors LIMIT 1`).first();
      hasIsBannedColumn = true;
    } catch {
      hasIsBannedColumn = false;
    }

    let query = `SELECT s.*, b.bounty_count
                 FROM sponsors s
                 LEFT JOIN (
                   SELECT sponsor_id, COUNT(*) as bounty_count
                   FROM bounties
                   GROUP BY sponsor_id
                 ) b ON s.id = b.sponsor_id`;
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    // Only filter by is_banned if column exists
    if (isBanned !== null && hasIsBannedColumn) {
      conditions.push(`s.is_banned = ?`);
      params.push(isBanned === "true" ? 1 : 0);
    }

    if (status) {
      conditions.push(`s.status = ?`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const stmt = env.DB.prepare(query);
    const { results } =
      params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

    return new Response(JSON.stringify({ sponsors: results }), {
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
}

/**
 * Handle Notifications API requests
 */
export async function handleNotificationsAPI(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const pathname = url.pathname;

  // GET /api/notifications/user/:userId - Get user's notifications
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/notifications\/user\/[^/]+$/)
  ) {
    const userId = pathname.split("/").pop();
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const unreadOnly = url.searchParams.get("unread_only") === "true";

    let query = `SELECT * FROM notifications WHERE user_id = ?`;
    if (unreadOnly) {
      query += ` AND read = 0`;
    }
    query += ` ORDER BY created_at DESC LIMIT ?`;

    const { results } = await env.DB.prepare(query).bind(userId, limit).all();

    // Get unread count
    const unreadCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0`
    )
      .bind(userId)
      .first();

    return new Response(
      JSON.stringify({
        notifications: results,
        unread_count: unreadCount?.count || 0,
      }),
      {
        headers: corsHeaders,
      }
    );
  }

  // POST /api/notifications - Create notification
  if (request.method === "POST" && pathname === "/api/notifications") {
    const body = (await request.json()) as any;
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO notifications (
        id, user_id, type, title, message, link, read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
    )
      .bind(
        id,
        body.user_id,
        body.type,
        body.title,
        body.message,
        body.link || null,
        now
      )
      .run();

    const notification = await env.DB.prepare(
      `SELECT * FROM notifications WHERE id = ?`
    )
      .bind(id)
      .first();

    return new Response(JSON.stringify({ notification }), {
      status: 201,
      headers: corsHeaders,
    });
  }

  // PUT /api/notifications/:id/read - Mark notification as read
  if (
    request.method === "PUT" &&
    pathname.match(/^\/api\/notifications\/[^/]+\/read$/)
  ) {
    const id = pathname.split("/").slice(-2)[0];

    await env.DB.prepare(`UPDATE notifications SET read = 1 WHERE id = ?`)
      .bind(id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  }

  // PUT /api/notifications/user/:userId/read-all - Mark all notifications as read
  if (
    request.method === "PUT" &&
    pathname.match(/^\/api\/notifications\/user\/[^/]+\/read-all$/)
  ) {
    const userId = pathname.split("/").slice(-2)[0];

    await env.DB.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`)
      .bind(userId)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  }

  // DELETE /api/notifications/:id - Delete notification
  if (
    request.method === "DELETE" &&
    pathname.match(/^\/api\/notifications\/[^/]+$/)
  ) {
    const id = pathname.split("/").pop();

    await env.DB.prepare(`DELETE FROM notifications WHERE id = ?`)
      .bind(id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
}

/**
 * Handle Notification Preferences API requests
 */
export async function handleNotificationPreferencesAPI(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const pathname = url.pathname;

  // GET /api/notification-preferences/user/:userId - Get user's preferences
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/notification-preferences\/user\/[^/]+$/)
  ) {
    const userId = pathname.split("/").pop();

    const { results } = await env.DB.prepare(
      `SELECT * FROM notification_preferences WHERE user_id = ?`
    )
      .bind(userId)
      .all();

    return new Response(JSON.stringify({ preferences: results }), {
      headers: corsHeaders,
    });
  }

  // GET /api/notification-preferences/bounty/:bountyId - Get preference for specific bounty
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/notification-preferences\/bounty\/[^/]+$/)
  ) {
    const bountyId = pathname.split("/").pop();
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const preference = await env.DB.prepare(
      `SELECT * FROM notification_preferences WHERE user_id = ? AND bounty_id = ?`
    )
      .bind(userId, bountyId)
      .first();

    return new Response(JSON.stringify({ preference: preference || null }), {
      headers: corsHeaders,
    });
  }

  // POST /api/notification-preferences - Create or update preference
  if (
    request.method === "POST" &&
    pathname === "/api/notification-preferences"
  ) {
    const body = (await request.json()) as any;
    const now = Math.floor(Date.now() / 1000);

    // Check if preference exists
    const existing = await env.DB.prepare(
      `SELECT id FROM notification_preferences WHERE user_id = ? AND bounty_id = ?`
    )
      .bind(body.user_id, body.bounty_id)
      .first();

    if (existing) {
      // Update existing
      await env.DB.prepare(
        `UPDATE notification_preferences
         SET mute_comments = ?, mute_submissions = ?, updated_at = ?
         WHERE id = ?`
      )
        .bind(
          body.mute_comments ? 1 : 0,
          body.mute_submissions ? 1 : 0,
          now,
          (existing as any).id
        )
        .run();
    } else {
      // Create new
      const id = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO notification_preferences (
          id, user_id, bounty_id, mute_comments, mute_submissions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          body.user_id,
          body.bounty_id,
          body.mute_comments ? 1 : 0,
          body.mute_submissions ? 1 : 0,
          now,
          now
        )
        .run();
    }

    const preference = await env.DB.prepare(
      `SELECT * FROM notification_preferences WHERE user_id = ? AND bounty_id = ?`
    )
      .bind(body.user_id, body.bounty_id)
      .first();

    return new Response(JSON.stringify({ preference }), {
      status: 201,
      headers: corsHeaders,
    });
  }

  // DELETE /api/notification-preferences/:id - Delete preference
  if (
    request.method === "DELETE" &&
    pathname.match(/^\/api\/notification-preferences\/[^/]+$/)
  ) {
    const id = pathname.split("/").pop();

    await env.DB.prepare(`DELETE FROM notification_preferences WHERE id = ?`)
      .bind(id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
}

/**
 * Helper function to create a notification
 */
export async function createNotification(
  env: Env,
  data: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }
): Promise<void> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    `INSERT INTO notifications (
      id, user_id, type, title, message, link, read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
  )
    .bind(
      id,
      data.user_id,
      data.type,
      data.title,
      data.message,
      data.link || null,
      now
    )
    .run();
}

/**
 * Helper to check if notifications are muted for a bounty
 */
export async function isNotificationMuted(
  env: Env,
  userId: string,
  bountyId: string,
  type: "comments" | "submissions"
): Promise<boolean> {
  const preference = (await env.DB.prepare(
    `SELECT * FROM notification_preferences WHERE user_id = ? AND bounty_id = ?`
  )
    .bind(userId, bountyId)
    .first()) as any;

  if (!preference) return false;

  return type === "comments"
    ? preference.mute_comments === 1
    : preference.mute_submissions === 1;
}
