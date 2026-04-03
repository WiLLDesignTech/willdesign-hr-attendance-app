import type { Holiday } from "@hr-attendance-app/types";
import { Regions, KeyPatterns } from "@hr-attendance-app/types";

const SUNDAY = 0;

/**
 * Vernal equinox day for years 1980-2099.
 * Formula from Japan National Astronomical Observatory.
 */
function vernalEquinoxDay(year: number): number {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

/**
 * Autumnal equinox day for years 1980-2099.
 * Formula from Japan National Astronomical Observatory.
 */
function autumnalEquinoxDay(year: number): number {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

/** Nth weekday of a month (e.g., 2nd Monday of January) */
function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  const first = new Date(year, month, 1).getDay();
  const offset = (weekday - first + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function makeHoliday(year: number, month: number, day: number, name: string, nameJa: string, isSubstitute = false): Holiday {
  const date = formatDate(year, month, day);
  return {
    id: KeyPatterns.holiday(Regions.JP, date),
    date,
    name,
    nameJa,
    region: Regions.JP,
    year,
    isSubstitute,
  };
}

/**
 * Generate all Japanese national holidays for a given year.
 * Supports years 1980-2099 (equinox formula range).
 * Applies: substitute holiday rule (振替休日) and sandwiched day rule (国民の休日).
 */
export function generateJpHolidays(year: number): readonly Holiday[] {
  if (year < 1980 || year > 2099) {
    throw new Error(`JP holiday generation only supports years 1980-2099, got ${year}`);
  }

  const MONDAY = 1;
  const holidays: Holiday[] = [];

  // ─── Fixed-date holidays ───
  holidays.push(makeHoliday(year, 0, 1, "New Year's Day", "元日"));
  holidays.push(makeHoliday(year, 1, 11, "National Foundation Day", "建国記念の日"));
  holidays.push(makeHoliday(year, 1, 23, "Emperor's Birthday", "天皇誕生日"));
  holidays.push(makeHoliday(year, 3, 29, "Showa Day", "昭和の日"));
  holidays.push(makeHoliday(year, 4, 3, "Constitution Memorial Day", "憲法記念日"));
  holidays.push(makeHoliday(year, 4, 4, "Greenery Day", "みどりの日"));
  holidays.push(makeHoliday(year, 4, 5, "Children's Day", "こどもの日"));
  holidays.push(makeHoliday(year, 7, 11, "Mountain Day", "山の日"));
  holidays.push(makeHoliday(year, 10, 3, "Culture Day", "文化の日"));
  holidays.push(makeHoliday(year, 10, 23, "Labor Thanksgiving Day", "勤労感謝の日"));

  // ─── Equinox holidays ───
  const vernalDay = vernalEquinoxDay(year);
  holidays.push(makeHoliday(year, 2, vernalDay, "Vernal Equinox Day", "春分の日"));

  const autumnalDay = autumnalEquinoxDay(year);
  holidays.push(makeHoliday(year, 8, autumnalDay, "Autumnal Equinox Day", "秋分の日"));

  // ─── Happy Monday holidays ───
  const comingOfAge = nthWeekday(year, 0, MONDAY, 2);
  holidays.push(makeHoliday(year, 0, comingOfAge, "Coming of Age Day", "成人の日"));

  const marineDay = nthWeekday(year, 6, MONDAY, 3);
  holidays.push(makeHoliday(year, 6, marineDay, "Marine Day", "海の日"));

  const respectAged = nthWeekday(year, 8, MONDAY, 3);
  holidays.push(makeHoliday(year, 8, respectAged, "Respect for the Aged Day", "敬老の日"));

  const sportsDay = nthWeekday(year, 9, MONDAY, 2);
  holidays.push(makeHoliday(year, 9, sportsDay, "Sports Day", "スポーツの日"));

  // ─── Sandwiched day rule (国民の休日) ───
  // If a day is between two holidays (not already a holiday), it becomes a holiday.
  // The main case: day between Respect for the Aged Day and Autumnal Equinox Day.
  if (autumnalDay - respectAged === 2) {
    holidays.push(makeHoliday(year, 8, respectAged + 1, "Citizens' Holiday", "国民の休日"));
  }

  // ─── Substitute holiday rule (振替休日) ───
  // If a holiday falls on Sunday, the next non-holiday weekday is a substitute.
  const holidayDates = new Set(holidays.map(h => h.date));

  for (const h of [...holidays]) {
    const d = new Date(h.date);
    if (d.getDay() === SUNDAY) {
      const subDate = new Date(d);
      do {
        subDate.setDate(subDate.getDate() + 1);
      } while (holidayDates.has(formatDate(subDate.getFullYear(), subDate.getMonth(), subDate.getDate())));

      const subFormatted = formatDate(subDate.getFullYear(), subDate.getMonth(), subDate.getDate());
      holidayDates.add(subFormatted);
      holidays.push(makeHoliday(
        subDate.getFullYear(), subDate.getMonth(), subDate.getDate(),
        "Substitute Holiday", "振替休日", true,
      ));
    }
  }

  holidays.sort((a, b) => a.date.localeCompare(b.date));
  return holidays;
}
