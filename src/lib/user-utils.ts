/**
 * User-related utility functions
 * Centralized logic for username display and generation
 */

export interface UserDisplayInfo {
  username: string | null;
  name: string | null;
  user_id: string;
  is_default_username?: number;
}

/**
 * Get the display name for a user with consistent fallback logic
 * Priority: username -> Google name -> truncated user_id
 */
export function getDisplayUsername(user: UserDisplayInfo): string {
  if (user.username) {
    return user.username;
  }
  if (user.name) {
    return user.name;
  }
  return user.user_id.slice(0, 8);
}

/**
 * Check if a user needs to be prompted to set a custom username
 * Returns true if they have a system-generated username or no username at all
 */
export function shouldPromptForUsername(user: UserDisplayInfo): boolean {
  // No username at all - definitely prompt
  if (!user.username) return true;
  // Has username but it's system-generated
  if (user.is_default_username === 1) return true;
  return false;
}

/**
 * Check if a user is using a fallback display name (not a custom username)
 */
export function isUsingFallbackUsername(user: UserDisplayInfo): boolean {
  return !user.username || user.is_default_username === 1;
}

/**
 * Generate a default username from an email address
 * Format: {email_prefix}_{random4chars}
 * Example: john.doe@gmail.com -> johndoe_x8k2
 */
export function generateDefaultUsername(email: string): string {
  const emailPrefix = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .slice(0, 20);

  const randomSuffix = Array.from(
    { length: 4 },
    () =>
      "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)],
  ).join("");

  return `${emailPrefix}_${randomSuffix}`;
}
