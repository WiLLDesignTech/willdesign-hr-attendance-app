import type { Holiday, Region } from "@hr-attendance-app/types";
import { yearFromDate } from "@hr-attendance-app/types";
import type { HolidayRepository } from "../repositories/holiday.js";
import { generateJpHolidays } from "./jp-generator.js";

export interface HolidayServiceDeps {
  readonly holidayRepo: HolidayRepository;
}

export interface SeedResult {
  readonly seededCount: number;
}

export class HolidayService {
  private readonly deps: HolidayServiceDeps;

  constructor(deps: HolidayServiceDeps) {
    this.deps = deps;
  }

  async seedJpHolidays(year: number): Promise<SeedResult> {
    const holidays = generateJpHolidays(year);
    await Promise.all(holidays.map(h => this.deps.holidayRepo.save(h)));
    return { seededCount: holidays.length };
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
    const startYear = yearFromDate(startDate);
    const endYear = yearFromDate(endDate);

    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    const results = await Promise.all(
      years.map(y => this.deps.holidayRepo.findByRegionAndYear(region, y)),
    );
    const allHolidays = results.flat();

    return allHolidays.filter(h => h.date >= startDate && h.date <= endDate).length;
  }
}
