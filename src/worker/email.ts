import { Resend } from "resend";
import { Env } from "./index";

const BASE_URL = "https://alph.land";

/**
 * Which opt-out category each email type belongs to.
 *
 * A type that is absent from this map is transactional — account
 * verification, password reset, sponsor approval — and is never suppressed.
 * That is why the mapping is a lookup table rather than a field on the call:
 * forgetting to pass a category must fail toward sending, not toward silence.
 */
const CATEGORY_BY_TYPE: Record<string, string> = {
  submission_approved: "submission_result",
  submission_rejected: "submission_result",
  revision_requested: "submission_result",
  new_submission: "sponsor_activity",
  submission_resubmitted: "sponsor_activity",
  bounty_deadline: "deadline",
  review_overdue: "deadline",
  scout_invite: "scout_invite",
  product: "product",
};

/** Categories a user may turn off, plus the catch-all. */
export const EMAIL_CATEGORIES = [
  "submission_result",
  "sponsor_activity",
  "deadline",
  "scout_invite",
  "product",
] as const;

export function categoryForType(type: string): string | null {
  return CATEGORY_BY_TYPE[type] ?? null;
}

/**
 * Has this user opted out of this category?
 *
 * Matches the category itself or the 'all' catch-all. A database error is
 * deliberately not swallowed into "unsubscribed" — see the caller.
 */
export async function isUnsubscribed(
  env: Env,
  userId: string,
  category: string,
): Promise<boolean> {
  const row = (await env.DB.prepare(
    `SELECT 1 AS hit FROM email_unsubscribes
      WHERE user_id = ? AND category IN (?, 'all') LIMIT 1`,
  )
    .bind(userId, category)
    .first()) as { hit: number } | null;

  return !!row;
}

/**
 * Sign an unsubscribe link so it can only be used for its own (user,
 * category) pair.
 *
 * A bare user id in the URL would let anyone unsubscribe anyone — the same
 * hole the notification endpoints had. Returns null when INTERNAL_SECRET is
 * unset, and the caller then omits the footer rather than emitting an
 * unsigned link.
 */
export async function signUnsubscribe(
  env: Env,
  userId: string,
  category: string,
): Promise<string | null> {
  if (!env.INTERNAL_SECRET) return null;

  // TextEncoder always returns a plain-ArrayBuffer-backed view; the lib type
  // is wider than that, so narrow it for crypto.subtle.
  const utf8 = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

  const key = await crypto.subtle.importKey(
    "raw",
    utf8(env.INTERNAL_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    utf8(`${userId}:${category}`),
  );

  // base64url — the token travels in a query string and in mail headers.
  const raw = new Uint8Array(sig);
  let bin = "";
  for (let i = 0; i < raw.length; i++) bin += String.fromCharCode(raw[i]);

  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Constant-time compare, so a wrong token cannot be probed byte by byte. */
export async function verifyUnsubscribe(
  env: Env,
  userId: string,
  category: string,
  token: string,
): Promise<boolean> {
  const expected = await signUnsubscribe(env, userId, category);
  if (!expected || expected.length !== token.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Who and what an email is about, so the log row can be deduplicated later.
 *
 * `userId` is the *recipient*, not the person the mail is about — for a
 * sponsor notification that is the sponsor's user id, not the submitter's.
 * Both are optional: transactional mail (verification, password reset) has no
 * useful key and is never deduplicated.
 */
export interface EmailContext {
  userId?: string | null;
  bountyId?: string | null;
}

/**
 * Has this exact email already gone out?
 *
 * For repeating jobs — the deadline cron fires hourly and must not re-send the
 * same reminder every hour. Only counts successful sends, so a failed attempt
 * is retried on the next run.
 *
 * Returns false when there is no key to match on: with no userId we cannot
 * tell two recipients apart, and answering "already sent" would silently
 * suppress everyone's mail.
 */
export async function alreadySent(
  env: Env,
  type: string,
  ctx: EmailContext,
): Promise<boolean> {
  if (!ctx.userId) return false;

  const row = (await env.DB.prepare(
    `SELECT 1 AS hit FROM email_logs
      WHERE type = ? AND user_id = ? AND status = 'sent'
        AND (? IS NULL OR bounty_id = ?)
      LIMIT 1`,
  )
    .bind(type, ctx.userId, ctx.bountyId ?? null, ctx.bountyId ?? null)
    .first()) as { hit: number } | null;

  return !!row;
}

export async function sendAndLog(
  env: Env,
  to: string,
  subject: string,
  type: string,
  html: string,
  ctx: EmailContext = {},
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not set, skipping:", type);
    return;
  }

  // The opt-out check lives here and nowhere else. Putting it in the six
  // notifyXxx() callers is how one of them ends up missing it — the same
  // failure the notification-auth pass had to undo.
  const category = categoryForType(type);
  if (ctx.userId && category) {
    let optedOut = false;
    try {
      optedOut = await isUnsubscribed(env, ctx.userId, category);
    } catch (e) {
      // Fail toward sending: a lookup error must not silently mute a user.
      console.error("[email] unsubscribe lookup failed, sending anyway:", e);
    }
    if (optedOut) {
      console.log(
        `[email] Suppressed ${type} to ${to} (opted out: ${category})`,
      );
      await logEmail(env, to, subject, type, "suppressed", null, null, ctx);
      return;
    }
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const from = `Alphland <${env.FROM_EMAIL || "onboarding@resend.dev"}>`;

  // Signed one-click unsubscribe. Omitted entirely when we cannot sign —
  // an unsigned link would let anyone unsubscribe anyone.
  const token =
    ctx.userId && category
      ? await signUnsubscribe(env, ctx.userId, category)
      : null;
  const unsubUrl = token
    ? `${BASE_URL}/api/email/unsubscribe?u=${encodeURIComponent(ctx.userId!)}&c=${encodeURIComponent(category!)}&t=${token}`
    : null;

  const body = unsubUrl
    ? html +
      `<p style="color:#888;font-size:12px;text-align:center;margin-top:8px;">` +
      `<a href="${unsubUrl}" style="color:#888;">Unsubscribe from these emails</a></p>`
    : html;

  // Gmail and Outlook bin bulk mail that has no machine-readable opt-out.
  const headers = unsubUrl
    ? {
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      }
    : undefined;

  let resendId: string | null = null;
  let errorMsg: string | null = null;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html: body,
      ...(headers ? { headers } : {}),
    });
    if (error) {
      errorMsg = String((error as any).message || error);
      console.error(`[email] Failed to send ${type} to ${to}:`, errorMsg);
    } else {
      resendId = (data as any)?.id || null;
      console.log(`[email] Sent ${type} to ${to}, id=${resendId}`);
    }
  } catch (e: any) {
    errorMsg = String(e?.message || e);
    console.error(`[email] Exception sending ${type}:`, errorMsg);
  }

  await logEmail(
    env,
    to,
    subject,
    type,
    errorMsg ? "failed" : "sent",
    resendId,
    errorMsg,
    ctx,
  );
}

/**
 * Append a row to email_logs.
 *
 * Suppressed sends are logged too: without a row, "I never got the email" is
 * unanswerable — you cannot tell an opt-out from a delivery failure.
 */
async function logEmail(
  env: Env,
  to: string,
  subject: string,
  type: string,
  status: "sent" | "failed" | "suppressed",
  resendId: string | null,
  errorMsg: string | null,
  ctx: EmailContext,
): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO email_logs (id, to_email, subject, type, status, resend_id, error, user_id, bounty_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())",
    )
      .bind(
        crypto.randomUUID(),
        to,
        subject,
        type,
        status,
        resendId,
        errorMsg,
        ctx.userId ?? null,
        ctx.bountyId ?? null,
      )
      .run();
  } catch (e) {
    console.error("[email] Failed to log email:", e);
  }
}

// ─── Email templates ───────────────────────────────────────────────────────

export async function notifyUserSubmissionApproved(
  env: Env,
  submissionId: string,
): Promise<void> {
  const row = (await env.DB.prepare(
    `SELECT u.id as user_id, u.email, u.name, b.id as bounty_id, b.title, b.reward_amount, b.reward_currency, bs.reviewer_notes, bs.transaction_hash
     FROM bounty_submissions bs
     JOIN user u ON bs.user_id = u.id
     JOIN bounties b ON bs.bounty_id = b.id
     WHERE bs.id = ?`,
  )
    .bind(submissionId)
    .first()) as {
    user_id: string;
    email: string;
    name: string | null;
    bounty_id: string;
    title: string;
    reward_amount: number | null;
    reward_currency: string | null;
    reviewer_notes: string | null;
    transaction_hash: string | null;
  } | null;

  if (!row?.email) return;

  const rewardText = row.reward_amount
    ? `${row.reward_amount} ${row.reward_currency || "ALPH"}`
    : "";

  await sendAndLog(
    env,
    row.email,
    `Congrats! Your submission was approved – ${row.title}`,
    "submission_approved",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2 style="color:#E05C2A;">Your submission was approved! 🎉</h2>
      <p>Hi ${row.name || "there"},</p>
      <p>Great news — your submission for <strong>${row.title}</strong> has been <strong>approved</strong>.</p>
      ${rewardText ? `<p>Reward: <strong>${rewardText}</strong></p>` : ""}
      ${row.reviewer_notes ? `<p><em>Reviewer note:</em> ${row.reviewer_notes}</p>` : ""}
      ${row.transaction_hash ? `<p>Payment transaction: <a href="https://explorer.alephium.org/transactions/${row.transaction_hash}">${row.transaction_hash.slice(0, 16)}…</a></p>` : ""}
      <a href="${BASE_URL}/bounty/submissions" style="display:inline-block;padding:12px 24px;background:#E05C2A;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">View My Submissions</a>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#888;font-size:12px;">Alphland · <a href="${BASE_URL}" style="color:#888;">alph.land</a></p>
    </div>`,
    { userId: row.user_id, bountyId: row.bounty_id },
  );
}

export async function notifyUserSubmissionRejected(
  env: Env,
  submissionId: string,
): Promise<void> {
  const row = (await env.DB.prepare(
    `SELECT u.id as user_id, u.email, u.name, b.id as bounty_id, b.title, bs.reviewer_notes
     FROM bounty_submissions bs
     JOIN user u ON bs.user_id = u.id
     JOIN bounties b ON bs.bounty_id = b.id
     WHERE bs.id = ?`,
  )
    .bind(submissionId)
    .first()) as {
    user_id: string;
    email: string;
    name: string | null;
    bounty_id: string;
    title: string;
    reviewer_notes: string | null;
  } | null;

  if (!row?.email) return;

  await sendAndLog(
    env,
    row.email,
    `Update on your submission – ${row.title}`,
    "submission_rejected",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2>Submission update for: ${row.title}</h2>
      <p>Hi ${row.name || "there"},</p>
      <p>Thank you for your submission. Unfortunately, it was <strong>not accepted</strong> this time.</p>
      ${row.reviewer_notes ? `<p><em>Feedback from sponsor:</em> ${row.reviewer_notes}</p>` : ""}
      <p>Keep building — other bounties may be a great fit for your work.</p>
      <a href="${BASE_URL}/explore" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Browse Bounties</a>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#888;font-size:12px;">Alphland · <a href="${BASE_URL}" style="color:#888;">alph.land</a></p>
    </div>`,
    { userId: row.user_id, bountyId: row.bounty_id },
  );
}

export async function notifySponsorNewSubmission(
  env: Env,
  submissionId: string,
): Promise<void> {
  const row = (await env.DB.prepare(
    `SELECT
       b.title as bounty_title,
       b.id as bounty_id,
       u_sponsor.id as sponsor_user_id,
       u_sponsor.email as sponsor_email,
       u_sponsor.name as sponsor_name,
       u_submitter.name as submitter_name,
       u_submitter.email as submitter_email
     FROM bounty_submissions bs
     JOIN bounties b ON bs.bounty_id = b.id
     JOIN sponsors s ON b.sponsor_id = s.id
     JOIN user u_sponsor ON s.user_id = u_sponsor.id
     JOIN user u_submitter ON bs.user_id = u_submitter.id
     WHERE bs.id = ?`,
  )
    .bind(submissionId)
    .first()) as {
    bounty_title: string;
    bounty_id: string;
    sponsor_user_id: string;
    sponsor_email: string;
    sponsor_name: string | null;
    submitter_name: string | null;
    submitter_email: string;
  } | null;

  if (!row?.sponsor_email) return;

  const submitterDisplay = row.submitter_name || row.submitter_email;

  await sendAndLog(
    env,
    row.sponsor_email,
    `New submission received – ${row.bounty_title}`,
    "new_submission",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2>New submission for: ${row.bounty_title}</h2>
      <p>Hi ${row.sponsor_name || "there"},</p>
      <p><strong>${submitterDisplay}</strong> just submitted an entry for your bounty.</p>
      <a href="${BASE_URL}/bounty/${row.bounty_id}" style="display:inline-block;padding:12px 24px;background:#E05C2A;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Review Submission</a>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#888;font-size:12px;">Alphland · <a href="${BASE_URL}" style="color:#888;">alph.land</a></p>
    </div>`,
    { userId: row.sponsor_user_id, bountyId: row.bounty_id },
  );
}

export async function notifyUserRevisionRequested(
  env: Env,
  submissionId: string,
): Promise<void> {
  const row = (await env.DB.prepare(
    `SELECT u.id as user_id, u.email, u.name, b.title as bounty_title, b.id as bounty_id, bs.reviewer_notes
     FROM bounty_submissions bs
     JOIN user u ON bs.user_id = u.id
     JOIN bounties b ON bs.bounty_id = b.id
     WHERE bs.id = ?`,
  )
    .bind(submissionId)
    .first()) as {
    user_id: string;
    email: string;
    name: string | null;
    bounty_title: string;
    bounty_id: string;
    reviewer_notes: string | null;
  } | null;

  if (!row?.email) return;

  await sendAndLog(
    env,
    row.email,
    `Revision requested for your submission – ${row.bounty_title}`,
    "revision_requested",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2 style="color:#E05C2A;">Revision requested</h2>
      <p>Hi ${row.name || "there"},</p>
      <p>The sponsor has reviewed your submission for <strong>${row.bounty_title}</strong> and is requesting a revision.</p>
      ${row.reviewer_notes ? `<div style="background:#fff8f5;border-left:4px solid #E05C2A;padding:12px 16px;margin:16px 0;border-radius:0 6px 6px 0;"><p style="margin:0;font-size:14px;"><strong>Sponsor feedback:</strong><br>${row.reviewer_notes}</p></div>` : ""}
      <p>Please update your submission and resubmit from your profile page.</p>
      <a href="${BASE_URL}/bounty/profile" style="display:inline-block;padding:12px 24px;background:#E05C2A;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Edit My Submission</a>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#888;font-size:12px;">Alphland · <a href="${BASE_URL}" style="color:#888;">alph.land</a></p>
    </div>`,
    { userId: row.user_id, bountyId: row.bounty_id },
  );
}

export async function notifySponsorSubmissionResubmitted(
  env: Env,
  submissionId: string,
): Promise<void> {
  const row = (await env.DB.prepare(
    `SELECT
       b.title as bounty_title,
       b.id as bounty_id,
       u_sponsor.id as sponsor_user_id,
       u_sponsor.email as sponsor_email,
       u_sponsor.name as sponsor_name,
       u_submitter.name as submitter_name,
       u_submitter.email as submitter_email
     FROM bounty_submissions bs
     JOIN bounties b ON bs.bounty_id = b.id
     JOIN sponsors s ON b.sponsor_id = s.id
     JOIN user u_sponsor ON s.user_id = u_sponsor.id
     JOIN user u_submitter ON bs.user_id = u_submitter.id
     WHERE bs.id = ?`,
  )
    .bind(submissionId)
    .first()) as {
    bounty_title: string;
    bounty_id: string;
    sponsor_user_id: string;
    sponsor_email: string;
    sponsor_name: string | null;
    submitter_name: string | null;
    submitter_email: string;
  } | null;

  if (!row?.sponsor_email) return;

  const submitterDisplay = row.submitter_name || row.submitter_email;

  await sendAndLog(
    env,
    row.sponsor_email,
    `Submission updated – ${row.bounty_title}`,
    "submission_resubmitted",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2>Submission updated: ${row.bounty_title}</h2>
      <p>Hi ${row.sponsor_name || "there"},</p>
      <p><strong>${submitterDisplay}</strong> has updated their submission following your revision request.</p>
      <a href="${BASE_URL}/bounty/${row.bounty_id}" style="display:inline-block;padding:12px 24px;background:#E05C2A;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Review Updated Submission</a>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#888;font-size:12px;">Alphland · <a href="${BASE_URL}" style="color:#888;">alph.land</a></p>
    </div>`,
    { userId: row.sponsor_user_id, bountyId: row.bounty_id },
  );
}

/**
 * "Closing soon" nudge to someone who bookmarked a bounty.
 *
 * Takes the rows it needs as arguments rather than re-querying by id: the
 * reminder cron has already loaded and filtered them, and re-reading per
 * recipient would turn one query into hundreds.
 */
export async function notifyBountyDeadlineSoon(
  env: Env,
  user: { user_id: string; email: string; name: string | null },
  bounty: { id: string; title: string; end_date: number },
): Promise<void> {
  const closes = new Date(bounty.end_date * 1000).toUTCString();

  await sendAndLog(
    env,
    user.email,
    `Closing soon – ${bounty.title}`,
    "bounty_deadline",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2 style="color:#E05C2A;">This bounty closes soon</h2>
      <p>Hi ${user.name || "there"},</p>
      <p>You bookmarked <strong>${bounty.title}</strong> and it stops accepting submissions on <strong>${closes}</strong>.</p>
      <a href="${BASE_URL}/bounty/${bounty.id}" style="display:inline-block;padding:12px 24px;background:#E05C2A;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">View Bounty</a>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#888;font-size:12px;">Alphland · <a href="${BASE_URL}" style="color:#888;">alph.land</a></p>
    </div>`,
    { userId: user.user_id, bountyId: bounty.id },
  );
}

/** Remind a sponsor that submissions have been waiting since the deadline. */
export async function notifySponsorReviewOverdue(
  env: Env,
  b: {
    id: string;
    title: string;
    sponsor_user_id: string;
    sponsor_email: string;
    sponsor_contact: string | null;
    submission_count: number;
  },
): Promise<void> {
  const plural = b.submission_count === 1 ? "submission" : "submissions";

  await sendAndLog(
    env,
    b.sponsor_email,
    `${b.submission_count} ${plural} still waiting – ${b.title}`,
    "review_overdue",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2 style="color:#E05C2A;">Submissions are waiting on you</h2>
      <p>Hi ${b.sponsor_contact || "there"},</p>
      <p><strong>${b.title}</strong> closed a week ago and <strong>${b.submission_count} ${plural}</strong> have not been reviewed yet.</p>
      <p>Participants cannot be paid until winners are announced.</p>
      <a href="${BASE_URL}/bounty/sponsor/dashboard" style="display:inline-block;padding:12px 24px;background:#E05C2A;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Review Submissions</a>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#888;font-size:12px;">Alphland · <a href="${BASE_URL}" style="color:#888;">alph.land</a></p>
    </div>`,
    { userId: b.sponsor_user_id, bountyId: b.id },
  );
}

/**
 * Tell admins a bounty has gone two weeks without a verdict.
 *
 * Uncategorised on purpose — this is operational mail to staff, not a
 * newsletter, and must not be silenced by an opt-out.
 */
export async function notifyAdminReviewEscalation(
  env: Env,
  admin: { id: string; email: string },
  b: {
    id: string;
    title: string;
    sponsor_name: string;
    submission_count: number;
  },
): Promise<void> {
  await sendAndLog(
    env,
    admin.email,
    `Unreviewed for 14 days – ${b.title}`,
    "review_escalation",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2>Bounty unreviewed for 14 days</h2>
      <p><strong>${b.title}</strong> by <strong>${b.sponsor_name}</strong> closed two weeks ago with
         <strong>${b.submission_count}</strong> submission(s) and still has no announced winners.</p>
      <p>The sponsor was reminded at 7 days. This needs a human decision.</p>
      <a href="${BASE_URL}/bounty/${b.id}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">View Bounty</a>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#888;font-size:12px;">Alphland admin notification</p>
    </div>`,
    { userId: admin.id, bountyId: b.id },
  );
}

/**
 * Email for any sponsor account status change.
 *
 * One function for all four transitions rather than one per verb. The
 * previous shape had `verified` wired to its own email and the other three
 * to nothing, which is how "we notify sponsors" ended up meaning "we notify
 * them when it is good news" — a ban is precisely the change someone needs
 * to be told about.
 *
 * Uncategorised, so it is transactional and can never be suppressed by an
 * opt-out: these are account-state facts, not updates a user can decline.
 */
export async function notifySponsorAccountChange(
  env: Env,
  sponsorId: string,
  change: "verified" | "unverified" | "banned" | "unbanned",
): Promise<void> {
  const row = (await env.DB.prepare(
    `SELECT u.id as user_id, u.email, u.name, s.name as sponsor_name
       FROM sponsors s JOIN user u ON s.user_id = u.id
      WHERE s.id = ?`,
  )
    .bind(sponsorId)
    .first()) as {
    user_id: string;
    email: string;
    name: string | null;
    sponsor_name: string;
  } | null;

  if (!row?.email) return;

  const copy = {
    verified: {
      subject: "Your sponsor account has been approved – Alphland",
      heading: "Your account is approved! 🎉",
      body: `Your sponsor account <strong>${row.sponsor_name}</strong> has been reviewed and approved. You can now post bounties and start receiving submissions from the community.`,
      cta: {
        label: "Go to Dashboard",
        href: `${BASE_URL}/bounty/sponsor/dashboard`,
      },
      accent: "#E05C2A",
    },
    unverified: {
      subject: "Your sponsor account needs review – Alphland",
      heading: "Your account is back under review",
      body: `Verification for <strong>${row.sponsor_name}</strong> has been withdrawn, so new bounties cannot be published until it is approved again. Bounties already live are unaffected.`,
      cta: {
        label: "View Account",
        href: `${BASE_URL}/bounty/sponsor/dashboard`,
      },
      accent: "#111",
    },
    banned: {
      subject: "Your sponsor account has been suspended – Alphland",
      heading: "Your account has been suspended",
      body: `The sponsor account <strong>${row.sponsor_name}</strong> has been suspended and can no longer post bounties. If you believe this is a mistake, reply to this email.`,
      cta: null,
      accent: "#dc2626",
    },
    unbanned: {
      subject: "Your sponsor account has been restored – Alphland",
      heading: "Your account has been restored",
      body: `The suspension on <strong>${row.sponsor_name}</strong> has been lifted. You can post bounties again.`,
      cta: {
        label: "Go to Dashboard",
        href: `${BASE_URL}/bounty/sponsor/dashboard`,
      },
      accent: "#E05C2A",
    },
  }[change];

  await sendAndLog(
    env,
    row.email,
    copy.subject,
    `sponsor_${change}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2 style="color:${copy.accent};">${copy.heading}</h2>
      <p>Hi ${row.name || "there"},</p>
      <p>${copy.body}</p>
      ${
        copy.cta
          ? `<a href="${copy.cta.href}" style="display:inline-block;padding:12px 24px;background:${copy.accent};color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">${copy.cta.label}</a>`
          : ""
      }
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#888;font-size:12px;">Alphland · <a href="${BASE_URL}" style="color:#888;">alph.land</a></p>
    </div>`,
    { userId: row.user_id },
  );
}
