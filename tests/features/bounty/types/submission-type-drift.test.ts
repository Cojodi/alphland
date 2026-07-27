import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
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
 * A declared field must be a real column or a registered join alias.
 */

const ROOT = resolve(__dirname, "../../../..");
const SCHEMA_DUMP = resolve(ROOT, "migrations/000_baseline_schema.sql");

/**
 * Columns on `bounty_submissions`, as of migration 029.
 *
 * Inlined rather than read from the schema dump because `migrations/` is
 * gitignored -- CI has no dump to read. That makes this a second copy of the
 * schema, so the last test in this file re-derives it from the dump whenever
 * one is present (i.e. on a machine that has run the migrations) and fails if
 * the two have drifted apart.
 */
const SUBMISSION_COLUMNS = [
  "id",
  "bounty_id",
  "user_id",
  "submission_url",
  "description",
  "status",
  "reviewer_notes",
  "reviewed_by",
  "reviewed_at",
  "transaction_hash",
  "created_at",
  "updated_at",
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
 * Fields the API joins in or computes. Each must be traceable to a SELECT in
 * the worker -- if you cannot point at the query that produces it, it does not
 * belong here.
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

const allowed = new Set(SUBMISSION_COLUMNS.concat(JOIN_ALIASES));

/** Column names in the CREATE TABLE for bounty_submissions. */
function columnsFromDump(): string[] {
  const sql = readFileSync(SCHEMA_DUMP, "utf8");
  const stmt = sql.split("CREATE TABLE bounty_submissions")[1]?.split(");")[0];
  if (!stmt) throw new Error("bounty_submissions not found in schema dump");

  // Drop everything up to the opening bracket; leaving it in would start the
  // depth counter at 1 and no top-level comma would ever be seen.
  const body = stmt.slice(stmt.indexOf("(") + 1);

  // Columns added by ALTER TABLE are appended by SQLite onto a single line at
  // the end of the statement, so splitting on newlines misses every one of
  // them. Split on commas at bracket depth zero instead.
  const parts: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  parts.push(buf);

  const cols: string[] = [];
  for (const part of parts) {
    const m = part.trim().match(/^(\w+)\s+(TEXT|INTEGER|REAL|BLOB|NUMERIC)\b/i);
    if (m?.[1]) cols.push(m[1]);
  }
  return cols;
}

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

const INTERFACES = [
  ["src/features/bounty/types/submission.types.ts", "Submission"],
  ["src/lib/api-client.ts", "BountySubmission"],
] as const;

describe("submission types match what the API returns", () => {
  for (const [file, iface] of INTERFACES) {
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
    for (const [file, iface] of INTERFACES) {
      const fields = declaredFields(file, iface);
      for (const f of gone) expect(fields).not.toContain(f);
    }
  });

  it("keeps every join alias traceable to a worker query", () => {
    // A stale alias is how the list stops being a guard and becomes a rubber
    // stamp, so each must still appear in a SELECT.
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

  // Reported as skipped, not passed, when there is no dump -- a silent pass
  // would quietly turn the inlined list into an unchecked second source.
  it.skipIf(!existsSync(SCHEMA_DUMP))(
    "inlined column list still matches the schema dump",
    () => {
      expect(
        columnsFromDump().sort(),
        "SUBMISSION_COLUMNS has drifted from the database. Re-dump the " +
          "baseline and update the list — the command is in the header of " +
          "migrations/000_baseline_schema.sql.",
      ).toEqual([...SUBMISSION_COLUMNS].sort());
    },
  );
});
