import { describe, it, expect, vi, beforeEach } from "vitest";
import { notifySponsorAccountChange, categoryForType } from "@/worker/email";

const sent: { to: string; subject: string; html: string }[] = [];

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (o: any) => {
        sent.push({ to: o.to, subject: o.subject, html: o.html });
        return { data: { id: "re_test" }, error: null };
      },
    };
  },
}));

function makeEnv(
  row: any = {
    user_id: "u1",
    email: "s@b.c",
    name: "Sam",
    sponsor_name: "Acme",
  },
) {
  const logged: any[] = [];
  const DB = {
    prepare(sql: string) {
      let args: any[] = [];
      const b = {
        bind(...a: any[]) {
          args = a;
          return b;
        },
        async first() {
          if (sql.includes("FROM sponsors s JOIN user u")) return row;
          // No opt-out rows: these must send regardless anyway.
          return null;
        },
        async run() {
          if (sql.includes("INSERT INTO email_logs")) {
            logged.push({ type: args[3], status: args[4], user_id: args[7] });
          }
          return { meta: { changes: 1 } };
        },
      };
      return b;
    },
  };
  return {
    env: { DB, RESEND_API_KEY: "k", INTERNAL_SECRET: "s" } as any,
    logged,
  };
}

beforeEach(() => {
  sent.length = 0;
});

describe("notifySponsorAccountChange", () => {
  it("sends for every transition, not just the good news", async () => {
    for (const change of [
      "verified",
      "unverified",
      "banned",
      "unbanned",
    ] as const) {
      sent.length = 0;
      const { env, logged } = makeEnv();
      await notifySponsorAccountChange(env, "sp1", change);

      expect(sent, `${change} should send`).toHaveLength(1);
      expect(logged[0]).toMatchObject({
        type: `sponsor_${change}`,
        status: "sent",
        user_id: "u1",
      });
    }
  });

  it("tells a suspended sponsor what happened and how to appeal", async () => {
    const { env } = makeEnv();
    await notifySponsorAccountChange(env, "sp1", "banned");

    expect(sent[0].subject).toMatch(/suspended/i);
    expect(sent[0].html).toContain("Acme");
    expect(sent[0].html).toMatch(/reply to this email/i);
  });

  it("is transactional, so an opt-out can never suppress it", () => {
    // Uncategorised types bypass the unsubscribe check in sendAndLog.
    for (const c of ["verified", "unverified", "banned", "unbanned"]) {
      expect(categoryForType(`sponsor_${c}`)).toBeNull();
    }
  });

  it("does nothing when the sponsor has no email on file", async () => {
    const { env } = makeEnv({
      user_id: "u1",
      email: null,
      name: null,
      sponsor_name: "Acme",
    });
    await notifySponsorAccountChange(env, "sp1", "banned");
    expect(sent).toHaveLength(0);
  });
});
