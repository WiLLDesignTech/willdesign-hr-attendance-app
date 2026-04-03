import type { SalaryRecord, SalaryType, AllowanceItem, PayrollBreakdown, BlendingDetails, Currency } from "@hr-attendance-app/types";
import { SalaryTypes, Currencies, HOURS } from "@hr-attendance-app/types";

/**
 * Get the effective salary for a given month from history.
 * Returns the most recent entry effective on or before the last day of the target month.
 */
export function getEffectiveSalary(
  history: readonly SalaryRecord[],
  yearMonth: string,
): SalaryRecord | null {
  const targetEnd = getLastDayOfMonth(yearMonth);
  const sorted = [...history]
    .filter((s) => s.effectiveFrom <= targetEnd)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return sorted[0] ?? null;
}

/**
 * Calculate blended salary when multiple entries fall within the same month.
 */
export function calculateBlendedSalary(
  history: readonly SalaryRecord[],
  yearMonth: string,
): { blendedAmount: number; details: BlendingDetails | null } {
  const targetEnd = getLastDayOfMonth(yearMonth);
  const targetStart = `${yearMonth}-01`;
  const totalDays = getDaysInMonth(yearMonth);

  const applicable = [...history]
    .filter((s) => s.effectiveFrom <= targetEnd)
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));

  if (applicable.length === 0) return { blendedAmount: 0, details: null };

  // Find entries effective within this month
  const withinMonth = applicable.filter((s) => s.effectiveFrom >= targetStart && s.effectiveFrom <= targetEnd);

  if (withinMonth.length <= 1) {
    const effective = getEffectiveSalary(history, yearMonth);
    return { blendedAmount: effective ? toMonthlySalary(effective.amount, effective.salaryType) : 0, details: null };
  }

  // Multi-segment blend: each entry covers from its effective date to the next entry (or month end)
  let blendedAmount = 0;
  for (let i = 0; i < withinMonth.length; i++) {
    const entry = withinMonth[i]!;
    const startDay = parseInt(entry.effectiveFrom.split("-")[2]!, 10);
    const endDay = i + 1 < withinMonth.length
      ? parseInt(withinMonth[i + 1]!.effectiveFrom.split("-")[2]!, 10) - 1
      : totalDays;
    const days = endDay - startDay + 1;
    blendedAmount += (toMonthlySalary(entry.amount, entry.salaryType) * days) / totalDays;
  }

  // Return details for the most recent transition (last two entries)
  const older = withinMonth[withinMonth.length - 2]!;
  const newer = withinMonth[withinMonth.length - 1]!;
  const newerDay = parseInt(newer.effectiveFrom.split("-")[2]!, 10);

  return {
    blendedAmount,
    details: {
      oldSalary: toMonthlySalary(older.amount, older.salaryType),
      newSalary: toMonthlySalary(newer.amount, newer.salaryType),
      oldDays: newerDay - 1,
      newDays: totalDays - (newerDay - 1),
      totalDays,
    },
  };
}

/**
 * Convert any salary type to monthly equivalent.
 */
export function toMonthlySalary(amount: number, salaryType: SalaryType): number {
  switch (salaryType) {
    case SalaryTypes.MONTHLY:
      return amount;
    case SalaryTypes.ANNUAL:
      return amount / 12;
    case SalaryTypes.HOURLY:
      return amount * HOURS.MONTHLY_FULL_TIME;
    default:
      return amount;
  }
}

/**
 * Calculate pro-rata salary for partial months.
 */
export function calculateProRata(salary: number, daysWorked: number, totalDays: number): number {
  return (salary * daysWorked) / totalDays;
}

/**
 * Calculate deficit deduction (NP team). Rounds UP (ceiling) to nearest whole unit.
 */
export function calculateDeficitDeduction(
  monthlySalary: number,
  monthlyHours: number,
  deficitHours: number,
): number {
  if (deficitHours <= 0) return 0;
  const hourlyRate = monthlySalary / monthlyHours;
  return Math.ceil(hourlyRate * deficitHours);
}

export interface PayrollInput {
  readonly employeeId: string;
  readonly yearMonth: string;
  readonly baseSalary: number;
  readonly currency: Currency;
  readonly overtimeHours: number;
  readonly overtimeRate: number;
  readonly hourlyRateForOvertime: number;
  readonly allowances: readonly AllowanceItem[];
  readonly bonus: number;
  readonly commission: number;
  readonly deficitHours: number;
  readonly monthlyHourlyRate: number;
  readonly proRataDays: number | null;
  readonly totalDays: number;
  readonly exchangeRate: number | null;
  readonly exchangeRateDate: string | null;
  readonly transferFees: number;
  /** Home/reporting currency for equivalent calculation. Defaults to JPY for backward compat. */
  readonly homeCurrency?: string;
}

/**
 * Build transparent monthly payroll breakdown.
 */
export function calculatePayrollBreakdown(input: PayrollInput): PayrollBreakdown {
  const overtimePay = input.overtimeHours * input.hourlyRateForOvertime * input.overtimeRate;
  const allowanceTotal = input.allowances.reduce((sum, a) => sum + a.amount, 0);
  // monthlyHourlyRate is the pre-computed hourly rate (salary / contractual hours)
  const deficitDeduction = input.deficitHours > 0 && input.monthlyHourlyRate > 0
    ? Math.ceil(input.monthlyHourlyRate * input.deficitHours)
    : 0;

  let proRataAdjustment = 0;
  let effectiveBase = input.baseSalary;
  if (input.proRataDays !== null) {
    const proRataAmount = calculateProRata(input.baseSalary, input.proRataDays, input.totalDays);
    proRataAdjustment = input.baseSalary - proRataAmount;
    effectiveBase = proRataAmount;
  }

  const gross = effectiveBase + overtimePay + allowanceTotal + input.bonus + input.commission;
  const netAmount = gross - deficitDeduction - input.transferFees;

  const homeCurrency = input.homeCurrency ?? Currencies.JPY;
  let homeCurrencyEquivalent: number | null = null;
  if (input.currency !== homeCurrency && input.exchangeRate) {
    homeCurrencyEquivalent = Math.round((gross - deficitDeduction) * input.exchangeRate);
  }

  return {
    employeeId: input.employeeId,
    yearMonth: input.yearMonth,
    baseSalary: input.baseSalary,
    proRataAdjustment,
    overtimePay,
    allowances: [...input.allowances],
    bonus: input.bonus,
    commission: input.commission,
    deficitDeduction,
    blendingDetails: null,
    transferFees: input.transferFees,
    netAmount,
    currency: input.currency,
    homeCurrencyEquivalent,
    exchangeRate: input.exchangeRate,
    exchangeRateDate: input.exchangeRateDate,
  };
}

function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number) as [number, number];
  return new Date(year, month, 0).getDate();
}

function getLastDayOfMonth(yearMonth: string): string {
  return `${yearMonth}-${String(getDaysInMonth(yearMonth)).padStart(2, "0")}`;
}
