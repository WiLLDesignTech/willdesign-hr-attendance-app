import type { LeavePolicy } from "@hr-attendance-app/types";

export interface AccrualInput {
  readonly policy: LeavePolicy;
  readonly currentBalance: number;
  readonly tenureMonths: number;
  readonly carryOver?: number;
  readonly carryOverMonthsAge?: number;
}

export interface AccrualResult {
  readonly newBalance: number;
  readonly daysAdded: number;
  readonly carryOverForfeited: number;
}

export interface MandatoryLeaveStatus {
  readonly compliant: boolean;
  readonly remaining: number;
}

/**
 * Get JP accrual days based on tenure using the schedule from policy.
 * Returns the days for the most recent qualifying tier.
 */
export function getJpAccrualDays(policy: LeavePolicy, tenureMonths: number): number {
  if (tenureMonths < policy.startConditionMonths) return 0;

  let days = 0;
  for (const tier of policy.accrualSchedule) {
    if (tenureMonths >= tier.tenureMonths) {
      days = tier.daysGranted;
    }
  }
  return days;
}

/**
 * Get NP accrual days: 1 day/month after probation.
 */
export function getNpAccrualDays(policy: LeavePolicy, tenureMonths: number): number {
  if (tenureMonths < policy.startConditionMonths) return 0;
  if (policy.accrualSchedule.length === 0) return 0;
  return policy.accrualSchedule[0]!.daysGranted;
}

/**
 * Calculate monthly accrual with cap and carry-over expiry.
 */
export function calculateAccrual(input: AccrualInput): AccrualResult {
  const { policy, currentBalance, tenureMonths } = input;
  const carryOver = input.carryOver ?? 0;
  const carryOverAge = input.carryOverMonthsAge ?? 0;

  // Determine carry-over forfeiture
  let carryOverForfeited = 0;
  if (carryOver > 0 && policy.carryOverMonths === 0) {
    carryOverForfeited = carryOver;
  } else if (carryOver > 0 && carryOverAge > policy.carryOverMonths) {
    carryOverForfeited = carryOver;
  }

  // Determine days to add based on schedule type
  let daysToAdd: number;
  if (policy.accrualSchedule.length === 1 && policy.accrualSchedule[0]!.daysGranted <= 1) {
    // Monthly accrual pattern (NP-style: 1 day/month)
    daysToAdd = getNpAccrualDays(policy, tenureMonths);
  } else {
    // Annual accrual pattern (JP-style: based on tenure tiers)
    // Annual accrual is handled at the anniversary; monthly trigger returns 0
    daysToAdd = 0;
  }

  // Apply cap
  const balanceAfterForfeit = currentBalance - carryOverForfeited;
  const uncapped = balanceAfterForfeit + daysToAdd;
  const newBalance = Math.min(uncapped, policy.annualCap);
  const actualAdded = newBalance - balanceAfterForfeit;

  return {
    newBalance: Math.max(0, newBalance),
    daysAdded: Math.max(0, actualAdded),
    carryOverForfeited,
  };
}

/**
 * Check mandatory annual leave usage compliance.
 */
export function getMandatoryLeaveStatus(
  mandatoryDays: number,
  daysUsed: number,
): MandatoryLeaveStatus {
  if (mandatoryDays === 0) {
    return { compliant: true, remaining: 0 };
  }
  const remaining = Math.max(0, mandatoryDays - daysUsed);
  return {
    compliant: remaining === 0,
    remaining,
  };
}
