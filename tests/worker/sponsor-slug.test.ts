import { describe, it, expect } from "vitest";
import { normalizeSponsorSlug, isSponsorSlugTaken } from "@/worker/handlers";

/**
 * D1 stand-in over a fixed sponsors table, answering the single-column
 * `WHERE slug = ? AND id IS NOT ?` lookup the collision check now uses.
 */
function makeEnv(sponsors: { id: string; slug: string | null }[]) {
  const DB = {
    prepare(_sql: string) {
      let args: any[] = [];
      const b = {
        bind(...a: any[]) {
          args = a;
          return b;
        },
        async first() {
          const [slug, exclude] = args;
          const hit = sponsors.find((s) => s.slug === slug && s.id !== exclude);
          return hit ? { id: hit.id } : null;
        },
        async all() {
          return { results: sponsors };
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

/** Slugs as migration 027 backfilled them in production. */
const PROD = [
  { id: "s1", slug: "alephium" },
  { id: "s2", slug: "linxlabs" },
  { id: "s3", slug: "babypooltool" },
];

describe("normalizeSponsorSlug", () => {
  it("matches the client-side sponsorSlug() exactly", () => {
    // validators.ts:7 — name.toLowerCase().replace(/[^a-z0-9]/g, "")
    // Any divergence means a link the UI renders would 404.
    const clientSide = (n: string) => n.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const n of [
      "Alephium",
      "Linx Labs",
      "Very Good Company",
      "ALPH2048",
      "BlockflowDAO",
      "Alph & Co.",
      "über-sponsor",
      "  spaced  out  ",
    ]) {
      expect(normalizeSponsorSlug(n)).toBe(clientSide(n));
    }
  });

  it("collapses the variants the old lookup treated as equal", () => {
    const forms = [
      "Alephium",
      "alephium",
      "ALEPHIUM",
      "aleph-ium",
      "aleph_ium",
    ];
    expect(new Set(forms.map(normalizeSponsorSlug)).size).toBe(1);
  });

  it("returns empty when nothing usable remains", () => {
    expect(normalizeSponsorSlug("---")).toBe("");
    expect(normalizeSponsorSlug("  ")).toBe("");
    expect(normalizeSponsorSlug("")).toBe("");
  });
});

describe("isSponsorSlugTaken", () => {
  it("reports a slug already held by another sponsor", async () => {
    expect(await isSponsorSlugTaken(makeEnv(PROD), "alephium")).toBe(true);
  });

  it("normalises the candidate before comparing", async () => {
    // A rival typing "Aleph-ium" must not slip past a check on the raw string.
    for (const attempt of ["Alephium", "ALEPHIUM", "aleph-ium", "aleph_ium"]) {
      expect(await isSponsorSlugTaken(makeEnv(PROD), attempt)).toBe(true);
    }
  });

  it("allows a genuinely free slug", async () => {
    expect(await isSponsorSlugTaken(makeEnv(PROD), "brandnewsponsor")).toBe(
      false,
    );
  });

  it("does not report a sponsor as colliding with itself", async () => {
    // Re-saving the edit form unchanged must not 409.
    expect(await isSponsorSlugTaken(makeEnv(PROD), "alephium", "s1")).toBe(
      false,
    );
    expect(await isSponsorSlugTaken(makeEnv(PROD), "alephium")).toBe(true);
  });

  it("treats an empty normalised slug as not taken", async () => {
    // Callers reject this with a 400 first; it must not match rows whose slug
    // is NULL by comparing empty-to-empty.
    expect(await isSponsorSlugTaken(makeEnv(PROD), "---")).toBe(false);
  });

  it("ignores sponsors whose slug is still NULL", async () => {
    const env = makeEnv([...PROD, { id: "s9", slug: null }]);
    expect(await isSponsorSlugTaken(env, "anything")).toBe(false);
  });
});
