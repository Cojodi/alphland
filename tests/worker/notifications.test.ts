import { describe, it, expect } from "vitest";
import {
  notify,
  notifyUnlessActor,
  notifySubmissionReviewed,
  notifySponsorStatusChanged,
  notifyCommentReply,
} from "@/worker/notifications";
import { handleNotificationsAPI } from "@/worker/handlers";

/** Captures inserted notifications; `muted` lists muted (user, bounty) pairs. */
function makeEnv(muted: [string, string][] = []) {
  const inserted: Record<string, any>[] = [];
  const mutedSet = new Set(muted.map(([u, b]) => `${u}|${b}`));

  const DB = {
    prepare(sql: string) {
      let args: any[] = [];
      const b = {
        bind(...a: any[]) {
          args = a;
          return b;
        },
        async first() {
          if (sql.includes("FROM notification_mutes")) {
            return mutedSet.has(`${args[0]}|${args[1]}`) ? { x: 1 } : null;
          }
          return null;
        },
        async all() {
          return { results: [] };
        },
        async run() {
          if (sql.includes("INSERT INTO notifications")) {
            const [
              id,
              user_id,
              type,
              title,
              message,
              link,
              bounty,
              submission,
            ] = args;
            inserted.push({
              id,
              user_id,
              type,
              title,
              message,
              link,
              bounty,
              submission,
            });
          }
          return { success: true };
        },
      };
      return b;
    },
  };

  return { env: { DB } as any, inserted };
}

describe("notify", () => {
  it("writes a notification", async () => {
    const { env, inserted } = makeEnv();
    const ok = await notify(env, {
      userId: "u1",
      type: "general",
      title: "T",
      message: "M",
    });

    expect(ok).toBe(true);
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ user_id: "u1", type: "general" });
  });

  it("skips a bounty the user has muted", async () => {
    const { env, inserted } = makeEnv([["u1", "b1"]]);
    const ok = await notify(env, {
      userId: "u1",
      type: "new_comment",
      title: "T",
      message: "M",
      bountyId: "b1",
    });

    expect(ok).toBe(false);
    expect(inserted).toHaveLength(0);
  });

  it("does not apply another user's mute", async () => {
    const { env, inserted } = makeEnv([["someone-else", "b1"]]);
    await notify(env, {
      userId: "u1",
      type: "new_comment",
      title: "T",
      message: "M",
      bountyId: "b1",
    });
    expect(inserted).toHaveLength(1);
  });

  it("never throws — a failed notification must not break the action", async () => {
    const DB = {
      prepare() {
        return {
          bind() {
            return this;
          },
          async first() {
            return null;
          },
          async run() {
            throw new Error("db exploded");
          },
        };
      },
    };
    await expect(
      notify({ DB } as any, {
        userId: "u1",
        type: "general",
        title: "T",
        message: "M",
      }),
    ).resolves.toBe(false);
  });

  it("ignores an empty recipient", async () => {
    const { env, inserted } = makeEnv();
    expect(
      await notify(env, {
        userId: "",
        type: "general",
        title: "T",
        message: "M",
      }),
    ).toBe(false);
    expect(inserted).toHaveLength(0);
  });
});

describe("notifyUnlessActor", () => {
  it("does not notify someone about their own action", async () => {
    const { env, inserted } = makeEnv();
    const ok = await notifyUnlessActor(env, "u1", {
      userId: "u1",
      type: "new_comment",
      title: "T",
      message: "M",
    });
    expect(ok).toBe(false);
    expect(inserted).toHaveLength(0);
  });

  it("notifies a different user", async () => {
    const { env, inserted } = makeEnv();
    await notifyUnlessActor(env, "u2", {
      userId: "u1",
      type: "new_comment",
      title: "T",
      message: "M",
    });
    expect(inserted).toHaveLength(1);
  });
});

describe("notifySubmissionReviewed", () => {
  const base = {
    submitterUserId: "winner",
    bountyId: "b1",
    submissionId: "s1",
    bountyTitle: "Write a tutorial",
  };

  it("notifies on revision_requested — previously email-only with no in-app notice", async () => {
    const { env, inserted } = makeEnv();
    await notifySubmissionReviewed(env, {
      ...base,
      status: "revision_requested",
    });

    expect(inserted).toHaveLength(1);
    expect(inserted[0]!.type).toBe("submission_revision_requested");
    expect(inserted[0]!.message).toMatch(/requested changes/i);
  });

  it("notifies on approved and rejected", async () => {
    for (const status of ["approved", "rejected"] as const) {
      const { env, inserted } = makeEnv();
      await notifySubmissionReviewed(env, { ...base, status });
      expect(inserted).toHaveLength(1);
      expect(inserted[0]!.type).toBe(
        status === "approved" ? "submission_accepted" : "submission_rejected",
      );
    }
  });

  it("delivers the verdict even when the bounty is muted", async () => {
    // Muting a bounty silences its comment chatter, not the decision on your
    // own submission.
    const { env, inserted } = makeEnv([["winner", "b1"]]);
    await notifySubmissionReviewed(env, { ...base, status: "approved" });
    expect(inserted).toHaveLength(1);
  });

  it("links to the bounty and records the submission id", async () => {
    const { env, inserted } = makeEnv();
    await notifySubmissionReviewed(env, { ...base, status: "approved" });
    expect(inserted[0]!.link).toBe("/bounty/b1");
    expect(inserted[0]!.submission).toBe("s1");
  });
});

describe("notifySponsorStatusChanged", () => {
  it("covers all four transitions, not just verify", async () => {
    const seen: string[] = [];
    for (const change of [
      "verified",
      "unverified",
      "banned",
      "unbanned",
    ] as const) {
      const { env, inserted } = makeEnv();
      await notifySponsorStatusChanged(env, {
        sponsorUserId: "sp",
        sponsorName: "Acme",
        change,
      });
      expect(inserted).toHaveLength(1);
      seen.push(inserted[0]!.type);
    }
    expect(new Set(seen).size).toBe(4);
  });

  it("names the sponsor so the recipient knows which account", async () => {
    const { env, inserted } = makeEnv();
    await notifySponsorStatusChanged(env, {
      sponsorUserId: "sp",
      sponsorName: "Acme",
      change: "banned",
    });
    expect(inserted[0]!.message).toContain("Acme");
  });
});

describe("notifyCommentReply", () => {
  it("honours the bounty mute — the old client path did not", async () => {
    const { env, inserted } = makeEnv([["author", "b1"]]);
    await notifyCommentReply(env, {
      parentAuthorUserId: "author",
      actorUserId: "replier",
      bountyId: "b1",
      replierName: "Bob",
    });
    expect(inserted).toHaveLength(0);
  });

  it("does not ping you for replying to yourself", async () => {
    const { env, inserted } = makeEnv();
    await notifyCommentReply(env, {
      parentAuthorUserId: "author",
      actorUserId: "author",
      bountyId: "b1",
      replierName: "Me",
    });
    expect(inserted).toHaveLength(0);
  });
});

// ── Endpoint lockdown ──────────────────────────────────────────────────────

function apiEnv(opts: { sessionUserId?: string | null; role?: string | null }) {
  const { sessionUserId = null, role = null } = opts;
  const DB = {
    prepare(sql: string) {
      let args: any[] = [];
      const b = {
        bind(...a: any[]) {
          args = a;
          return b;
        },
        async first() {
          if (sql.includes("FROM session WHERE token"))
            return sessionUserId ? { userId: sessionUserId } : null;
          if (sql.includes("SELECT role FROM user"))
            return role !== null ? { role } : null;
          return {};
        },
        async all() {
          return { results: [] };
        },
        async run() {
          return { success: true };
        },
      };
      return b;
    },
  };
  return { DB } as any;
}

const postNotification = (env: any, withCookie = true) =>
  handleNotificationsAPI(
    new Request("https://x/api/notifications", {
      method: "POST",
      headers: withCookie
        ? { Cookie: "better-auth.session_token=tok" }
        : undefined,
      body: JSON.stringify({
        user_id: "victim",
        type: "general",
        title: "You won 1000 ALPH",
        message: "Claim at evil.example",
        link: "https://evil.example",
      }),
    }),
    env,
    new URL("https://x/api/notifications"),
  );

describe("POST /api/notifications lockdown", () => {
  it("rejects an anonymous caller", async () => {
    // This is the phishing vector: before, anyone could post a notification
    // with any title, body and link to any user.
    const res = await postNotification(apiEnv({}), false);
    expect(res.status).toBe(401);
  });

  it("rejects an ordinary logged-in user", async () => {
    const res = await postNotification(
      apiEnv({ sessionUserId: "u1", role: null }),
    );
    expect(res.status).toBe(403);
  });

  it("allows a god user", async () => {
    const res = await postNotification(
      apiEnv({ sessionUserId: "admin", role: "god" }),
    );
    expect(res.status).toBe(201);
  });
});

describe("mute enforcement is a single chokepoint", () => {
  it("suppresses a bounty notification for a user who muted that bounty", async () => {
    const { env, inserted } = makeEnv([["u1", "b1"]]);

    const created = await notify(env, {
      userId: "u1",
      type: "comment_reply",
      title: "New Reply",
      message: "someone replied",
      bountyId: "b1",
    });

    expect(created).toBe(false);
    expect(inserted).toHaveLength(0);
  });

  it("still delivers a notification that is not tied to a bounty", async () => {
    // Mutes are bounty-scoped; a global notice must not be swallowed by one.
    const { env, inserted } = makeEnv([["u1", "b1"]]);

    expect(
      await notify(env, {
        userId: "u1",
        type: "comment_reply",
        title: "Announcement",
        message: "platform news",
      }),
    ).toBe(true);
    expect(inserted).toHaveLength(1);
  });

  it("delivers a reply on a bounty the user did not mute", async () => {
    const { env, inserted } = makeEnv([["u1", "b1"]]);

    expect(
      await notify(env, {
        userId: "u1",
        type: "comment_reply",
        title: "New Reply",
        message: "someone replied",
        bountyId: "b2",
      }),
    ).toBe(true);
    expect(inserted).toHaveLength(1);
  });
});
