/**
 * Shared date utilities — used across ALL packages (types, core, data, api, web).
 * Single source of truth for date manipulation. Easy to mock in tests.
 *
 * All functions are pure (no hidden state) except nowIso() and nowMs() which
 * read the system clock. Mock those two to control time in tests.
 */

/** Current time as ISO string (e.g. "2026-04-03T09:00:00.000Z"). */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Current timestamp in milliseconds (replacement for Date.now()). */
export function nowMs(): number {
  return Date.now();
}

/** Current date as YYYY-MM-DD string. */
export function todayDate(): string {
  return isoToDateStr(nowIso());
}

/** Current year as number. */
export function currentYear(): number {
  return new Date().getFullYear();
}

/** Extract date portion (YYYY-MM-DD) from an ISO timestamp or Date. */
export function isoToDateStr(iso: string): string {
  return iso.slice(0, 10);
}

/** Extract YYYY-MM from an ISO timestamp. */
export function isoToYearMonth(iso: string): string {
  return iso.slice(0, 7);
}

/** Get year from a date string (ISO or YYYY-MM-DD). */
export function yearFromDate(dateStr: string): number {
  return new Date(dateStr).getFullYear();
}

/** Get number of days in a given month. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Format year + month as YYYY-MM. */
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Add days to a Date, returning new Date. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Add months to a Date, returning new Date. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/** Add years to a Date, returning new Date. */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/** Convert a Date object to ISO string. */
export function dateToIso(date: Date): string {
  return date.toISOString();
}

/** Convert a Date object to date-only string (YYYY-MM-DD). */
export function dateToDateStr(date: Date): string {
  return isoToDateStr(date.toISOString());
}

/** Convert a Date to YYYY-MM-DD using LOCAL time zone. Use for DayPicker/calendar dates. */
export function dateToLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Generate a unique timestamp-based ID component. */
export function timestampId(): string {
  return String(nowMs());
}
