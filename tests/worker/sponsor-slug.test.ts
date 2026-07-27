import { describe, it, expect } from "vitest";
import { normalizeSponsorSlug, isSponsorSlugTaken } from "@/worker/handlers";

/** D1 stand-in holding a fixed sponsor table. */
function makeEnv(
  sponsors: { id: string; name: string; username: string | null }[],
) {
  const DB = {
    prepare(_sql: string) {
      let args: any[] = [];
      const b = {
        bind(...a: any[]) {
          args = a;
          return b;
        },
        async all() {
          const exclude = args[0];
          return { results: sponsors.filter((s) => s.id !== exclude) };
        },
        async first() {
          return null;
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

const PROD = [
  { id: "s1", name: "Alephium", username: null },
  { id: "s2", name: "Linx Labs", username: null },
  { id: "s3", name: "BabyPoolTool", username: null },
];

describe("normalizeSponsorSlug", () => {
  it("lowercases and strips punctuation and spaces", () => {
    expect(normalizeSponsorSlug("Linx Labs")).toBe("linxlabs");
    expect(normalizeSponsorSlug("Very Good Company")).toBe("verygoodcompany");
    expect(normalizeSponsorSlug("aleph-ium")).toBe("alephium");
    expect(normalizeSponsorSlug("ALPH_2048")).toBe("alph2048");
  });

  it("collapses the variants that the lookup query treats as equal", () => {
    // GET /api/sponsors/name/:slug strips spaces, dashes and underscores and
    // lowercases, so these must not be considered distinct usernames.
    const forms = [
      "Alephium",
      "alephium",
      "ALEPHIUM",
      "aleph-ium",
      "aleph_ium",
    ];
    const normalized = new Set(forms.map(normalizeSponsorSlug));
    expect(normalized.size).toBe(1);
  });

  it("returns empty for input with nothing usable", () => {
    expect(normalizeSponsorSlug("---")).toBe("");
    expect(normalizeSponsorSlug("  ")).toBe("");
  });
});

describe("isSponsorSlugTaken", () => {
  it("blocks claiming another sponsor's name as a username", async () => {
    // The hijack this whole change exists to prevent: a rival sets
    // username='alephium', and /bounty/sponsor/alephium then matches two rows
    // (one by username, one by normalised name) under a LIMIT 1.
    expect(await isSponsorSlugTaken(makeEnv(PROD), "alephium")).toBe(true);
    expect(await isSponsorSlugTaken(makeEnv(PROD), "Alephium")).toBe(true);
    expect(await isSponsorSlugTaken(makeEnv(PROD), "aleph-ium")).toBe(true);
  });

  it("blocks a username already held by another sponsor", async () => {
    const env = makeEnv([
      ...PROD,
      { id: "s4", name: "Some Org", username: "coolname" },
    ]);
    expect(await isSponsorSlugTaken(env, "coolname")).toBe(true);
    expect(await isSponsorSlugTaken(env, "COOL-NAME")).toBe(true);
  });

  it("allows a genuinely free slug", async () => {
    expect(await isSponsorSlugTaken(makeEnv(PROD), "brandnewsponsor")).toBe(
      false,
    );
  });

  it("does not report a sponsor as colliding with itself", async () => {
    // Re-saving the edit form without changing the username must not 409.
    const env = makeEnv([{ id: "s1", name: "Alephium", username: "alephium" }]);
    expect(await isSponsorSlugTaken(env, "alephium", "s1")).toBe(false);
    expect(await isSponsorSlugTaken(env, "alephium")).toBe(true);
  });

  it("treats an empty normalised slug as not taken", async () => {
    // Callers reject this with a 400 before reaching the collision check;
    // it must not match every row via the empty string.
    expect(await isSponsorSlugTaken(makeEnv(PROD), "---")).toBe(false);
  });

  it("is safe against sponsors with a null username", async () => {
    // Every production row has username=NULL today.
    expect(await isSponsorSlugTaken(makeEnv(PROD), "linxlabs")).toBe(true);
  });
});
