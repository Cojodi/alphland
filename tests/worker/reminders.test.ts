import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runBountyReminders,
  DEADLINE_WARN_SECONDS,
  REVIEW_OVERDUE_SECONDS,
  REVIEW_ESCALATE_SECONDS,
} from "@/worker/reminders";

const sent: { to: string; type: string }[] = [];

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (opts: any) => {
        sent.push({ to: opts.to, type: "" });
        return { data: { id: "re_test" }, error: null };
      },
    };
  },
}));

const NOW = 1785254400; // 2026-07-28T16:00:00Z
const HOUR = 3600;
const DAY = 24 * HOUR;

/**
 * Minimal D1 stand-in. `rows` maps a fragment of each query to its result,
 * and every INSERT into email_logs is recorded so dedupe can be exercised.
 */
function makeEnv(opts: {
  closingSoon?: any[];
  bookmarkers?: any[];
  overdue?: any[];
  admins?: any[];
  alreadyLogged?: { type: string; userId: string; bountyId: string }[];
}) {
  const logged = [...(opts.alreadyLogged ?? [])];

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
            const hit = logged.some(
              (l) =>
                l.type === type &&
                l.userId === userId &&
                (bountyId == null || l.bountyId === bountyId),
            );
            return hit ? { hit: 1 } : null;
          }
          if (sql.includes("FROM email_unsubscribes")) return null;
          return null;
        },
        async all() {
          if (sql.includes("FROM bounties") && sql.includes("end_date > ?")) {
            return { results: opts.closingSoon ?? [] };
          }
          if (sql.includes("FROM bookmarks")) {
            return { results: opts.bookmarkers ?? [] };
          }
          if (sql.includes("JOIN sponsors s ON b.sponsor_id")) {
            return { results: opts.overdue ?? [] };
          }
          if (sql.includes("role = 'god'")) {
            return { results: opts.admins ?? [] };
          }
          return { results: [] };
        },
        async run() {
          if (sql.includes("INSERT INTO email_logs")) {
            const [, , , type, status, , , user_id, bounty_id] = args;
            if (status === "sent") {
              logged.push({ type, userId: user_id, bountyId: bounty_id });
            }
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
  sent.length = 0;
  vi.useFakeTimers();
  vi.setSystemTime(NOW * 1000);
});

describe("window constants match the documented policy", () => {
  it("warns at 48h, reminds at 7 days, escalates at 14", () => {
    expect(DEADLINE_WARN_SECONDS).toBe(48 * HOUR);
    expect(REVIEW_OVERDUE_SECONDS).toBe(7 * DAY);
    expect(REVIEW_ESCALATE_SECONDS).toBe(14 * DAY);
  });
});

describe("deadline reminders", () => {
  it("emails a bookmarker who has not submitted", async () => {
    const { env } = makeEnv({
      closingSoon: [{ id: "b1", title: "Test", end_date: NOW + 10 * HOUR }],
      bookmarkers: [{ user_id: "u1", email: "a@b.c", name: "A" }],
    });

    const counts = await runBountyReminders(env);
    expect(counts.deadlineSoon).toBe(1);
    expect(sent).toHaveLength(1);
  });

  it("does not send the same reminder twice — the cron runs hourly", async () => {
    const { env } = makeEnv({
      closingSoon: [{ id: "b1", title: "Test", end_date: NOW + 10 * HOUR }],
      bookmarkers: [{ user_id: "u1", email: "a@b.c", name: "A" }],
    });

    await runBountyReminders(env);
    await runBountyReminders(env);
    await runBountyReminders(env);

    expect(sent).toHaveLength(1);
  });

  it("skips a bookmarker with no email address", async () => {
    const { env } = makeEnv({
      closingSoon: [{ id: "b1", title: "Test", end_date: NOW + HOUR }],
      bookmarkers: [{ user_id: "u1", email: null, name: "A" }],
    });

    expect((await runBountyReminders(env)).deadlineSoon).toBe(0);
    expect(sent).toHaveLength(0);
  });
});

describe("overdue review", () => {
  const overdue = [
    {
      id: "b1",
      title: "Late",
      sponsor_name: "Acme",
      sponsor_user_id: "s1",
      sponsor_email: "s@b.c",
      sponsor_contact: "S",
      submission_count: 3,
    },
  ];

  it("reminds the sponsor once", async () => {
    const { env } = makeEnv({ overdue });

    await runBountyReminders(env);
    await runBountyReminders(env);

    // One sponsor reminder; escalation reuses the same query in this stub,
    // so filter to the sponsor address.
    expect(sent.filter((s) => s.to === "s@b.c")).toHaveLength(1);
  });

  it("ignores a bounty nobody entered", async () => {
    const { env } = makeEnv({
      overdue: [{ ...overdue[0], submission_count: 0 }],
    });

    const counts = await runBountyReminders(env);
    expect(counts.reviewOverdue).toBe(0);
    expect(counts.escalated).toBe(0);
  });

  it("escalates to every admin, once each", async () => {
    const { env } = makeEnv({
      overdue,
      admins: [
        { id: "g1", email: "g1@b.c" },
        { id: "g2", email: "g2@b.c" },
      ],
    });

    await runBountyReminders(env);
    await runBountyReminders(env);

    expect(sent.filter((s) => s.to === "g1@b.c")).toHaveLength(1);
    expect(sent.filter((s) => s.to === "g2@b.c")).toHaveLength(1);
  });

  it("does nothing when there are no admins to escalate to", async () => {
    const { env } = makeEnv({ overdue, admins: [] });
    expect((await runBountyReminders(env)).escalated).toBe(0);
  });
});

describe("isolation", () => {
  it("keeps running the other stages when one query throws", async () => {
    const { env } = makeEnv({
      overdue: [
        {
          id: "b1",
          title: "Late",
          sponsor_name: "Acme",
          sponsor_user_id: "s1",
          sponsor_email: "s@b.c",
          sponsor_contact: "S",
          submission_count: 1,
        },
      ],
    });

    const realPrepare = env.DB.prepare.bind(env.DB);
    env.DB.prepare = (sql: string) => {
      if (sql.includes("FROM bookmarks")) throw new Error("D1 down");
      return realPrepare(sql);
    };

    const counts = await runBountyReminders(env);
    expect(counts.deadlineSoon).toBe(0);
    // The sponsor reminder still went out despite the bookmark stage failing.
    expect(counts.reviewOverdue).toBe(1);
  });

  it("never throws, so it cannot take down the indexer sharing the handler", async () => {
    const { env } = makeEnv({});
    env.DB.prepare = () => {
      throw new Error("everything is broken");
    };

    await expect(runBountyReminders(env)).resolves.toEqual({
      deadlineSoon: 0,
      reviewOverdue: 0,
      escalated: 0,
    });
  });
});
