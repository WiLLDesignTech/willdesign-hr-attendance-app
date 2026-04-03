import type { OvertimeRates } from "@hr-attendance-app/types";
import { JP_LABOR } from "@hr-attendance-app/types";

/**
 * Calculate overtime hours as difference from threshold.
 */
export function calculateOvertimeHours(workedHours: number, threshold: number): number {
  return Math.max(0, workedHours - threshold);
}

export interface OvertimePayInput {
  readonly regularHours: number;
  readonly lateNightHours: number;
  readonly holidayHours: number;
  readonly hourlyRate: number;
  readonly rates: OvertimeRates;
  readonly monthlyOvertimeTotal: number;
}

export interface OvertimePayResult {
  readonly standardPay: number;
  readonly lateNightPay: number;
  readonly holidayPay: number;
  readonly excess60hPay: number;
  readonly totalPay: number;
}

/**
 * Calculate overtime pay by category per JP labor law rates.
 */
export function calculateOvertimePay(input: OvertimePayInput): OvertimePayResult {
  const standardPay = input.regularHours * input.hourlyRate * input.rates.standard;
  const lateNightPay = input.lateNightHours * input.hourlyRate * (input.rates.standard + input.rates.lateNight);
  const holidayPay = input.holidayHours * input.hourlyRate * input.rates.holiday;

  // Hours exceeding 60h/month get the excess rate
  const excess60hHours = Math.max(0, input.monthlyOvertimeTotal - JP_LABOR.EXCESS_OVERTIME_THRESHOLD);
  const excess60hPay = excess60hHours * input.hourlyRate * input.rates.excess60h;

  return {
    standardPay,
    lateNightPay,
    holidayPay,
    excess60hPay,
    totalPay: standardPay + lateNightPay + holidayPay + excess60hPay,
  };
}

export interface DeemedOvertimeResult {
  readonly exceeded: boolean;
  readonly excessHours: number;
}

/**
 * Check if actual overtime exceeds the deemed (minashi) threshold.
 */
export function checkDeemedOvertimeThreshold(
  actualHours: number,
  deemedHours: number,
): DeemedOvertimeResult {
  const excess = actualHours - deemedHours;
  return {
    exceeded: excess > 0,
    excessHours: Math.max(0, excess),
  };
}

export interface AgreementLimitsInput {
  readonly monthlyHours: number;
  readonly yearlyHours: number;
  readonly monthlyLimit: number;
  readonly yearlyLimit: number;
}

export interface AgreementLimitsResult {
  readonly monthlyWarning: boolean;
  readonly monthlyExceeded: boolean;
  readonly yearlyWarning: boolean;
  readonly yearlyExceeded: boolean;
  readonly monthlyUtilization: number;
  readonly yearlyUtilization: number;
}

/**
 * Check 36 Agreement limits and generate warnings.
 * Warning triggers at 85% utilization.
 */
export function check36AgreementLimits(input: AgreementLimitsInput): AgreementLimitsResult {
  const monthlyUtil = input.monthlyLimit > 0 ? input.monthlyHours / input.monthlyLimit : 0;
  const yearlyUtil = input.yearlyLimit > 0 ? input.yearlyHours / input.yearlyLimit : 0;

  return {
    monthlyWarning: monthlyUtil >= JP_LABOR.OVERTIME_WARNING_UTILIZATION && monthlyUtil < 1,
    monthlyExceeded: input.monthlyHours >= input.monthlyLimit,
    yearlyWarning: yearlyUtil >= JP_LABOR.OVERTIME_WARNING_UTILIZATION && yearlyUtil < 1,
    yearlyExceeded: input.yearlyHours >= input.yearlyLimit,
    monthlyUtilization: monthlyUtil,
    yearlyUtilization: yearlyUtil,
  };
}
