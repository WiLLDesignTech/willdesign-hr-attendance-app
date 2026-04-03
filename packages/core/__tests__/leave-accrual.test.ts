import { describe, it, expect } from "vitest";
import {
  calculateAccrual,
  getJpAccrualDays,
  getNpAccrualDays,
  getMandatoryLeaveStatus,
} from "../src/leave/accrual.js";
import { TerminationHandlings, JP_LABOR } from "@hr-attendance-app/types";
import type { LeavePolicy } from "@hr-attendance-app/types";

const jpLeavePolicy: LeavePolicy = {
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
  leaveTypes: ["PAID", "UNPAID"],
  mandatoryUsageDays: JP_LABOR.MANDATORY_LEAVE_DAYS,
  terminationHandling: TerminationHandlings.LABOR_LAW,
};

const npLeavePolicy: LeavePolicy = {
  accrualSchedule: [{ tenureMonths: 3, daysGranted: 1 }],
  startConditionMonths: 3,
  annualCap: 20,
  carryOverMonths: 0,
  leaveTypes: ["PAID", "UNPAID"],
  mandatoryUsageDays: 0,
  terminationHandling: TerminationHandlings.FORFEIT,
};

describe("JP Leave Accrual", () => {
  it("grants 10 days at 6 months", () => {
    expect(getJpAccrualDays(jpLeavePolicy, 6)).toBe(10);
  });

  it("grants 11 days at 18 months", () => {
    expect(getJpAccrualDays(jpLeavePolicy, 18)).toBe(11);
  });

  it("grants 20 days at 78+ months", () => {
    expect(getJpAccrualDays(jpLeavePolicy, 78)).toBe(20);
    expect(getJpAccrualDays(jpLeavePolicy, 120)).toBe(20);
  });

  it("grants 0 days before 6 months", () => {
    expect(getJpAccrualDays(jpLeavePolicy, 3)).toBe(0);
    expect(getJpAccrualDays(jpLeavePolicy, 5)).toBe(0);
  });

  it("uses most recent qualifying tier", () => {
    expect(getJpAccrualDays(jpLeavePolicy, 35)).toBe(12); // between 30 and 42
  });
});

describe("NP Leave Accrual", () => {
  it("grants 1 day/month after probation (3 months)", () => {
    expect(getNpAccrualDays(npLeavePolicy, 4)).toBe(1);
    expect(getNpAccrualDays(npLeavePolicy, 12)).toBe(1);
  });

  it("grants 0 before probation", () => {
    expect(getNpAccrualDays(npLeavePolicy, 2)).toBe(0);
  });
});

describe("calculateAccrual", () => {
  it("accrues and respects cap", () => {
    const result = calculateAccrual({
      policy: npLeavePolicy,
      currentBalance: 19,
      tenureMonths: 12,
    });
    expect(result.newBalance).toBe(20); // cap at 20
    expect(result.daysAdded).toBe(1);
  });

  it("does not accrue past cap", () => {
    const result = calculateAccrual({
      policy: npLeavePolicy,
      currentBalance: 20,
      tenureMonths: 12,
    });
    expect(result.newBalance).toBe(20);
    expect(result.daysAdded).toBe(0);
  });

  it("handles carry-over expiry (NP: 0 months = no carry-over)", () => {
    const result = calculateAccrual({
      policy: npLeavePolicy,
      currentBalance: 5,
      tenureMonths: 12,
      carryOver: 3,
      carryOverMonthsAge: 1,
    });
    // NP has 0 carryOverMonths — carry-over should be forfeited
    expect(result.carryOverForfeited).toBe(3);
  });

  it("preserves JP carry-over within 24-month window", () => {
    const result = calculateAccrual({
      policy: jpLeavePolicy,
      currentBalance: 15,
      tenureMonths: 18,
      carryOver: 5,
      carryOverMonthsAge: 12,
    });
    expect(result.carryOverForfeited).toBe(0);
  });

  it("forfeits JP carry-over after 24-month window", () => {
    const result = calculateAccrual({
      policy: jpLeavePolicy,
      currentBalance: 15,
      tenureMonths: 18,
      carryOver: 5,
      carryOverMonthsAge: 25,
    });
    expect(result.carryOverForfeited).toBe(5);
  });
});

describe("Mandatory leave tracking", () => {
  it("returns warning when JP employee has used less than 5 days", () => {
    const status = getMandatoryLeaveStatus(JP_LABOR.MANDATORY_LEAVE_DAYS, 3);
    expect(status.compliant).toBe(false);
    expect(status.remaining).toBe(2);
  });

  it("returns compliant when 5+ days used", () => {
    const status = getMandatoryLeaveStatus(JP_LABOR.MANDATORY_LEAVE_DAYS, 5);
    expect(status.compliant).toBe(true);
    expect(status.remaining).toBe(0);
  });

  it("returns compliant when 0 mandatory days required", () => {
    const status = getMandatoryLeaveStatus(0, 0);
    expect(status.compliant).toBe(true);
  });
});
