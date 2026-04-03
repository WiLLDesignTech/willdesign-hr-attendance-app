import type { Holiday, Region } from "@willdesign-hr/types";
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
