import { describe, it, expect } from "vitest";
import {
  bountySlug,
  sponsorSlug,
  BOUNTY_SLUG_MAX,
} from "@/features/bounty/utils/validators";

describe("bountySlug", () => {
  it("hyphenates words instead of deleting the gaps", () => {
    // The whole point: sponsorSlug would give "createayoutubetutorial...".
    expect(bountySlug("Create a YouTube Tutorial: How to Use Linx App")).toBe(
      "create-a-youtube-tutorial-how-to-use-linx-app",
    );
    expect(sponsorSlug("Create a YouTube Tutorial")).toBe(
      "createayoutubetutorial",
    );
  });

  it("collapses runs of punctuation into a single hyphen", () => {
    expect(bountySlug("Test  Bounty #1")).toBe("test-bounty-1");
    expect(bountySlug("A -- B")).toBe("a-b");
  });

  it("trims leading and trailing separators", () => {
    expect(bountySlug("  !!! Hello World !!!  ")).toBe("hello-world");
  });

  it("caps the length and cuts on a word boundary", () => {
    const slug = bountySlug(
      "Create an X Thread: How to Farm Linx Points as an Ethereum User",
    );
    expect(slug.length).toBeLessThanOrEqual(BOUNTY_SLUG_MAX);
    // Cut at a boundary, so no dangling fragment and no trailing hyphen.
    expect(slug).toBe(
      "create-an-x-thread-how-to-farm-linx-points-as-an-ethereum",
    );
    expect(slug.endsWith("-")).toBe(false);
  });

  it("still truncates when the first word is longer than the cap", () => {
    const slug = bountySlug("a".repeat(100));
    expect(slug.length).toBe(BOUNTY_SLUG_MAX);
  });

  it("returns empty for a title with nothing sluggable, rather than junk", () => {
    // Callers must store NULL and fall back to id routing for these.
    expect(bountySlug("!!!")).toBe("");
    expect(bountySlug("赏金任务")).toBe("");
    expect(bountySlug("")).toBe("");
  });

  it("is stable — the same title always yields the same slug", () => {
    const t = "Video showcasing ALPH 2048 Arena";
    expect(bountySlug(t)).toBe(bountySlug(t));
    expect(bountySlug(t)).toBe("video-showcasing-alph-2048-arena");
  });
});
