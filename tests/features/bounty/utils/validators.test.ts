import { describe, expect, it } from "vitest";
import {
  isValidUrl,
  isValidWalletAddress,
  normalizeUrl,
  sponsorSlug,
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
