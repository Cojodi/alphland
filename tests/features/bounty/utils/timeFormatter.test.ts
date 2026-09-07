import { describe, expect, it } from "vitest";
import {
  calculateTimeRemaining,
  formatDate,
  formatDateTime,
} from "@/features/bounty/utils/timeFormatter";

describe("calculateTimeRemaining", () => {
  it('returns "Expired" for a past date', () => {
    expect(calculateTimeRemaining("2000-01-01T00:00:00Z")).toBe("Expired");
  });

  it("returns days and hours for dates more than 24h away", () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = calculateTimeRemaining(future);
    expect(result).toMatch(/^\d+d \d+h remaining$/);
  });

  it("returns hours and minutes for dates less than 24h away", () => {
    const future = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    const result = calculateTimeRemaining(future);
    expect(result).toMatch(/^\d+h \d+m remaining$/);
  });

  it("returns minutes only for dates less than 1h away", () => {
    const future = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const result = calculateTimeRemaining(future);
    expect(result).toMatch(/^\d+m remaining$/);
  });
});

describe("formatDate", () => {
  it("returns a human-readable date string", () => {
    const result = formatDate("2024-06-15T00:00:00Z");
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
  });

  it("does not include time", () => {
    const result = formatDate("2024-06-15T12:30:00Z");
    expect(result).not.toMatch(/\d+:\d+/);
  });
});

describe("formatDateTime", () => {
  it("returns a string with both date and time", () => {
    const result = formatDateTime("2024-06-15T14:30:00Z");
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/\d+:\d+/);
  });
});
