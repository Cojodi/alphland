import { Resend } from "resend";
import { Env } from "./index";

const BASE_URL = "https://alph.land";

export async function sendAndLog(
  env: Env,
  to: string,
  subject: string,
  type: string,
  html: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not set, skipping:", type);
    return;
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const from = `Alphland <${env.FROM_EMAIL || "onboarding@resend.dev"}>`;

  let resendId: string | null = null;
  let errorMsg: string | null = null;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
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

  try {
    await env.DB.prepare(
      "INSERT INTO email_logs (id, to_email, subject, type, status, resend_id, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())",
    )
      .bind(
        crypto.randomUUID(),
        to,
        subject,
        type,
        errorMsg ? "failed" : "sent",
        resendId,
        errorMsg,
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
    `SELECT u.email, u.name, b.title, b.reward_amount, b.reward_currency, bs.reviewer_notes, bs.transaction_hash
     FROM bounty_submissions bs
     JOIN user u ON bs.user_id = u.id
     JOIN bounties b ON bs.bounty_id = b.id
     WHERE bs.id = ?`,
  )
    .bind(submissionId)
    .first()) as {
    email: string;
    name: string | null;
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
  );
}

export async function notifyUserSubmissionRejected(
  env: Env,
  submissionId: string,
): Promise<void> {
  const row = (await env.DB.prepare(
    `SELECT u.email, u.name, b.title, bs.reviewer_notes
     FROM bounty_submissions bs
     JOIN user u ON bs.user_id = u.id
     JOIN bounties b ON bs.bounty_id = b.id
     WHERE bs.id = ?`,
  )
    .bind(submissionId)
    .first()) as {
    email: string;
    name: string | null;
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
  );
}

export async function notifySponsorVerified(
  env: Env,
  sponsorId: string,
): Promise<void> {
  const row = (await env.DB.prepare(
    `SELECT u.email, u.name, s.name as sponsor_name
     FROM sponsors s
     JOIN user u ON s.user_id = u.id
     WHERE s.id = ?`,
  )
    .bind(sponsorId)
    .first()) as {
    email: string;
    name: string | null;
    sponsor_name: string;
  } | null;

  if (!row?.email) return;

  await sendAndLog(
    env,
    row.email,
    "Your sponsor account has been approved – Alphland",
    "sponsor_verified",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2 style="color:#E05C2A;">Your account is approved! 🎉</h2>
      <p>Hi ${row.name || "there"},</p>
      <p>Your sponsor account <strong>${row.sponsor_name}</strong> has been reviewed and approved on Alphland.</p>
      <p>You can now post bounties and start receiving submissions from the community.</p>
      <a href="${BASE_URL}/sponsor/dashboard" style="display:inline-block;padding:12px 24px;background:#E05C2A;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Go to Dashboard</a>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#888;font-size:12px;">Alphland · <a href="${BASE_URL}" style="color:#888;">alph.land</a></p>
    </div>`,
  );
}
