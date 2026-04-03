import type { RawPolicy } from "@hr-attendance-app/types";
import { LeaveTypes, TerminationHandlings } from "@hr-attendance-app/types";

/** 業務委託 — JP outsourced contractor. No overtime tracking, no leave. */
export const jpOutsourcedPolicy: RawPolicy = {
  overtime: {
    deemedHours: 0,
    monthlyLimit: 0,
    yearlyLimit: 0,
  },
  leave: {
    accrualSchedule: [],
    startConditionMonths: 0,
    annualCap: 0,
    carryOverMonths: 0,
    leaveTypes: [LeaveTypes.UNPAID],
    mandatoryUsageDays: 0,
    terminationHandling: TerminationHandlings.FORFEIT,
  },
};
