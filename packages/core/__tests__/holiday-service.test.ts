import { describe, it, expect, vi, beforeEach } from "vitest";
import { HolidayService } from "../src/holidays/service";
import { generateJpHolidays } from "../src/holidays/jp-generator";
import { Regions } from "@willdesign-hr/types";
import type { Holiday } from "@willdesign-hr/types";

describe("HolidayService", () => {
  let service: HolidayService;
  let holidayRepo: ReturnType<typeof createMockHolidayRepo>;

  function createMockHolidayRepo() {
    return {
      findByRegionAndYear: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockImplementation((h: Holiday) => Promise.resolve(h)),
      delete: vi.fn(),
    };
  }

  beforeEach(() => {
    holidayRepo = createMockHolidayRepo();
    service = new HolidayService({ holidayRepo });
  });

  describe("seedJpHolidays", () => {
    it("seeds JP national holidays for a given year", async () => {
      const result = await service.seedJpHolidays(2026);

      expect(holidayRepo.save).toHaveBeenCalled();
      expect(result.seededCount).toBeGreaterThan(0);
    });

    it("works for any supported year (2025-2099)", async () => {
      const result = await service.seedJpHolidays(2030);
      expect(result.seededCount).toBeGreaterThan(0);
    });

    it("generated holidays include substitute holidays", () => {
      const holidays = generateJpHolidays(2026);
      const substitute = holidays.filter(h => h.isSubstitute);
      expect(substitute.length).toBeGreaterThanOrEqual(1);
    });

    it("all generated holidays have JP region", () => {
      const holidays = generateJpHolidays(2026);
      for (const h of holidays) {
        expect(h.region).toBe(Regions.JP);
      }
    });
  });

  describe("CRUD operations", () => {
    it("adds a custom holiday", async () => {
      const holiday: Holiday = {
        id: "HOL#JP#2026-05-03",
        date: "2026-05-03",
        name: "Constitution Memorial Day",
        nameJa: "憲法記念日",
        region: Regions.JP,
        year: 2026,
        isSubstitute: false,
      };

      await service.addHoliday(holiday);

      expect(holidayRepo.save).toHaveBeenCalledWith(holiday);
    });

    it("lists holidays for region and year", async () => {
      holidayRepo.findByRegionAndYear.mockResolvedValue([
        { id: "HOL#JP#2026-01-01", date: "2026-01-01", name: "New Year", region: "JP", year: 2026, isSubstitute: false },
      ]);

      const holidays = await service.getHolidays(Regions.JP, 2026);

      expect(holidays).toHaveLength(1);
    });

    it("deletes a holiday", async () => {
      await service.removeHoliday(Regions.JP, "2026-01-01");

      expect(holidayRepo.delete).toHaveBeenCalledWith(Regions.JP, "2026-01-01");
    });
  });

  describe("countHolidaysInRange", () => {
    it("counts holidays within a date range", async () => {
      holidayRepo.findByRegionAndYear.mockResolvedValue([
        { id: "H1", date: "2026-01-01", name: "NY", region: "JP", year: 2026, isSubstitute: false },
        { id: "H2", date: "2026-01-13", name: "CA", region: "JP", year: 2026, isSubstitute: false },
        { id: "H3", date: "2026-02-11", name: "NF", region: "JP", year: 2026, isSubstitute: false },
      ]);

      const count = await service.countHolidaysInRange(Regions.JP, "2026-01-01", "2026-01-31");

      expect(count).toBe(2);
    });
  });
});
