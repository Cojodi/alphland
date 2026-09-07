import { describe, it, expect, vi, beforeEach } from "vitest";
import { alreadySent, sendAndLog } from "@/worker/email";

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async () => ({ data: { id: "re_test" }, error: null }),
    };
  },
}));

/**
 * Captures email_logs inserts; `sent` seeds rows that alreadySent() should
 * match against.
 */
function makeEnv(
  sent: { type: string; userId: string; bountyId?: string }[] = [],
) {
  const logged: Record<string, any>[] = [];

  const DB = {
    prepare(sql: string) {
      let args: any[] = [];
      const b = {
        bind(...a: any[]) {
          args = a;
          return b;
        },
        async first() {
          if (sql.includes("FROM email_logs")) {
            const [type, userId, bountyId] = args;
            const hit = sent.some(
              (s) =>
                s.type === type &&
                s.userId === userId &&
                (bountyId == null || s.bountyId === bountyId),
            );
            return hit ? { hit: 1 } : null;
          }
          return null;
        },
        async run() {
          if (sql.includes("INSERT INTO email_logs")) {
            const [
              id,
              to_email,
              subject,
              type,
              status,
              resend_id,
              error,
              user_id,
              bounty_id,
            ] = args;
            logged.push({
              id,
              to_email,
              subject,
              type,
              status,
              resend_id,
              error,
              user_id,
              bounty_id,
            });
          }
          return { meta: { changes: 1 } };
        },
      };
      return b;
    },
  };

  return { env: { DB, RESEND_API_KEY: "re_key" } as any, logged };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("sendAndLog", () => {
  it("records the recipient and bounty on the log row", async () => {
    const { env, logged } = makeEnv();

    await sendAndLog(env, "a@b.c", "Subject", "submission_approved", "<p/>", {
      userId: "u1",
      bountyId: "b1",
    });

    expect(logged[0]).toMatchObject({
      to_email: "a@b.c",
      type: "submission_approved",
      status: "sent",
      user_id: "u1",
      bounty_id: "b1",
    });
  });

  it("writes NULLs when no context is given, so transactional mail still logs", async () => {
    const { env, logged } = makeEnv();

    await sendAndLog(env, "a@b.c", "Verify", "verification", "<p/>");

    expect(logged[0]?.user_id).toBeNull();
    expect(logged[0]?.bounty_id).toBeNull();
  });
});

describe("alreadySent", () => {
  it("is true for a repeat of the same type to the same user on the same bounty", async () => {
    const { env } = makeEnv([
      { type: "bounty_deadline", userId: "u1", bountyId: "b1" },
    ]);

    expect(
      await alreadySent(env, "bounty_deadline", {
        userId: "u1",
        bountyId: "b1",
      }),
    ).toBe(true);
  });

  it("is false for a different bounty, user, or type", async () => {
    const { env } = makeEnv([
      { type: "bounty_deadline", userId: "u1", bountyId: "b1" },
    ]);

    expect(
      await alreadySent(env, "bounty_deadline", {
        userId: "u1",
        bountyId: "b2",
      }),
    ).toBe(false);
    expect(
      await alreadySent(env, "bounty_deadline", {
        userId: "u2",
        bountyId: "b1",
      }),
    ).toBe(false);
    expect(
      await alreadySent(env, "bounty_closed", { userId: "u1", bountyId: "b1" }),
    ).toBe(false);
  });

  it("is false without a userId rather than suppressing everyone's mail", async () => {
    const { env } = makeEnv([{ type: "bounty_deadline", userId: "u1" }]);

    expect(await alreadySent(env, "bounty_deadline", {})).toBe(false);
    expect(await alreadySent(env, "bounty_deadline", { bountyId: "b1" })).toBe(
      false,
    );
  });
});
