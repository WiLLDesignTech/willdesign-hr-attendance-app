import { describe, it, expect } from "vitest";
import { generateJpHolidays } from "../src/holidays/jp-generator";
import { Regions } from "@hr-attendance-app/types";

describe("generateJpHolidays", () => {
  it("generates holidays for 2026", () => {
    const holidays = generateJpHolidays(2026);
    expect(holidays.length).toBeGreaterThanOrEqual(16);
  });

  it("all holidays have JP region", () => {
    const holidays = generateJpHolidays(2026);
    for (const h of holidays) {
      expect(h.region).toBe(Regions.JP);
    }
  });

  it("all holidays have correct year", () => {
    const holidays = generateJpHolidays(2026);
    for (const h of holidays) {
      expect(h.year).toBe(2026);
    }
  });

  it("includes New Year's Day on Jan 1", () => {
    const holidays = generateJpHolidays(2026);
    expect(holidays.find(h => h.date === "2026-01-01")).toBeDefined();
  });

  it("includes Coming of Age Day on 2nd Monday of January", () => {
    const holidays = generateJpHolidays(2026);
    const coa = holidays.find(h => h.nameJa === "成人の日");
    expect(coa).toBeDefined();
    const d = new Date(coa!.date);
    expect(d.getDay()).toBe(1); // Monday
  });

  it("calculates Vernal Equinox Day correctly for 2026", () => {
    const holidays = generateJpHolidays(2026);
    const vernal = holidays.find(h => h.nameJa === "春分の日");
    expect(vernal).toBeDefined();
    expect(vernal!.date).toBe("2026-03-20");
  });

  it("calculates Autumnal Equinox Day correctly for 2026", () => {
    const holidays = generateJpHolidays(2026);
    const autumnal = holidays.find(h => h.nameJa === "秋分の日");
    expect(autumnal).toBeDefined();
    expect(autumnal!.date).toBe("2026-09-23");
  });

  it("applies substitute holiday rule when holiday falls on Sunday", () => {
    const holidays = generateJpHolidays(2026);
    const substitutes = holidays.filter(h => h.isSubstitute);
    // May 3 2026 is Sunday → May 6 is substitute (after May 4, 5 which are holidays)
    const may6 = substitutes.find(h => h.date === "2026-05-06");
    expect(may6).toBeDefined();
    expect(may6!.nameJa).toBe("振替休日");
  });

  it("generates holidays for different years", () => {
    const h2025 = generateJpHolidays(2025);
    const h2027 = generateJpHolidays(2027);
    const h2030 = generateJpHolidays(2030);

    expect(h2025.length).toBeGreaterThanOrEqual(15);
    expect(h2027.length).toBeGreaterThanOrEqual(15);
    expect(h2030.length).toBeGreaterThanOrEqual(15);

    // Equinox dates should differ between years
    const v2025 = h2025.find(h => h.nameJa === "春分の日")!.date;
    const v2027 = h2027.find(h => h.nameJa === "春分の日")!.date;
    expect(v2025).not.toBe(v2027); // Different years = potentially different dates
  });

  it("holidays are sorted by date", () => {
    const holidays = generateJpHolidays(2026);
    for (let i = 1; i < holidays.length; i++) {
      expect(holidays[i].date >= holidays[i - 1].date).toBe(true);
    }
  });

  it("throws for unsupported year range", () => {
    expect(() => generateJpHolidays(1979)).toThrow();
    expect(() => generateJpHolidays(2100)).toThrow();
  });

  it("generates sandwiched Citizens Holiday when applicable", () => {
    // In years where Respect for Aged Day and Autumnal Equinox are 2 days apart
    // the day between becomes Citizens' Holiday (国民の休日)
    // This happens in 2032: Aged=Sep 20 (Mon), Equinox=Sep 22 → Sep 21 = Citizens' Holiday
    const holidays = generateJpHolidays(2032);
    const citizens = holidays.find(h => h.nameJa === "国民の休日");
    expect(citizens).toBeDefined();
  });

  it("Marine Day is 3rd Monday of July", () => {
    const holidays = generateJpHolidays(2026);
    const marine = holidays.find(h => h.nameJa === "海の日");
    expect(marine).toBeDefined();
    const d = new Date(marine!.date);
    expect(d.getDay()).toBe(1); // Monday
    expect(d.getMonth()).toBe(6); // July
  });
});
