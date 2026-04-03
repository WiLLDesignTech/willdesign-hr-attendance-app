import type { Holiday, Region } from "@willdesign-hr/types";
import { Regions } from "@willdesign-hr/types";
import type { HolidayRepository } from "../repositories/holiday.js";

export interface HolidayServiceDeps {
  readonly holidayRepo: HolidayRepository;
}

export interface SeedResult {
  readonly seededCount: number;
}

/** Japan national holidays for 2026 */
export const JP_NATIONAL_HOLIDAYS_2026: readonly Holiday[] = [
  { id: "HOL#JP#2026-01-01", date: "2026-01-01", name: "New Year's Day", nameJa: "元日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-01-12", date: "2026-01-12", name: "Coming of Age Day", nameJa: "成人の日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-02-11", date: "2026-02-11", name: "National Foundation Day", nameJa: "建国記念の日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-02-23", date: "2026-02-23", name: "Emperor's Birthday", nameJa: "天皇誕生日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-03-20", date: "2026-03-20", name: "Vernal Equinox Day", nameJa: "春分の日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-04-29", date: "2026-04-29", name: "Showa Day", nameJa: "昭和の日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-05-03", date: "2026-05-03", name: "Constitution Memorial Day", nameJa: "憲法記念日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-05-04", date: "2026-05-04", name: "Greenery Day", nameJa: "みどりの日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-05-05", date: "2026-05-05", name: "Children's Day", nameJa: "こどもの日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-05-06", date: "2026-05-06", name: "Substitute Holiday", nameJa: "振替休日", region: Regions.JP, year: 2026, isSubstitute: true },
  { id: "HOL#JP#2026-07-20", date: "2026-07-20", name: "Marine Day", nameJa: "海の日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-08-11", date: "2026-08-11", name: "Mountain Day", nameJa: "山の日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-09-21", date: "2026-09-21", name: "Respect for the Aged Day", nameJa: "敬老の日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-09-23", date: "2026-09-23", name: "Autumnal Equinox Day", nameJa: "秋分の日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-10-12", date: "2026-10-12", name: "Sports Day", nameJa: "スポーツの日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-11-03", date: "2026-11-03", name: "Culture Day", nameJa: "文化の日", region: Regions.JP, year: 2026, isSubstitute: false },
  { id: "HOL#JP#2026-11-23", date: "2026-11-23", name: "Labor Thanksgiving Day", nameJa: "勤労感謝の日", region: Regions.JP, year: 2026, isSubstitute: false },
] as const;

export class HolidayService {
  private readonly deps: HolidayServiceDeps;

  constructor(deps: HolidayServiceDeps) {
    this.deps = deps;
  }

  async seedJpHolidays(year: number): Promise<SeedResult> {
    const seedMap: Record<number, readonly Holiday[]> = {
      2026: JP_NATIONAL_HOLIDAYS_2026,
    };

    const holidays = seedMap[year];
    if (!holidays) {
      throw new Error(`No JP holiday seed data available for year ${year}. Add seed data or use addHoliday() manually.`);
    }

    let seededCount = 0;
    for (const holiday of holidays) {
      await this.deps.holidayRepo.save(holiday);
      seededCount++;
    }

    return { seededCount };
  }

  async addHoliday(holiday: Holiday): Promise<Holiday> {
    return this.deps.holidayRepo.save(holiday);
  }

  async getHolidays(region: Region, year: number): Promise<readonly Holiday[]> {
    return this.deps.holidayRepo.findByRegionAndYear(region, year);
  }

  async removeHoliday(region: Region, date: string): Promise<void> {
    return this.deps.holidayRepo.delete(region, date);
  }

  async countHolidaysInRange(region: Region, startDate: string, endDate: string): Promise<number> {
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    const start = new Date(startDate);
    const end = new Date(endDate);

    let allHolidays: Holiday[] = [];
    for (let year = startYear; year <= endYear; year++) {
      const yearHolidays = await this.deps.holidayRepo.findByRegionAndYear(region, year);
      allHolidays = allHolidays.concat([...yearHolidays]);
    }

    return allHolidays.filter(h => {
      const d = new Date(h.date);
      return d >= start && d <= end;
    }).length;
  }
}
