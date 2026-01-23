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
 * Handle Submissions API requests
 */
export async function handleSubmissionsAPI(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const pathname = url.pathname;

  // POST /api/submissions - Create submission
  if (request.method === "POST" && pathname === "/api/submissions") {
    try {
      const body = (await request.json()) as any;

      console.log("Creating submission:", {
        bounty_id: body.bounty_id,
        user_id: body.user_id || body.submitted_by,
        submission_url: body.submission_url,
        description: body.description,
      });

      // Validate required fields
      if (
        !body.bounty_id ||
        !(body.user_id || body.submitted_by) ||
        !body.submission_url
      ) {
        console.log("Missing required fields:", {
          bounty_id: !!body.bounty_id,
          user_id: !!(body.user_id || body.submitted_by),
          submission_url: !!body.submission_url,
        });
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const id = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(
        `INSERT INTO bounty_submissions (
          id, bounty_id, user_id, submission_url, description,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
      )
        .bind(
          id,
          body.bounty_id,
          body.submitted_by || body.user_id,
          body.submission_url,
          body.description || null,
          now,
          now,
        )
        .run();

      const submission = await env.DB.prepare(
        `SELECT * FROM bounty_submissions WHERE id = ?`,
      )
        .bind(id)
        .first();

      return new Response(JSON.stringify({ submission }), {
        status: 201,
        headers: corsHeaders,
      });
    } catch (error: any) {
      console.error("Error creating submission:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to create submission",
          details: error.message,
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // GET /api/submissions/check - Check if user has submitted to a bounty
  // NOTE: This must come BEFORE /api/submissions/:id to avoid "check" matching as an ID
  if (request.method === "GET" && pathname === "/api/submissions/check") {
    const userId = url.searchParams.get("user_id");
    const bountyId = url.searchParams.get("bounty_id");

    if (!userId || !bountyId) {
      return new Response(
        JSON.stringify({ error: "user_id and bounty_id are required" }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const submission = await env.DB.prepare(
      `SELECT s.*, b.title as bounty_title
       FROM bounty_submissions s
       JOIN bounties b ON s.bounty_id = b.id
       WHERE s.user_id = ? AND s.bounty_id = ?
       ORDER BY s.created_at DESC
       LIMIT 1`,
    )
      .bind(userId, bountyId)
      .first();

    return new Response(
      JSON.stringify({
        hasSubmitted: !!submission,
        submission: submission || null,
      }),
      {
        headers: corsHeaders,
      },
    );
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
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
    )
      .bind(userId)
      .all();

    return new Response(JSON.stringify({ submissions: results }), {
      headers: corsHeaders,
    });
  }

  // GET /api/submissions/:id - Get submission
  // NOTE: This must come AFTER specific routes like /check, /user/:id, /bounty/:id
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/submissions\/[^/]+$/)
  ) {
    const id = pathname.split("/").pop();

    const submission = await env.DB.prepare(
      `SELECT * FROM bounty_submissions WHERE id = ?`,
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

  // GET /api/submissions/bounty/:bountyId - Get bounty's submissions
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/submissions\/bounty\/[^/]+$/)
  ) {
    const bountyId = pathname.split("/").pop();

    const { results } = await env.DB.prepare(
      `SELECT s.*,
              up.username as user_username,
              u.name as user_full_name,
              u.image as user_avatar_url
       FROM bounty_submissions s
       LEFT JOIN user u ON s.user_id = u.id
       LEFT JOIN user_profiles up ON s.user_id = up.user_id
       WHERE s.bounty_id = ?
       ORDER BY s.created_at DESC`,
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
      `SELECT s.*,
              b.title as bounty_title,
              b.title as bounty_name,
              b.sponsor_id,
              sp.name as sponsor_name,
              sp.logo_url as sponsor_logo_url,
              up.username as user_username,
              u.name as user_full_name,
              u.image as user_avatar_url
       FROM bounty_submissions s
       JOIN bounties b ON s.bounty_id = b.id
       LEFT JOIN sponsors sp ON b.sponsor_id = sp.id
       LEFT JOIN user u ON s.user_id = u.id
       LEFT JOIN user_profiles up ON s.user_id = up.user_id
       WHERE b.sponsor_id = ?
       ORDER BY s.created_at DESC`,
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
       WHERE id = ?`,
    )
      .bind(
        body.status,
        body.reviewer_notes || body.feedback || null,
        body.transaction_hash || null,
        body.status === "approved" || body.status === "rejected" ? now : null,
        now,
        id,
      )
      .run();

    const submission = await env.DB.prepare(
      `SELECT * FROM bounty_submissions WHERE id = ?`,
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
  url: URL,
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
        COALESCE(up.username, usr.name, usr.email) as user_username,
        usr.image as user_avatar
       FROM bounty_comments c
       LEFT JOIN user usr ON c.user_id = usr.id
       LEFT JOIN user_profiles up ON c.user_id = up.user_id
       WHERE c.bounty_id = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
    )
      .bind(bountyId)
      .all();

    // Process liked_by field and calculate like_count, user_liked
    const processedComments = results.map((comment: any) => {
      let likedBy: string[] = [];
      try {
        if (
          comment.liked_by &&
          typeof comment.liked_by === "string" &&
          comment.liked_by.trim() !== ""
        ) {
          likedBy = JSON.parse(comment.liked_by);
        }
      } catch (e) {
        console.error("Failed to parse liked_by JSON:", e);
        likedBy = [];
      }

      if (!Array.isArray(likedBy)) {
        likedBy = [];
      }

      return {
        ...comment,
        like_count: likedBy.length,
        user_liked: userId ? (likedBy.includes(userId) ? 1 : 0) : 0,
      };
    });

    return new Response(JSON.stringify({ comments: processedComments }), {
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        body.bounty_id,
        body.user_id,
        body.content,
        body.parent_comment_id || null,
        now,
        now,
      )
      .run();

    const comment = await env.DB.prepare(
      `SELECT c.*,
        COALESCE(up.username, usr.name, usr.email) as user_username,
        usr.image as user_avatar
       FROM bounty_comments c
       LEFT JOIN user usr ON c.user_id = usr.id
       LEFT JOIN user_profiles up ON c.user_id = up.user_id
       WHERE c.id = ?`,
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
      `UPDATE bounty_comments SET content = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(body.content, now, id)
      .run();

    const comment = await env.DB.prepare(
      `SELECT c.*,
        COALESCE(up.username, usr.name, usr.email) as user_username,
        usr.image as user_avatar
       FROM bounty_comments c
       LEFT JOIN user usr ON c.user_id = usr.id
       LEFT JOIN user_profiles up ON c.user_id = up.user_id
       WHERE c.id = ?`,
    )
      .bind(id)
      .first();

    // Process liked_by field
    let likedBy: string[] = [];
    try {
      if (
        comment.liked_by &&
        typeof comment.liked_by === "string" &&
        comment.liked_by.trim() !== ""
      ) {
        likedBy = JSON.parse(comment.liked_by);
      }
    } catch (e) {
      console.error("Failed to parse liked_by JSON:", e);
      likedBy = [];
    }

    if (!Array.isArray(likedBy)) {
      likedBy = [];
    }

    const processedComment = {
      ...comment,
      like_count: likedBy.length,
    };

    return new Response(JSON.stringify({ comment: processedComment }), {
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
      `UPDATE bounty_comments SET deleted_at = ? WHERE id = ?`,
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
    const now = Math.floor(Date.now() / 1000);

    if (!body.user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get current comment with liked_by field
    const comment = await env.DB.prepare(
      `SELECT liked_by FROM bounty_comments WHERE id = ?`,
    )
      .bind(commentId)
      .first();

    if (!comment) {
      return new Response(JSON.stringify({ error: "Comment not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Parse liked_by array - handle null, empty string, or invalid JSON
    let likedBy: string[] = [];
    try {
      if (
        comment.liked_by &&
        typeof comment.liked_by === "string" &&
        comment.liked_by.trim() !== ""
      ) {
        likedBy = JSON.parse(comment.liked_by);
      }
    } catch (e) {
      console.error("Failed to parse liked_by JSON:", e);
      likedBy = [];
    }

    // Ensure likedBy is an array
    if (!Array.isArray(likedBy)) {
      likedBy = [];
    }

    // Check if already liked
    if (likedBy.includes(body.user_id)) {
      return new Response(
        JSON.stringify({ error: "Already liked", like_count: likedBy.length }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Add user to liked_by array
    likedBy.push(body.user_id);

    // Update comment with new liked_by array and increment like_count
    await env.DB.prepare(
      `UPDATE bounty_comments
       SET liked_by = ?, like_count = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(JSON.stringify(likedBy), likedBy.length, now, commentId)
      .run();

    return new Response(
      JSON.stringify({ success: true, like_count: likedBy.length }),
      {
        status: 201,
        headers: corsHeaders,
      },
    );
  }

  // DELETE /api/comments/:id/like - Unlike a comment
  if (
    request.method === "DELETE" &&
    pathname.match(/^\/api\/comments\/[^/]+\/like$/)
  ) {
    const commentId = pathname.split("/").slice(-2)[0];
    const userId = url.searchParams.get("user_id");
    const now = Math.floor(Date.now() / 1000);

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get current comment with liked_by field
    const comment = await env.DB.prepare(
      `SELECT liked_by FROM bounty_comments WHERE id = ?`,
    )
      .bind(commentId)
      .first();

    if (!comment) {
      return new Response(JSON.stringify({ error: "Comment not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Parse liked_by array - handle null, empty string, or invalid JSON
    let likedBy: string[] = [];
    try {
      if (
        comment.liked_by &&
        typeof comment.liked_by === "string" &&
        comment.liked_by.trim() !== ""
      ) {
        likedBy = JSON.parse(comment.liked_by);
      }
    } catch (e) {
      console.error("Failed to parse liked_by JSON:", e);
      likedBy = [];
    }

    // Ensure likedBy is an array
    if (!Array.isArray(likedBy)) {
      likedBy = [];
    }

    // Remove user from liked_by array
    const newLikedBy = likedBy.filter((id: string) => id !== userId);

    // Update comment with new liked_by array and decrement like_count
    await env.DB.prepare(
      `UPDATE bounty_comments
       SET liked_by = ?, like_count = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(JSON.stringify(newLikedBy), newLikedBy.length, now, commentId)
      .run();

    return new Response(
      JSON.stringify({ success: true, like_count: newLikedBy.length }),
      {
        headers: corsHeaders,
      },
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
  url: URL,
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
      `SELECT * FROM sponsors WHERE user_id = ?`,
    )
      .bind(userId)
      .first();

    // Return 200 with null sponsor instead of 404 to avoid console errors
    return new Response(JSON.stringify({ sponsor: sponsor || null }), {
      headers: corsHeaders,
    });
  }

  // POST /api/sponsors - Create sponsor (auto-approved)
  if (request.method === "POST" && pathname === "/api/sponsors") {
    const body = (await request.json()) as any;
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO sponsors (
        id, user_id, name, username, description, entity_name, industry,
        logo_url, banner_url, website, twitter, discord, telegram, wallet_address,
        contact_first_name, contact_last_name, contact_username, contact_telegram, contact_email,
        status, approved_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)`,
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
        body.banner_url || null,
        body.website || null,
        body.twitter || null,
        body.discord || null,
        body.telegram || null,
        body.wallet_address || null,
        body.contact_first_name || null,
        body.contact_last_name || null,
        body.contact_username || null,
        body.contact_telegram || null,
        body.contact_email || null,
        now, // approved_at
        now, // created_at
        now, // updated_at
      )
      .run();

    // Try to update user's is_sponsor flag (may fail if columns don't exist)
    try {
      await env.DB.prepare(
        `UPDATE user SET is_sponsor = 1, sponsor_id = ? WHERE id = ?`,
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

  // GET /api/sponsors/:id/dashboard - Get sponsor dashboard data
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/sponsors\/[^/]+\/dashboard$/)
  ) {
    const id = pathname.replace("/dashboard", "").split("/").pop();

    // Get sponsor info
    const sponsor = await env.DB.prepare(`SELECT * FROM sponsors WHERE id = ?`)
      .bind(id)
      .first();

    if (!sponsor) {
      return new Response(JSON.stringify({ error: "Sponsor not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Get bounties for this sponsor
    const { results: bounties } = await env.DB.prepare(
      `SELECT * FROM bounties
       WHERE sponsor_id = ?
       ORDER BY created_at DESC`,
    )
      .bind(id)
      .all();

    // Get submissions for all bounties by this sponsor
    const { results: submissions } = await env.DB.prepare(
      `SELECT bs.* FROM bounty_submissions bs
       JOIN bounties b ON bs.bounty_id = b.id
       WHERE b.sponsor_id = ?
       ORDER BY bs.created_at DESC`,
    )
      .bind(id)
      .all();

    // Calculate stats
    const total_bounties_count = bounties.length;
    const total_projects_count = 0; // TODO: Implement projects
    const total_reward_amount = bounties.reduce((sum: number, b: any) => {
      // If reward_currency is USD, use reward_amount
      // Otherwise, use reward_usd_value if available, else use reward_amount
      const rewardValue =
        b.reward_currency === "USD"
          ? parseFloat(b.reward_amount) || 0
          : parseFloat(b.reward_usd_value) || parseFloat(b.reward_amount) || 0;
      return sum + rewardValue;
    }, 0);

    return new Response(
      JSON.stringify({
        sponsor: {
          ...sponsor,
          total_bounties_count,
          total_projects_count,
          total_reward_amount,
        },
        bounties: bounties.map(transformBounty),
        submissions,
      }),
      {
        headers: corsHeaders,
      },
    );
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
           banner_url = COALESCE(?, banner_url),
           website = COALESCE(?, website),
           twitter = COALESCE(?, twitter),
           discord = COALESCE(?, discord),
           telegram = COALESCE(?, telegram),
           wallet_address = COALESCE(?, wallet_address),
           updated_at = ?
       WHERE id = ?`,
    )
      .bind(
        body.name || null,
        body.description || null,
        body.logo_url || null,
        body.banner_url || null,
        body.website || null,
        body.twitter || null,
        body.discord || null,
        body.telegram || null,
        body.wallet_address || null,
        now,
        id,
      )
      .run();

    const sponsor = await env.DB.prepare(`SELECT * FROM sponsors WHERE id = ?`)
      .bind(id)
      .first();

    return new Response(JSON.stringify({ sponsor }), {
      headers: corsHeaders,
    });
  }

  // GET /api/sponsors - List all sponsors (for admin)
  if (request.method === "GET" && pathname === "/api/sponsors") {
    let query = `SELECT s.*, b.bounty_count
                 FROM sponsors s
                 LEFT JOIN (
                   SELECT sponsor_id, COUNT(*) as bounty_count
                   FROM bounties
                   GROUP BY sponsor_id
                 ) b ON s.id = b.sponsor_id`;

    query += ` ORDER BY s.created_at DESC`;

    const { results } = await env.DB.prepare(query).all();

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
  url: URL,
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
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0`,
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
      },
    );
  }

  // POST /api/notifications - Create notification
  if (request.method === "POST" && pathname === "/api/notifications") {
    const body = (await request.json()) as any;

    // Validate required fields
    if (!body.user_id || !body.type || !body.title || !body.message) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: {
            user_id: body.user_id ? "ok" : "missing",
            type: body.type ? "ok" : "missing",
            title: body.title ? "ok" : "missing",
            message: body.message ? "ok" : "missing",
          },
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO notifications (
        id, user_id, type, title, message, link, related_bounty_id, related_submission_id, read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    )
      .bind(
        id,
        body.user_id,
        body.type,
        body.title,
        body.message,
        body.link || null,
        body.related_bounty_id || null,
        body.related_submission_id || null,
        now,
      )
      .run();

    const notification = await env.DB.prepare(
      `SELECT * FROM notifications WHERE id = ?`,
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

    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      `UPDATE notifications SET read = 1, read_at = ? WHERE id = ?`,
    )
      .bind(now, id)
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

    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      `UPDATE notifications SET read = 1, read_at = ? WHERE user_id = ?`,
    )
      .bind(now, userId)
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
 * Handle Notification Mutes API requests (simplified replacement for preferences)
 */
export async function handleNotificationPreferencesAPI(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const pathname = url.pathname;

  // GET /api/notification-mutes/check - Check if notifications are muted
  if (
    request.method === "GET" &&
    pathname === "/api/notification-mutes/check"
  ) {
    const bountyId = url.searchParams.get("bounty_id");
    const userId = url.searchParams.get("user_id");

    if (!bountyId || !userId) {
      return new Response(
        JSON.stringify({ error: "bounty_id and user_id are required" }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const mute = await env.DB.prepare(
      `SELECT id FROM notification_mutes WHERE user_id = ? AND bounty_id = ?`,
    )
      .bind(userId, bountyId)
      .first();

    return new Response(JSON.stringify({ muted: !!mute }), {
      headers: corsHeaders,
    });
  }

  // POST /api/notification-mutes - Mute notifications for a bounty
  if (request.method === "POST" && pathname === "/api/notification-mutes") {
    const body = (await request.json()) as any;
    const now = Math.floor(Date.now() / 1000);

    // Check if already muted
    const existing = await env.DB.prepare(
      `SELECT id FROM notification_mutes WHERE user_id = ? AND bounty_id = ?`,
    )
      .bind(body.user_id, body.bounty_id)
      .first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Already muted", mute: existing }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Create mute
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO notification_mutes (id, user_id, bounty_id, created_at)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(id, body.user_id, body.bounty_id, now)
      .run();

    const mute = await env.DB.prepare(
      `SELECT * FROM notification_mutes WHERE id = ?`,
    )
      .bind(id)
      .first();

    return new Response(JSON.stringify({ mute }), {
      status: 201,
      headers: corsHeaders,
    });
  }

  // DELETE /api/notification-mutes - Unmute notifications
  if (request.method === "DELETE" && pathname === "/api/notification-mutes") {
    const bountyId = url.searchParams.get("bounty_id");
    const userId = url.searchParams.get("user_id");

    if (!bountyId || !userId) {
      return new Response(
        JSON.stringify({ error: "bounty_id and user_id are required" }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    await env.DB.prepare(
      `DELETE FROM notification_mutes WHERE user_id = ? AND bounty_id = ?`,
    )
      .bind(userId, bountyId)
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
  },
): Promise<void> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    `INSERT INTO notifications (
      id, user_id, type, title, message, link, read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
  )
    .bind(
      id,
      data.user_id,
      data.type,
      data.title,
      data.message,
      data.link || null,
      now,
    )
    .run();
}

/**
 * Helper to check if notifications are muted for a bounty
 * Updated to use notification_mutes table (simpler approach)
 */
export async function isNotificationMuted(
  env: Env,
  userId: string,
  bountyId: string,
  _type: "comments" | "submissions",
): Promise<boolean> {
  const mute = await env.DB.prepare(
    `SELECT id FROM notification_mutes WHERE user_id = ? AND bounty_id = ?`,
  )
    .bind(userId, bountyId)
    .first();

  // If a mute record exists, notifications are muted (for all types)
  return !!mute;
}

/**
 * Handle User Account Deletion API requests
 */
export async function handleUserDeletionAPI(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const pathname = url.pathname;

  // DELETE /api/user/:userId - Delete user account and related data
  if (request.method === "DELETE" && pathname.match(/^\/api\/user\/[^/]+$/)) {
    const userId = pathname.split("/").pop();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    try {
      // Begin deletion process
      // 1. Delete user profile
      await env.DB.prepare(`DELETE FROM user_profiles WHERE user_id = ?`)
        .bind(userId)
        .run();

      // 2. Delete sessions
      await env.DB.prepare(`DELETE FROM session WHERE userId = ?`)
        .bind(userId)
        .run();

      // 3. Delete accounts (OAuth connections)
      await env.DB.prepare(`DELETE FROM account WHERE userId = ?`)
        .bind(userId)
        .run();

      // 4. Delete notifications
      await env.DB.prepare(`DELETE FROM notifications WHERE user_id = ?`)
        .bind(userId)
        .run();

      // 5. Delete notification mutes
      await env.DB.prepare(`DELETE FROM notification_mutes WHERE user_id = ?`)
        .bind(userId)
        .run();

      // 6. Soft delete comments (anonymize instead of hard delete)
      const now = Math.floor(Date.now() / 1000);
      await env.DB.prepare(
        `UPDATE bounty_comments
         SET content = '[deleted]', deleted_at = ?
         WHERE user_id = ? AND deleted_at IS NULL`,
      )
        .bind(now, userId)
        .run();

      // 7. Keep submissions but anonymize the user (for bounty integrity)
      // We keep submission records for sponsor's reference but anonymize the user
      await env.DB.prepare(
        `UPDATE bounty_submissions
         SET user_id = 'deleted-user'
         WHERE user_id = ?`,
      )
        .bind(userId)
        .run();

      // 8. Delete sponsor profile if exists
      await env.DB.prepare(`DELETE FROM sponsors WHERE user_id = ?`)
        .bind(userId)
        .run();

      // 9. Delete the main user record
      await env.DB.prepare(`DELETE FROM user WHERE id = ?`).bind(userId).run();

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "User account and related data have been deleted successfully",
        }),
        {
          status: 200,
          headers: corsHeaders,
        },
      );
    } catch (error) {
      console.error("Error deleting user account:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to delete user account",
          details: error instanceof Error ? error.message : "Unknown error",
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
 * Handle Bookmarks API requests
 */
export async function handleBookmarksAPI(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const pathname = url.pathname;

  // GET /api/bookmarks - Get user's bookmarks
  if (request.method === "GET" && pathname === "/api/bookmarks") {
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    try {
      const bookmarks = await env.DB.prepare(
        `SELECT
          b.id,
          b.bounty_id,
          b.created_at,
          bo.title,
          bo.reward_amount,
          bo.reward_currency,
          bo.reward_type,
          bo.reward_usd_value,
          bo.status,
          bo.end_date,
          s.name as sponsor_name,
          s.logo_url as sponsor_logo_url
        FROM bookmarks b
        LEFT JOIN bounties bo ON b.bounty_id = bo.id
        LEFT JOIN sponsors s ON bo.sponsor_id = s.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC`,
      )
        .bind(userId)
        .all();

      // Transform bookmarks to include computed reward field
      const transformedBookmarks = (bookmarks.results || []).map((b: any) => ({
        ...b,
        reward: {
          amount: b.reward_amount || 0,
          token: b.reward_currency || "ALPH",
          usd_equivalent: b.reward_usd_value || 0,
        },
      }));

      return new Response(JSON.stringify({ bookmarks: transformedBookmarks }), {
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch bookmarks" }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // GET /api/bookmarks/check - Check if bounty is bookmarked
  if (request.method === "GET" && pathname === "/api/bookmarks/check") {
    const userId = url.searchParams.get("user_id");
    const bountyId = url.searchParams.get("bounty_id");

    if (!userId || !bountyId) {
      return new Response(
        JSON.stringify({ error: "user_id and bounty_id are required" }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    try {
      const bookmark = await env.DB.prepare(
        `SELECT id FROM bookmarks WHERE user_id = ? AND bounty_id = ?`,
      )
        .bind(userId, bountyId)
        .first();

      return new Response(JSON.stringify({ bookmarked: !!bookmark }), {
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Error checking bookmark:", error);
      return new Response(
        JSON.stringify({ error: "Failed to check bookmark" }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // POST /api/bookmarks - Create bookmark
  if (request.method === "POST" && pathname === "/api/bookmarks") {
    try {
      const body = (await request.json()) as any;
      const id = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      // Check if already bookmarked
      const existing = await env.DB.prepare(
        `SELECT id FROM bookmarks WHERE user_id = ? AND bounty_id = ?`,
      )
        .bind(body.user_id, body.bounty_id)
        .first();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Already bookmarked", bookmark: existing }),
          {
            status: 409,
            headers: corsHeaders,
          },
        );
      }

      await env.DB.prepare(
        `INSERT INTO bookmarks (id, user_id, bounty_id, created_at)
         VALUES (?, ?, ?, ?)`,
      )
        .bind(id, body.user_id, body.bounty_id, now)
        .run();

      const bookmark = await env.DB.prepare(
        `SELECT * FROM bookmarks WHERE id = ?`,
      )
        .bind(id)
        .first();

      return new Response(JSON.stringify({ bookmark }), {
        status: 201,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Error creating bookmark:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create bookmark" }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // DELETE /api/bookmarks - Delete bookmark
  if (request.method === "DELETE" && pathname === "/api/bookmarks") {
    const userId = url.searchParams.get("user_id");
    const bountyId = url.searchParams.get("bounty_id");

    if (!userId || !bountyId) {
      return new Response(
        JSON.stringify({ error: "user_id and bounty_id are required" }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    try {
      await env.DB.prepare(
        `DELETE FROM bookmarks WHERE user_id = ? AND bounty_id = ?`,
      )
        .bind(userId, bountyId)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      return new Response(
        JSON.stringify({ error: "Failed to delete bookmark" }),
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
 * Handle Account Linking API requests
 */
export async function handleAccountLinkingAPI(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const pathname = url.pathname;
  const {
    checkAccountConflict,
    createAccountLinkRequest,
    getAccountLinkRequest,
    linkAccounts,
    rejectAccountLinkRequest,
    getUserConnectedAccounts,
    disconnectAccount,
  } = await import("./account-linking");

  // POST /api/account-linking/check - Check if email has account conflict
  if (request.method === "POST" && pathname === "/api/account-linking/check") {
    try {
      const body = (await request.json()) as any;
      const { email, providerId } = body;

      if (!email || !providerId) {
        return new Response(
          JSON.stringify({ error: "email and providerId are required" }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const result = await checkAccountConflict(env.DB, email, providerId);

      return new Response(JSON.stringify(result), {
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Error checking account conflict:", error);
      return new Response(
        JSON.stringify({ error: "Failed to check account conflict" }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // POST /api/account-linking/request - Create account link request
  if (
    request.method === "POST" &&
    pathname === "/api/account-linking/request"
  ) {
    try {
      const body = (await request.json()) as any;
      const { existingUserId, email, providerId, accountId, providerData } =
        body;

      if (!existingUserId || !email || !providerId || !accountId) {
        return new Response(
          JSON.stringify({
            error:
              "existingUserId, email, providerId, and accountId are required",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const linkRequest = await createAccountLinkRequest(
        env.DB,
        existingUserId,
        email,
        providerId,
        accountId,
        providerData,
      );

      return new Response(JSON.stringify({ linkRequest }), {
        status: 201,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Error creating account link request:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create account link request" }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // GET /api/account-linking/request/:token - Get account link request
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/account-linking\/request\/[^/]+$/)
  ) {
    try {
      const token = pathname.split("/").pop();

      if (!token) {
        return new Response(JSON.stringify({ error: "Token is required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const linkRequest = await getAccountLinkRequest(env.DB, token);

      if (!linkRequest) {
        return new Response(
          JSON.stringify({ error: "Link request not found or expired" }),
          {
            status: 404,
            headers: corsHeaders,
          },
        );
      }

      return new Response(JSON.stringify({ linkRequest }), {
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Error getting account link request:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get account link request" }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // POST /api/account-linking/confirm - Confirm and link accounts
  if (
    request.method === "POST" &&
    pathname === "/api/account-linking/confirm"
  ) {
    try {
      const body = (await request.json()) as any;
      const { token } = body;

      if (!token) {
        return new Response(JSON.stringify({ error: "Token is required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const linkRequest = await getAccountLinkRequest(env.DB, token);

      if (!linkRequest) {
        return new Response(
          JSON.stringify({ error: "Link request not found or expired" }),
          {
            status: 404,
            headers: corsHeaders,
          },
        );
      }

      const result = await linkAccounts(env.DB, linkRequest);

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Accounts linked successfully",
        }),
        {
          headers: corsHeaders,
        },
      );
    } catch (error) {
      console.error("Error confirming account link:", error);
      return new Response(
        JSON.stringify({ error: "Failed to link accounts" }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // POST /api/account-linking/reject - Reject account link request
  if (request.method === "POST" && pathname === "/api/account-linking/reject") {
    try {
      const body = (await request.json()) as any;
      const { token } = body;

      if (!token) {
        return new Response(JSON.stringify({ error: "Token is required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      await rejectAccountLinkRequest(env.DB, token);

      return new Response(
        JSON.stringify({ success: true, message: "Link request rejected" }),
        {
          headers: corsHeaders,
        },
      );
    } catch (error) {
      console.error("Error rejecting account link:", error);
      return new Response(
        JSON.stringify({ error: "Failed to reject link request" }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // GET /api/account-linking/connected/:userId - Get connected accounts
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/account-linking\/connected\/[^/]+$/)
  ) {
    try {
      const userId = pathname.split("/").pop();

      if (!userId) {
        return new Response(JSON.stringify({ error: "User ID is required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const accounts = await getUserConnectedAccounts(env.DB, userId);

      return new Response(JSON.stringify({ accounts }), {
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Error getting connected accounts:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get connected accounts" }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // DELETE /api/account-linking/disconnect - Disconnect account
  if (
    request.method === "DELETE" &&
    pathname === "/api/account-linking/disconnect"
  ) {
    try {
      const body = (await request.json()) as any;
      const { userId, accountId } = body;

      if (!userId || !accountId) {
        return new Response(
          JSON.stringify({ error: "userId and accountId are required" }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const result = await disconnectAccount(env.DB, userId, accountId);

      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Account disconnected successfully",
        }),
        {
          headers: corsHeaders,
        },
      );
    } catch (error) {
      console.error("Error disconnecting account:", error);
      return new Response(
        JSON.stringify({ error: "Failed to disconnect account" }),
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
 * Handle Image Upload API requests
 * Upload images to R2 bucket
 */
export async function handleImageUploadAPI(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const pathname = url.pathname;

  // POST /api/upload/image - Upload image to R2
  if (request.method === "POST" && pathname === "/api/upload/image") {
    try {
      const contentType = request.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        return new Response(
          JSON.stringify({ error: "Content-Type must be application/json" }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const body = (await request.json()) as any;

      // Validate required fields
      if (!body.image) {
        return new Response(
          JSON.stringify({ error: "Image data is required" }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      if (!body.fileName) {
        return new Response(
          JSON.stringify({ error: "File name is required" }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      // Extract base64 data from data URL
      let base64Data = body.image;
      let mimeType = "image/png"; // default

      console.log(
        `Received image data, starts with: ${base64Data.substring(0, 100)}`,
      );

      // Check if it's a data URL (data:image/png;base64,...)
      if (base64Data.startsWith("data:")) {
        // Find the base64 data after "base64,"
        const base64Index = base64Data.indexOf("base64,");
        if (base64Index === -1) {
          return new Response(
            JSON.stringify({
              error: "Invalid image data format - no base64 marker found",
            }),
            {
              status: 400,
              headers: corsHeaders,
            },
          );
        }

        // Extract MIME type
        const mimeMatch = base64Data.match(/^data:([^;]+);/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }

        // Get base64 data after "base64,"
        base64Data = base64Data.substring(base64Index + 7);
      }

      // Clean up base64 string - remove any whitespace, newlines, etc.
      base64Data = base64Data.replace(/\s/g, "");

      // Validate base64 string contains only valid characters
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
        console.error("Base64 contains invalid characters");
        // Find first invalid character for debugging
        const firstInvalid = base64Data
          .split("")
          .findIndex((c: string) => !/[A-Za-z0-9+/=]/.test(c));
        console.error(
          `First invalid char at position ${firstInvalid}: ${base64Data[firstInvalid]}`,
        );
        return new Response(
          JSON.stringify({
            error: "Invalid base64 data",
            details: `Base64 string contains invalid characters at position ${firstInvalid}`,
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      console.log(
        `Base64 length: ${base64Data.length}, MIME type: ${mimeType}`,
      );

      // Convert base64 to binary
      let binaryString;
      try {
        binaryString = atob(base64Data);
        console.log(
          `Successfully decoded base64, binary length: ${binaryString.length}`,
        );
      } catch (error) {
        console.error("Failed to decode base64:", error);
        return new Response(
          JSON.stringify({
            error: "Invalid base64 data",
            details: error instanceof Error ? error.message : "Unknown error",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Generate unique file name
      const timestamp = Date.now();
      const randomStr = crypto.randomUUID().substring(0, 8);
      const fileExtension = mimeType.split("/")[1] || "png";
      const uniqueFileName = `${timestamp}-${randomStr}-${body.fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}.${fileExtension}`;

      // Determine folder based on type
      const folder = body.type === "sponsor" ? "sponsors" : "users";
      const key = `${folder}/${uniqueFileName}`;

      // Upload to R2
      await env.IMAGES.put(key, bytes, {
        httpMetadata: {
          contentType: mimeType,
        },
      });

      // Generate public URL
      // Note: You'll need to configure R2 public access or use a custom domain
      // For now, we'll return a path that can be served through the worker
      const imageUrl = `/api/images/${key}`;

      return new Response(
        JSON.stringify({
          success: true,
          url: imageUrl,
          key: key,
        }),
        {
          status: 201,
          headers: corsHeaders,
        },
      );
    } catch (error) {
      console.error("Error uploading image:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to upload image",
          details: error instanceof Error ? error.message : "Unknown error",
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
 * Handle Image Serving API requests
 * Serve images from R2 bucket
 */
export async function handleImageServingAPI(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const pathname = url.pathname;

  // GET /api/images/* - Serve image from R2
  if (request.method === "GET" && pathname.startsWith("/api/images/")) {
    try {
      // Extract key from pathname (remove /api/images/ prefix)
      const key = pathname.replace("/api/images/", "");

      if (!key) {
        return new Response("Image not found", { status: 404 });
      }

      // Get image from R2
      const object = await env.IMAGES.get(key);

      if (!object) {
        return new Response("Image not found", { status: 404 });
      }

      // Return image with proper headers
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      headers.set("Access-Control-Allow-Origin", "*");

      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      console.error("Error serving image:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }

  return new Response("Not found", { status: 404 });
}

/**
 * Handle Proof of Work API requests
 */
export async function handleProofOfWorkAPI(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const pathname = url.pathname;

  // GET /api/proof-of-work/:username - Get all proof of work for a user
  if (
    request.method === "GET" &&
    pathname.match(/^\/api\/proof-of-work\/[^/]+$/)
  ) {
    const username = pathname.split("/").pop();

    // First, find user_id from username
    const userProfile = await env.DB.prepare(
      `SELECT user_id FROM user_profiles WHERE username = ?`,
    )
      .bind(username)
      .first();

    if (!userProfile) {
      return new Response(JSON.stringify({ works: [] }), {
        headers: corsHeaders,
      });
    }

    const { results } = await env.DB.prepare(
      `SELECT * FROM proof_of_work WHERE user_id = ? ORDER BY created_at DESC`,
    )
      .bind(userProfile.user_id)
      .all();

    // Parse skills JSON
    const works = results.map((work: any) => ({
      ...work,
      skills: work.skills ? JSON.parse(work.skills) : [],
    }));

    return new Response(JSON.stringify({ works }), {
      headers: corsHeaders,
    });
  }

  // POST /api/proof-of-work - Create new proof of work
  if (request.method === "POST" && pathname === "/api/proof-of-work") {
    try {
      const body = (await request.json()) as any;

      console.log("Received proof of work data:", {
        user_id: body.user_id,
        username: body.username,
        title: body.title,
        description: body.description,
        skills: body.skills,
        link: body.link,
      });

      // Validate required fields
      if (
        !body.user_id ||
        !body.username ||
        !body.title ||
        !body.description ||
        !body.skills ||
        !body.link
      ) {
        console.log("Validation failed:", {
          user_id: !!body.user_id,
          username: !!body.username,
          title: !!body.title,
          description: !!body.description,
          skills: !!body.skills,
          link: !!body.link,
        });
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const id = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(
        `INSERT INTO proof_of_work (
          id, user_id, username, title, description, skills, link, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          id,
          body.user_id,
          body.username,
          body.title,
          body.description,
          JSON.stringify(body.skills),
          body.link,
          now,
          now,
        )
        .run();

      const work = await env.DB.prepare(
        `SELECT * FROM proof_of_work WHERE id = ?`,
      )
        .bind(id)
        .first();

      return new Response(
        JSON.stringify({
          work: {
            ...work,
            skills: work ? JSON.parse((work as any).skills) : [],
          },
        }),
        {
          status: 201,
          headers: corsHeaders,
        },
      );
    } catch (error: any) {
      console.error("Error creating proof of work:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to create proof of work",
          details: error.message,
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // PUT /api/proof-of-work/:id - Update proof of work
  if (
    request.method === "PUT" &&
    pathname.match(/^\/api\/proof-of-work\/[^/]+$/)
  ) {
    try {
      const id = pathname.split("/").pop();
      const body = (await request.json()) as any;
      const now = Math.floor(Date.now() / 1000);

      // Build update query dynamically
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
      if (body.skills !== undefined) {
        updates.push("skills = ?");
        values.push(JSON.stringify(body.skills));
      }
      if (body.link !== undefined) {
        updates.push("link = ?");
        values.push(body.link);
      }

      updates.push("updated_at = ?");
      values.push(now);
      values.push(id);

      if (updates.length > 1) {
        await env.DB.prepare(
          `UPDATE proof_of_work SET ${updates.join(", ")} WHERE id = ?`,
        )
          .bind(...values)
          .run();
      }

      const work = await env.DB.prepare(
        `SELECT * FROM proof_of_work WHERE id = ?`,
      )
        .bind(id)
        .first();

      return new Response(
        JSON.stringify({
          work: work
            ? { ...work, skills: JSON.parse((work as any).skills) }
            : null,
        }),
        {
          headers: corsHeaders,
        },
      );
    } catch (error: any) {
      console.error("Error updating proof of work:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to update proof of work",
          details: error.message,
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  }

  // DELETE /api/proof-of-work/:id - Delete proof of work
  if (
    request.method === "DELETE" &&
    pathname.match(/^\/api\/proof-of-work\/[^/]+$/)
  ) {
    try {
      const id = pathname.split("/").pop();

      await env.DB.prepare(`DELETE FROM proof_of_work WHERE id = ?`)
        .bind(id)
        .run();

      return new Response(
        JSON.stringify({ success: true, message: "Proof of work deleted" }),
        {
          headers: corsHeaders,
        },
      );
    } catch (error: any) {
      console.error("Error deleting proof of work:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to delete proof of work",
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
