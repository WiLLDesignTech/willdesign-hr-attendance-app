import { describe, it, expect } from "vitest";
import { formatDate, formatDateLong, formatTime, formatDateTime, formatYearMonth, formatRelative } from "./date";

describe("date utils", () => {
  describe("formatDate", () => {
    it("formats ISO date to short localized string", () => {
      const result = formatDate("2026-04-03T09:00:00Z");
      expect(result).toContain("2026");
      expect(result).toContain("3");
    });
  });

  describe("formatDateLong", () => {
    it("formats ISO date with full month name", () => {
      const result = formatDateLong("2026-04-03T09:00:00Z");
      expect(result).toContain("2026");
      expect(result).toMatch(/April|4月/);
    });
  });

  describe("formatTime", () => {
    it("formats time portion of ISO string", () => {
      const result = formatTime("2026-04-03T09:30:00Z");
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe("formatDateTime", () => {
    it("formats both date and time", () => {
      const result = formatDateTime("2026-04-03T09:00:00Z");
      expect(result).toContain("2026");
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe("formatYearMonth", () => {
    it("formats year-month string to localized display", () => {
      const result = formatYearMonth("2026-04");
      expect(result).toContain("2026");
      expect(result).toMatch(/April|4月/);
    });
  });

  describe("formatRelative", () => {
    it("returns relative time string", () => {
      const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
      const result = formatRelative(oneHourAgo);
      expect(result).toMatch(/hour|時間/);
    });

    it("handles future dates", () => {
      const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
      const result = formatRelative(tomorrow);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
