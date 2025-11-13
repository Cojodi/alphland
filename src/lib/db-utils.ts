/**
 * Database utility functions for Cloudflare D1
 * Handles UUID generation, timestamps, and data serialization
 */
import { randomUUID } from "crypto";

/**
 * Generate a new UUID for database records
 * Uses Node.js built-in crypto.randomUUID()
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Get current timestamp in milliseconds (for D1 INTEGER fields)
 */
export function now(): number {
  return Date.now();
}

/**
 * Convert timestamp to Date object
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}

/**
 * Convert Date to timestamp
 */
export function dateToTimestamp(date: Date): number {
  return date.getTime();
}

/**
 * Convert boolean to SQLite integer (0 or 1)
 */
export function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Convert SQLite integer to boolean
 */
export function intToBool(value: number): boolean {
  return value === 1;
}

/**
 * Serialize array to JSON string for storage
 */
export function serializeArray<T>(arr: T[]): string {
  return JSON.stringify(arr);
}

/**
 * Deserialize JSON string to array
 */
export function deserializeArray<T>(json: string | null): T[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/**
 * Serialize object to JSON string for storage
 */
export function serializeObject<T extends object>(obj: T): string {
  return JSON.stringify(obj);
}

/**
 * Deserialize JSON string to object
 */
export function deserializeObject<T extends object>(
  json: string | null,
  defaultValue: T
): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Type-safe wrapper for common database operations
 */
export const db = {
  /**
   * Generate new ID
   */
  id: generateId,

  /**
   * Get current timestamp
   */
  now,

  /**
   * Boolean helpers
   */
  bool: {
    toInt: boolToInt,
    fromInt: intToBool,
  },

  /**
   * Timestamp helpers
   */
  timestamp: {
    toDate: timestampToDate,
    fromDate: dateToTimestamp,
  },

  /**
   * JSON helpers
   */
  json: {
    array: {
      serialize: serializeArray,
      deserialize: deserializeArray,
    },
    object: {
      serialize: serializeObject,
      deserialize: deserializeObject,
    },
  },
};

/**
 * Example usage types
 */
export interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  frontend_skills: string[]; // Will be JSON in DB
  created_at: number;
  updated_at: number;
}

export interface DbUserProfile {
  id: string;
  user_id: string;
  username: string | null;
  frontend_skills: string; // JSON string in DB
  created_at: number;
  updated_at: number;
}

/**
 * Convert DB row to application model
 */
export function dbToUserProfile(row: DbUserProfile): UserProfile {
  return {
    ...row,
    frontend_skills: db.json.array.deserialize(row.frontend_skills),
  };
}

/**
 * Convert application model to DB row
 */
export function userProfileToDb(
  profile: Partial<UserProfile>
): Partial<DbUserProfile> {
  return {
    ...profile,
    frontend_skills: profile.frontend_skills
      ? db.json.array.serialize(profile.frontend_skills)
      : undefined,
  };
}
