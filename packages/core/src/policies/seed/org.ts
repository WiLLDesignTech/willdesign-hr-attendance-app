import type { RawPolicy } from "@hr-attendance-app/types";
import {
  WorkArrangements,
  TimeTypes,
  LeaveTypes,
  TerminationHandlings,
  SalaryTypes,
  AllowanceTypes,
  JP_LABOR,
  HOURS,
  PROBATION,
  PAYMENT,
} from "@hr-attendance-app/types";

/**
 * Company-wide defaults (org level).
 * All groups inherit from this unless overridden.
 */
export const orgPolicy: RawPolicy = {
  hours: {
    dailyMinimum: HOURS.DAILY_MINIMUM,
    weeklyMinimum: HOURS.WEEKLY_MINIMUM,
    monthlyMinimum: HOURS.MONTHLY_FULL_TIME,
    workArrangement: WorkArrangements.OFFICE,
    timeType: TimeTypes.FIXED,
    coreHoursStart: "10:00",
    coreHoursEnd: "15:00",
  },
  leave: {
    accrualSchedule: [
      { tenureMonths: 6, daysGranted: 10 },
      { tenureMonths: 18, daysGranted: 11 },
      { tenureMonths: 30, daysGranted: 12 },
      { tenureMonths: 42, daysGranted: 14 },
      { tenureMonths: 54, daysGranted: 16 },
      { tenureMonths: 66, daysGranted: 18 },
      { tenureMonths: 78, daysGranted: 20 },
    ],
    startConditionMonths: 6,
    annualCap: 40,
    carryOverMonths: 24,
    leaveTypes: [
      LeaveTypes.PAID,
      LeaveTypes.UNPAID,
      LeaveTypes.SHIFT_PERMISSION,
      LeaveTypes.CREDITED_ABSENCE,
      LeaveTypes.BEREAVEMENT,
      LeaveTypes.MATERNITY,
      LeaveTypes.NURSING,
      LeaveTypes.MENSTRUAL,
      LeaveTypes.COMPANY_SPECIFIC,
    ],
    mandatoryUsageDays: JP_LABOR.MANDATORY_LEAVE_DAYS,
    terminationHandling: TerminationHandlings.LABOR_LAW,
  },
  overtime: {
    deemedHours: 0,
    rates: {
      standard: JP_LABOR.OVERTIME_RATE_STANDARD,
      lateNight: JP_LABOR.OVERTIME_RATE_LATE_NIGHT,
      holiday: JP_LABOR.OVERTIME_RATE_HOLIDAY,
      excess60h: JP_LABOR.OVERTIME_RATE_EXCESS_60H,
    },
    monthlyLimit: JP_LABOR.MONTHLY_OVERTIME_LIMIT,
    yearlyLimit: JP_LABOR.YEARLY_OVERTIME_LIMIT,
  },
  compensation: {
    salaryType: SalaryTypes.MONTHLY,
    bonusSchedule: [
      { month: 6, multiplier: 1 },
      { month: 12, multiplier: 1 },
    ],
    allowanceTypes: [
      { type: AllowanceTypes.TRANSPORTATION, name: "Transportation", defaultAmount: 0 },
      { type: AllowanceTypes.HOUSING, name: "Housing", defaultAmount: 0 },
      { type: AllowanceTypes.POSITION, name: "Position", defaultAmount: 0 },
    ],
    commissionTracking: false,
  },
  probation: {
    durationMonths: PROBATION.DEFAULT_DURATION_MONTHS,
    leaveAllowed: false,
    noticePeriodDays: PROBATION.DEFAULT_NOTICE_DAYS,
  },
  flags: {
    dailyThreshold: true,
    weeklyThreshold: true,
    monthlyThreshold: true,
    gracePeriodMinutes: 15,
  },
  payment: {
    deadlineDay: PAYMENT.JP_DEADLINE_DAY,
    alertDaysBefore: PAYMENT.ALERT_DAYS_BEFORE,
    settlementDeadlineDay: PAYMENT.SETTLEMENT_DEADLINE_DAY,
  },
  report: {
    submissionDeadline: "18:00",
    reminderTime: "17:00",
  },
};
