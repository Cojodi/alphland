import { describe, expect, it } from "vitest";
import {
  isValidUrl,
  isValidWalletAddress,
  normalizeUrl,
  sponsorSlug,
  submissionTitle,
  validateSubmissionForm,
} from "@/features/bounty/utils/validators";

describe("sponsorSlug", () => {
  it("lowercases and strips non-alphanumeric characters", () => {
    expect(sponsorSlug("Linx Labs")).toBe("linxlabs");
    expect(sponsorSlug("BabyPoolTool")).toBe("babypooltool");
    expect(sponsorSlug("Aleph-ium 2.0!")).toBe("alephium20");
  });
});

describe("isValidUrl", () => {
  it("accepts valid URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000/path?q=1")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("ftp://")).toBe(false);
  });

  it("rejects dangerous URL schemes that could execute as script", () => {
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isValidUrl("vbscript:msgbox(1)")).toBe(false);
  });
});

describe("normalizeUrl", () => {
  it("passes through URLs that already have a protocol", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("prepends https:// when protocol is missing", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
    expect(normalizeUrl("www.example.com")).toBe("https://www.example.com");
  });

  it("returns empty string unchanged", () => {
    expect(normalizeUrl("")).toBe("");
    expect(normalizeUrl("   ")).toBe("");
  });
});

describe("isValidWalletAddress", () => {
  it("accepts a valid Ethereum-style address", () => {
    expect(
      isValidWalletAddress("0xAbCdEf1234567890AbCdEf1234567890AbCdEf12"),
    ).toBe(true);
  });

  it("rejects empty or whitespace addresses", () => {
    expect(isValidWalletAddress("")).toBe(false);
    expect(isValidWalletAddress("   ")).toBe(false);
  });

  it("rejects addresses with wrong length", () => {
    expect(isValidWalletAddress("0x123")).toBe(false);
  });

  it("rejects addresses without 0x prefix", () => {
    expect(
      isValidWalletAddress("AbCdEf1234567890AbCdEf1234567890AbCdEf12"),
    ).toBe(false);
  });
});

describe("validateSubmissionForm", () => {
  const validForm = {
    title: "My Submission",
    description: "A detailed description",
    submission_url: "https://github.com/example/repo",
  };

  it("accepts a valid form", () => {
    const result = validateSubmissionForm(validForm);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("requires title", () => {
    const result = validateSubmissionForm({ ...validForm, title: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Title is required");
  });

  it("requires description", () => {
    const result = validateSubmissionForm({ ...validForm, description: "  " });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Description is required");
  });

  it("requires a valid submission URL", () => {
    const result = validateSubmissionForm({
      ...validForm,
      submission_url: "not-a-url",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Valid submission URL is required");
  });

  it("rejects an invalid optional tweet URL", () => {
    const result = validateSubmissionForm({
      ...validForm,
      tweet_url: "bad-url",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Tweet URL must be a valid URL");
  });

  it("accepts a valid optional tweet URL", () => {
    const result = validateSubmissionForm({
      ...validForm,
      tweet_url: "https://x.com/user/status/123",
    });
    expect(result.valid).toBe(true);
  });

  it("can accumulate multiple errors", () => {
    const result = validateSubmissionForm({
      title: "",
      description: "",
      submission_url: "bad",
    });
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("submissionTitle", () => {
  it("reads the bolded title SubmissionModal writes", () => {
    // Real shapes from production.
    expect(
      submissionTitle("**ALPH 2048 Arena**\n\nI made a video walkthrough."),
    ).toBe("ALPH 2048 Arena");
    expect(
      submissionTitle(
        "**Farm Linx Points from Ethereum (Aave → Bridge → Linx)**\n\nThread.",
      ),
    ).toBe("Farm Linx Points from Ethereum (Aave → Bridge → Linx)");
  });

  it("handles a title with no body after it", () => {
    expect(submissionTitle("**ETH Farmers Are Missing This**")).toBe(
      "ETH Farmers Are Missing This",
    );
  });

  it("falls back to the first line for submissions with no bold wrapper", () => {
    // Predates the modal adding the wrapper — a placeholder would lose real
    // information that is sitting right there.
    expect(submissionTitle("just a plain description\nsecond line")).toBe(
      "just a plain description",
    );
  });

  it("truncates a long first line", () => {
    const long = "x".repeat(80);
    const out = submissionTitle(long);
    expect(out).toHaveLength(53); // 50 + "..."
    expect(out.endsWith("...")).toBe(true);
  });

  it("does not truncate a bolded title", () => {
    // The author chose it deliberately; only the guessed fallback is clipped.
    const title = "A".repeat(80);
    expect(submissionTitle(`**${title}**`)).toBe(title);
  });

  it("uses the placeholder only when there is nothing to read", () => {
    for (const empty of [null, undefined, "", "   ", "\n\n"]) {
      expect(submissionTitle(empty)).toBe("Submission");
    }
  });

  it("accepts a caller-supplied fallback", () => {
    expect(submissionTitle(null, "Untitled")).toBe("Untitled");
  });

  it("ignores bold that is not at the start", () => {
    expect(submissionTitle("intro text **not the title**")).toBe(
      "intro text **not the title**",
    );
  });
});
