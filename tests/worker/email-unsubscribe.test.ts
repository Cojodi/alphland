import { describe, it, expect, vi } from "vitest";
import {
  categoryForType,
  isUnsubscribed,
  signUnsubscribe,
  verifyUnsubscribe,
  sendAndLog,
  EMAIL_CATEGORIES,
} from "@/worker/email";

const sent: { to: string; headers?: Record<string, string>; html: string }[] =
  [];

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (opts: any) => {
        sent.push({ to: opts.to, headers: opts.headers, html: opts.html });
        return { data: { id: "re_test" }, error: null };
      },
    };
  },
}));

/** `optedOut` seeds email_unsubscribes rows as (userId, category) pairs. */
function makeEnv(optedOut: [string, string][] = [], secret = "s3cret") {
  const logged: Record<string, any>[] = [];
  const out = new Set(optedOut.map(([u, c]) => `${u}|${c}`));

  const DB = {
    prepare(sql: string) {
      let args: any[] = [];
      const b = {
        bind(...a: any[]) {
          args = a;
          return b;
        },
        async first() {
          if (sql.includes("FROM email_unsubscribes")) {
            const [userId, category] = args;
            return out.has(`${userId}|${category}`) || out.has(`${userId}|all`)
              ? { hit: 1 }
              : null;
          }
          return null;
        },
        async all() {
          return { results: [] };
        },
        async run() {
          if (sql.includes("INSERT INTO email_logs")) {
            const [, to_email, , type, status] = args;
            logged.push({ to_email, type, status });
          }
          return { meta: { changes: 1 } };
        },
      };
      return b;
    },
  };

  return {
    env: {
      DB,
      RESEND_API_KEY: "re_key",
      INTERNAL_SECRET: secret,
    } as any,
    logged,
  };
}

describe("categoryForType", () => {
  it("maps notification mail to a category", () => {
    expect(categoryForType("submission_approved")).toBe("submission_result");
    expect(categoryForType("new_submission")).toBe("sponsor_activity");
    expect(categoryForType("bounty_deadline")).toBe("deadline");
  });

  it("leaves transactional mail uncategorised so it can never be suppressed", () => {
    expect(categoryForType("sponsor_verified")).toBeNull();
    expect(categoryForType("verification")).toBeNull();
    expect(categoryForType("reset_password")).toBeNull();
  });

  it("only maps to categories the settings page knows about", () => {
    for (const t of [
      "submission_approved",
      "submission_rejected",
      "revision_requested",
      "new_submission",
      "submission_resubmitted",
      "bounty_deadline",
      "review_overdue",
      "scout_invite",
      "product",
    ]) {
      expect(EMAIL_CATEGORIES).toContain(categoryForType(t) as any);
    }
  });
});

describe("isUnsubscribed", () => {
  it("matches the category itself", async () => {
    const { env } = makeEnv([["u1", "deadline"]]);
    expect(await isUnsubscribed(env, "u1", "deadline")).toBe(true);
    expect(await isUnsubscribed(env, "u1", "product")).toBe(false);
  });

  it("treats 'all' as covering every category", async () => {
    const { env } = makeEnv([["u1", "all"]]);
    expect(await isUnsubscribed(env, "u1", "deadline")).toBe(true);
    expect(await isUnsubscribed(env, "u1", "submission_result")).toBe(true);
  });
});

describe("unsubscribe tokens", () => {
  it("round-trips", async () => {
    const { env } = makeEnv();
    const t = await signUnsubscribe(env, "u1", "deadline");
    expect(t).toBeTruthy();
    expect(await verifyUnsubscribe(env, "u1", "deadline", t!)).toBe(true);
  });

  it("does not let one user's token unsubscribe another user", async () => {
    const { env } = makeEnv();
    const t = (await signUnsubscribe(env, "u1", "deadline"))!;

    expect(await verifyUnsubscribe(env, "u2", "deadline", t)).toBe(false);
    expect(await verifyUnsubscribe(env, "u1", "product", t)).toBe(false);
    expect(await verifyUnsubscribe(env, "u1", "deadline", "garbage")).toBe(
      false,
    );
  });

  it("refuses to sign when INTERNAL_SECRET is unset", async () => {
    const { env } = makeEnv([], "");
    expect(await signUnsubscribe(env, "u1", "deadline")).toBeNull();
    expect(await verifyUnsubscribe(env, "u1", "deadline", "anything")).toBe(
      false,
    );
  });
});

describe("sendAndLog suppression", () => {
  it("does not send to an opted-out user, but still logs it", async () => {
    sent.length = 0;
    const { env, logged } = makeEnv([["u1", "submission_result"]]);

    await sendAndLog(env, "a@b.c", "S", "submission_approved", "<p/>", {
      userId: "u1",
      bountyId: "b1",
    });

    expect(sent).toHaveLength(0);
    expect(logged[0]).toMatchObject({ status: "suppressed" });
  });

  it("still sends transactional mail to a user who opted out of everything", async () => {
    sent.length = 0;
    const { env, logged } = makeEnv([["u1", "all"]]);

    await sendAndLog(env, "a@b.c", "S", "sponsor_verified", "<p/>", {
      userId: "u1",
    });

    expect(sent).toHaveLength(1);
    expect(logged[0]).toMatchObject({ status: "sent" });
  });

  it("attaches List-Unsubscribe headers and a footer link to categorised mail", async () => {
    sent.length = 0;
    const { env } = makeEnv();

    await sendAndLog(env, "a@b.c", "S", "submission_approved", "<p>body</p>", {
      userId: "u1",
      bountyId: "b1",
    });

    expect(sent[0]?.headers?.["List-Unsubscribe"]).toMatch(
      /^<https:\/\/alph\.land\/api\/email\/unsubscribe\?u=u1&c=submission_result&t=.+>$/,
    );
    expect(sent[0]?.headers?.["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click",
    );
    expect(sent[0]?.html).toContain("Unsubscribe from these emails");
  });

  it("omits the unsubscribe link entirely rather than emitting an unsigned one", async () => {
    sent.length = 0;
    const { env } = makeEnv([], "");

    await sendAndLog(env, "a@b.c", "S", "submission_approved", "<p>body</p>", {
      userId: "u1",
    });

    expect(sent[0]?.headers).toBeUndefined();
    expect(sent[0]?.html).not.toContain("Unsubscribe");
  });

  it("sends anyway when the opt-out lookup throws", async () => {
    sent.length = 0;
    const { env } = makeEnv();
    env.DB.prepare = () => ({
      bind: () => ({
        first: async () => {
          throw new Error("D1 down");
        },
        async run() {
          return { meta: { changes: 1 } };
        },
      }),
    });

    await sendAndLog(env, "a@b.c", "S", "submission_approved", "<p/>", {
      userId: "u1",
    });

    expect(sent).toHaveLength(1);
  });
});
