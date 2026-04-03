import type { RawPolicy } from "@hr-attendance-app/types";
import { WorkArrangements, LeaveTypes, TerminationHandlings, PAYMENT } from "@hr-attendance-app/types";

/** Shared Nepal contractor policy base — remote, FORFEIT leave, flat rates. */
export const npBasePolicy: RawPolicy = {
  hours: {
    workArrangement: WorkArrangements.REMOTE,
  },
  leave: {
    accrualSchedule: [{ tenureMonths: 3, daysGranted: 1 }],
    startConditionMonths: 3,
    annualCap: 20,
    carryOverMonths: 0,
    leaveTypes: [LeaveTypes.PAID, LeaveTypes.UNPAID],
    mandatoryUsageDays: 0,
    terminationHandling: TerminationHandlings.FORFEIT,
  },
  overtime: {
    deemedHours: 0,
    rates: { standard: 1.0, lateNight: 0, holiday: 1.0, excess60h: 1.0 },
    monthlyLimit: 0,
    yearlyLimit: 0,
  },
  compensation: {
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
