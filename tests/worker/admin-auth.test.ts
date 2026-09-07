import { describe, it, expect } from "vitest";
import worker, { type Env } from "@/worker/index";

/**
 * Minimal D1 mock. Special-cases the two auth queries
 * (session lookup + role lookup) based on the scenario under test;
 * everything else returns harmless defaults so downstream handler
 * code (past the auth guard) can run to completion without throwing.
 */
function makeEnv(opts: {
  sessionUserId?: string | null; // null = no matching/live session row
  role?: string | null; // role of the session's user, if session exists
}): Env {
  const { sessionUserId = null, role = null } = opts;

  const DB = {
    prepare(sql: string) {
      const builder = {
        bind(..._args: any[]) {
          return builder;
        },
        async first() {
          if (sql.includes("FROM session WHERE token")) {
            return sessionUserId ? { userId: sessionUserId } : null;
          }
          if (sql.includes("SELECT role FROM user WHERE id")) {
            return role !== null ? { role } : null;
          }
          // Generic fallback for downstream admin-handler queries
          return {};
        },
        async all() {
          return { results: [] };
        },
        async run() {
          return { success: true };
        },
      };
      return builder;
    },
  };

  return { DB } as unknown as Env;
}

function req(
  path: string,
  opts: { method?: string; cookie?: string } = {},
): Request {
  const headers = new Headers();
  if (opts.cookie) headers.set("cookie", opts.cookie);
  return new Request(`https://alph.land${path}`, {
    method: opts.method || "GET",
    headers,
  });
}

const VALID_COOKIE = "better-auth.session_token=live-token";

// Every /api/admin/* route the worker exposes, with its method.
const ADMIN_ROUTES: { path: string; method: string }[] = [
  { path: "/api/admin/user-stats", method: "GET" },
  { path: "/api/admin/users", method: "GET" },
  { path: "/api/admin/users/user_123", method: "GET" },
  { path: "/api/admin/users/user_123/ban", method: "PUT" },
  { path: "/api/admin/users/user_123/unban", method: "PUT" },
  { path: "/api/admin/sponsors/sponsor_123/ban", method: "PUT" },
  { path: "/api/admin/sponsors/sponsor_123/unban", method: "PUT" },
  { path: "/api/admin/sponsors/sponsor_123/verify", method: "PUT" },
  { path: "/api/admin/sponsors/sponsor_123/unverify", method: "PUT" },
  { path: "/api/admin/submission-stats", method: "GET" },
  { path: "/api/admin/bounty-popularity", method: "GET" },
  { path: "/api/admin/email-logs", method: "GET" },
];

describe("/api/admin/* auth guard", () => {
  describe("no session cookie", () => {
    for (const { path, method } of ADMIN_ROUTES) {
      it(`${method} ${path} -> 401`, async () => {
        const env = makeEnv({ sessionUserId: null });
        const res = await worker.fetch(req(path, { method }), env, {});
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body).toEqual({ error: "Unauthorized" });
      });
    }
  });

  describe("session cookie present but no matching/live session row", () => {
    // getSessionUserId returns null for an unknown or expired token —
    // guard must treat this the same as "not logged in" (401), not crash.
    for (const { path, method } of ADMIN_ROUTES) {
      it(`${method} ${path} -> 401`, async () => {
        const env = makeEnv({ sessionUserId: null });
        const res = await worker.fetch(
          req(path, { method, cookie: "better-auth.session_token=bogus" }),
          env,
          {},
        );
        expect(res.status).toBe(401);
      });
    }
  });

  describe("logged in but not a god user", () => {
    for (const { path, method } of ADMIN_ROUTES) {
      it(`${method} ${path} -> 403`, async () => {
        const env = makeEnv({ sessionUserId: "user_1", role: "sponsor" });
        const res = await worker.fetch(
          req(path, { method, cookie: VALID_COOKIE }),
          env,
          {},
        );
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body).toEqual({ error: "Unauthorized" });
      });
    }

    it("treats a user row with role=null the same as non-god -> 403", async () => {
      const env = makeEnv({ sessionUserId: "user_1", role: null as any });
      // role null in DB means the SELECT still returns a row ({role: null}),
      // so simulate that distinctly from "no user row at all".
      const dbEnv: Env = {
        DB: {
          prepare(sql: string) {
            return {
              bind: () => ({
                first: async () => {
                  if (sql.includes("FROM session WHERE token")) {
                    return { userId: "user_1" };
                  }
                  if (sql.includes("SELECT role FROM user WHERE id")) {
                    return { role: null };
                  }
                  return {};
                },
                all: async () => ({ results: [] }),
                run: async () => ({ success: true }),
              }),
            };
          },
        },
      } as unknown as Env;
      void env;
      const res = await worker.fetch(
        req("/api/admin/users", { cookie: VALID_COOKIE }),
        dbEnv,
        {},
      );
      expect(res.status).toBe(403);
    });
  });

  describe("logged in as a god user", () => {
    for (const { path, method } of ADMIN_ROUTES) {
      it(`${method} ${path} -> passes the guard (not 401/403)`, async () => {
        const env = makeEnv({ sessionUserId: "god_1", role: "god" });
        const res = await worker.fetch(
          req(path, { method, cookie: VALID_COOKIE }),
          env,
          {},
        );
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
      });
    }

    it("GET /api/admin/user-stats returns real data once past the guard", async () => {
      const env = makeEnv({ sessionUserId: "god_1", role: "god" });
      const res = await worker.fetch(
        req("/api/admin/user-stats", { cookie: VALID_COOKIE }),
        env,
        {},
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("total_users");
      expect(body).toHaveProperty("daily_trend");
    });

    it("PUT /api/admin/users/:id/ban actually runs the ban query", async () => {
      const env = makeEnv({ sessionUserId: "god_1", role: "god" });
      const res = await worker.fetch(
        req("/api/admin/users/user_123/ban", {
          method: "PUT",
          cookie: VALID_COOKIE,
        }),
        env,
        {},
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ success: true });
    });
  });
});

describe("non-admin routes are unaffected by the /api/admin/* guard", () => {
  it("GET /api/db-test does not require auth", async () => {
    const env = makeEnv({ sessionUserId: null });
    const res = await worker.fetch(req("/api/db-test"), env, {});
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it("GET /api/bounty-overview does not require auth", async () => {
    const env = makeEnv({ sessionUserId: null });
    const res = await worker.fetch(req("/api/bounty-overview"), env, {});
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it("GET /api/dapp-list does not require auth", async () => {
    const env = makeEnv({ sessionUserId: null });
    const res = await worker.fetch(req("/api/dapp-list"), env, {});
    expect(res.status).toBe(200);
  });
});
