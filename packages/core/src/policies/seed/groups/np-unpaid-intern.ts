import type { RawPolicy } from "@willdesign-hr/types";
import { WorkArrangements, TerminationHandlings, SalaryTypes, HOURS, PAYMENT } from "@willdesign-hr/types";

/** Nepal unpaid intern — tracked hours, no pay, no leave. */
export const npUnpaidInternPolicy: RawPolicy = {
  hours: {
    monthlyMinimum: HOURS.MONTHLY_PART_TIME,
    workArrangement: WorkArrangements.REMOTE,
  },
  leave: {
    accrualSchedule: [],
    startConditionMonths: 0,
    annualCap: 0,
    carryOverMonths: 0,
    leaveTypes: [],
    mandatoryUsageDays: 0,
    terminationHandling: TerminationHandlings.FORFEIT,
  },
  overtime: {
    deemedHours: 0,
    monthlyLimit: 0,
    yearlyLimit: 0,
  },
  compensation: {
    salaryType: SalaryTypes.MONTHLY,
    bonusSchedule: [],
    allowanceTypes: [],
    commissionTracking: false,
  },
  payment: {
    deadlineDay: PAYMENT.NP_DEADLINE_DAY,
    alertDaysBefore: PAYMENT.ALERT_DAYS_BEFORE,
    settlementDeadlineDay: PAYMENT.SETTLEMENT_DEADLINE_DAY,
  },
};
