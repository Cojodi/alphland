// Validation utilities for bounty forms

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
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
