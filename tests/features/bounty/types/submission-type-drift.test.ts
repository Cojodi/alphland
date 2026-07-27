import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guards the submission types against describing an API that does not exist.
 *
 * `Submission` and `BountySubmission` used to promise `submitted_at`,
 * `completed_at`, `review_started_at`, `title` and `tweet_url`. No endpoint
 * sends any of them, and TypeScript cannot tell -- every one was a silent
 * `undefined` at runtime. That is how the sponsor dashboard came to render a
 * blank review date on every submission, and the literal word "Submission" as
 * every submission's title.
 *
 * A field is legitimate if it is either a real column on bounty_submissions or
 * a registered join alias. Adding one that is neither fails here rather than
 * showing up as a blank cell months later.
 */

const ROOT = resolve(__dirname, "../../../..");

/** Column names on bounty_submissions, read from the schema dumped from prod. */
function schemaColumns(): string[] {
  const sql = readFileSync(
    resolve(ROOT, "migrations/000_baseline_schema.sql"),
    "utf8",
  );
  const body = sql.split("CREATE TABLE bounty_submissions")[1]?.split(");")[0];
  if (!body) throw new Error("bounty_submissions not found in schema dump");

  const cols: string[] = [];
  for (const line of body.split("\n")) {
    const m = line.match(/^\s{2}(\w+)\s+(TEXT|INTEGER|REAL|BLOB|NUMERIC)/i);
    if (m?.[1]) cols.push(m[1]);
  }
  return cols;
}

/**
 * Columns added by migrations after the baseline was dumped.
 *
 * Re-dump the baseline and empty this out when convenient; until then a new
 * migration has to be listed here, which is the reminder to do it.
 */
const MIGRATION_COLUMNS = [
  // 029_structured_submission_result.sql
  "is_winner",
  "winner_position",
  "reward_amount",
  "reward_currency",
  "reward_usd",
  "is_paid",
  "paid_at",
  "label",
];

/**
 * Fields the API joins in or computes. Each one must be traceable to a SELECT
 * in the worker — if you cannot point at the query that produces it, it does
 * not belong here.
 */
const JOIN_ALIASES = [
  "bounty_title", // b.title
  "sponsor_id", // b.sponsor_id
  "sponsor_name", // sp.name
  "sponsor_logo_url", // sp.logo_url
  "user_username", // COALESCE(up.username, u.name, u.email)
  "user_avatar_url", // u.image
  "user_full_name", // u.name
  "user_wallet_address", // up.wallet_address
  "reward", // assembled by transformBounty
];

function declaredFields(file: string, iface: string): string[] {
  const src = readFileSync(resolve(ROOT, file), "utf8");
  const body = src.split(`export interface ${iface} {`)[1]?.split("\n}")[0];
  if (!body) throw new Error(`${iface} not found in ${file}`);

  const fields: string[] = [];
  let depth = 0;
  for (const line of body.split("\n")) {
    // Skip nested object literals (e.g. `reward: { token: ... }`)
    if (depth === 0) {
      const m = line.match(/^\s{2}(\w+)\??:/);
      if (m?.[1]) fields.push(m[1]);
    }
    depth += (line.match(/\{/g) || []).length;
    depth -= (line.match(/\}/g) || []).length;
  }
  return fields;
}

const allowed = new Set(
  schemaColumns().concat(MIGRATION_COLUMNS, JOIN_ALIASES),
);

describe("submission types match what the API returns", () => {
  it("reads the schema dump successfully", () => {
    const cols = schemaColumns();
    expect(cols).toContain("id");
    expect(cols).toContain("reviewer_notes");
    expect(cols).toContain("created_at");
    expect(cols.length).toBeGreaterThan(8);
  });

  for (const [file, iface] of [
    ["src/features/bounty/types/submission.types.ts", "Submission"],
    ["src/lib/api-client.ts", "BountySubmission"],
  ] as const) {
    it(`${iface} declares no field the API cannot supply`, () => {
      const unknown = declaredFields(file, iface).filter(
        (f) => !allowed.has(f),
      );
      expect(
        unknown,
        `${iface} declares ${unknown.join(", ")} — add the column, register ` +
          `the join alias, or drop the field. A field nothing supplies is an ` +
          `undefined at runtime that TypeScript will not catch.`,
      ).toEqual([]);
    });
  }

  it("rejects the exact fields that caused the blank review date", () => {
    // Regression: these five were declared but never sent.
    const gone = [
      "submitted_at",
      "completed_at",
      "review_started_at",
      "tweet_url",
      "title",
    ];
    for (const file of [
      "src/features/bounty/types/submission.types.ts",
      "src/lib/api-client.ts",
    ]) {
      const iface = file.includes("api-client")
        ? "BountySubmission"
        : "Submission";
      const fields = declaredFields(file, iface);
      for (const f of gone) expect(fields).not.toContain(f);
    }
  });

  it("keeps every join alias traceable to a worker query", () => {
    // A stale alias is how the list stops being a guard and starts being a
    // rubber stamp, so each must still appear in a SELECT.
    const worker =
      readFileSync(resolve(ROOT, "src/worker/handlers.ts"), "utf8") +
      readFileSync(resolve(ROOT, "src/worker/index.ts"), "utf8");

    for (const alias of JOIN_ALIASES) {
      if (alias === "reward") continue; // built in transformBounty, not SQL
      // Either renamed (`b.title as bounty_title`) or selected under a name it
      // already has (`b.sponsor_id`).
      const selected =
        worker.includes(`as ${alias}`) ||
        new RegExp(`\\b\\w+\\.${alias}\\b`).test(worker);
      expect(selected, `join alias "${alias}" is no longer selected`).toBe(
        true,
      );
    }
  });
});
