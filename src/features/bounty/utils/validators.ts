// Validation utilities for bounty forms

/** Generate a URL-friendly slug from a sponsor's organization name.
 *  "Linx Labs" → "linxlabs", "BabyPoolTool" → "babypooltool"
 *  The worker resolves these by normalizing the sponsors.name column the same way.
 */
export function sponsorSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Longest slug we will generate, before any uniqueness suffix. */
export const BOUNTY_SLUG_MAX = 60;

/**
 * Generate a URL-friendly slug from a bounty title.
 *
 *   "Create a YouTube Tutorial: How to Use Linx App"
 *     -> "create-a-youtube-tutorial-how-to-use-linx-app"
 *
 * Deliberately NOT sponsorSlug(). That one deletes every non-alphanumeric
 * character, which suits a short org name ("Linx Labs" -> "linxlabs") but
 * turns a sentence into "createayoutubetutorialhowtouselinxapp" — unreadable,
 * and worthless for the search ranking that is the only reason to have slugs
 * on bounties at all. Words are joined with hyphens instead.
 *
 * Truncation cuts on a word boundary so the tail is not a fragment, and the
 * result can be empty (a title of only punctuation or non-Latin script), which
 * callers must handle by falling back to the id rather than storing "".
 */
export function bountySlug(title: string): string {
  const base = (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base.length <= BOUNTY_SLUG_MAX) return base;

  const cut = base.slice(0, BOUNTY_SLUG_MAX);
  const lastHyphen = cut.lastIndexOf("-");
  // Only honour the word boundary if it leaves a usable slug; a title whose
  // first word is longer than the cap would otherwise slice to nothing.
  return (lastHyphen > 20 ? cut.slice(0, lastHyphen) : cut).replace(/-+$/, "");
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only http(s) links are safe to store and render as a clickable <a href>.
    // Rejects javascript:, data:, vbscript:, etc.
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL by adding https:// prefix if missing.
 * Accepts formats: https://example.com, http://example.com, www.example.com, example.com
 * Returns the URL with proper protocol prefix.
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // Already has http:// or https://
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Add https:// prefix
  return `https://${trimmed}`;
}

export function isValidWalletAddress(address: string): boolean {
  // Basic validation - adjust based on your blockchain
  // This is a generic check for non-empty alphanumeric strings
  if (!address || address.trim() === "") {
    return false;
  }

  // Example: Ethereum-like address validation (0x + 40 hex chars)
  // Adjust this regex based on your actual wallet address format
  const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressPattern.test(address.trim());
}

export function validateSubmissionForm(data: {
  title: string;
  description: string;
  submission_url: string;
  tweet_url?: string;
  wallet_address?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.trim() === "") {
    errors.push("Title is required");
  }

  if (!data.description || data.description.trim() === "") {
    errors.push("Description is required");
  }

  if (!data.submission_url || !isValidUrl(data.submission_url)) {
    errors.push("Valid submission URL is required");
  }

  if (data.tweet_url && !isValidUrl(data.tweet_url)) {
    errors.push("Tweet URL must be a valid URL");
  }

  if (data.wallet_address && !isValidWalletAddress(data.wallet_address)) {
    errors.push("Invalid wallet address format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * The submission's title, read out of its description.
 *
 * There is no `title` column: SubmissionModal writes the title into the
 * description as `**Title**\n\nbody`. The sponsor dashboard used to read a
 * `title` field that no endpoint sends, so every submission there displayed
 * the literal word "Submission".
 *
 * Falls back to the first line for submissions written before the modal
 * added the bold wrapper, and only then to a placeholder.
 */
export function submissionTitle(
  description: string | null | undefined,
  fallback = "Submission",
): string {
  if (!description) return fallback;

  const bold = description.match(/^\s*\*\*(.+?)\*\*/);
  if (bold?.[1]?.trim()) return bold[1].trim();

  const firstLine = description.split("\n")[0]?.trim();
  if (!firstLine) return fallback;
  return firstLine.length > 50 ? `${firstLine.substring(0, 50)}...` : firstLine;
}
