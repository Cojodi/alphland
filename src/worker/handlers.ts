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

  // GET /api/comments/bounty/:bountyId - Get bounty's comments
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/comments\/bounty\/[^/]+$/)
  ) {
    const bountyId = pathname.split("/").pop();

    const { results } = await env.DB.prepare(
      `SELECT c.*, u.username as user_username
       FROM bounty_comments c
       LEFT JOIN user_profiles u ON c.user_id = u.user_id
       WHERE c.bounty_id = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`
    )
      .bind(bountyId)
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
      `SELECT c.*, u.username as user_username
       FROM bounty_comments c
       LEFT JOIN user_profiles u ON c.user_id = u.user_id
       WHERE c.id = ?`
    )
      .bind(id)
      .first();

    return new Response(JSON.stringify({ comment }), {
      status: 201,
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

  // POST /api/sponsors - Create sponsor application
  if (request.method === "POST" && pathname === "/api/sponsors") {
    const body = (await request.json()) as any;
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO sponsors (
        id, user_id, name, username, description, entity_name, industry,
        logo_url, website, twitter, discord, telegram, wallet_address,
        contact_first_name, contact_last_name, contact_username, contact_telegram,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
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
        now,
        now
      )
      .run();

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

  // GET /api/sponsors - List all sponsors (for admin)
  if (request.method === "GET" && pathname === "/api/sponsors") {
    const status = url.searchParams.get("status");

    let query = `SELECT * FROM sponsors`;
    const params: string[] = [];

    if (status) {
      query += ` WHERE status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

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
