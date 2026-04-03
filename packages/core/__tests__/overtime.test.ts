import { describe, it, expect } from "vitest";
import {
  calculateOvertimeHours,
  calculateOvertimePay,
  checkDeemedOvertimeThreshold,
  check36AgreementLimits,
} from "../src/overtime/calculator.js";
import { JP_LABOR } from "@hr-attendance-app/types";

describe("Overtime Hours Calculation", () => {
  it("calculates overtime as hours exceeding threshold", () => {
    const result = calculateOvertimeHours(180, 160);
    expect(result).toBe(20);
  });

  it("returns 0 when no overtime", () => {
    expect(calculateOvertimeHours(150, 160)).toBe(0);
  });

  it("returns 0 for exact threshold", () => {
    expect(calculateOvertimeHours(160, 160)).toBe(0);
  });
});

describe("Overtime Pay Calculation", () => {
  it("calculates standard overtime pay (1.25x)", () => {
    const hourlyRate = 1875; // 300000 / 160
    const result = calculateOvertimePay({
      regularHours: 10,
      lateNightHours: 0,
      holidayHours: 0,
      hourlyRate,
      rates: {
        standard: JP_LABOR.OVERTIME_RATE_STANDARD,
        lateNight: JP_LABOR.OVERTIME_RATE_LATE_NIGHT,
        holiday: JP_LABOR.OVERTIME_RATE_HOLIDAY,
        excess60h: JP_LABOR.OVERTIME_RATE_EXCESS_60H,
      },
      monthlyOvertimeTotal: 10,
    });
    expect(result.standardPay).toBe(10 * 1875 * JP_LABOR.OVERTIME_RATE_STANDARD);
    expect(result.totalPay).toBe(result.standardPay);
  });

  it("calculates late night premium (+0.25x on top of standard)", () => {
    const hourlyRate = 1875;
    const result = calculateOvertimePay({
      regularHours: 5,
      lateNightHours: 3,
      holidayHours: 0,
      hourlyRate,
      rates: {
        standard: JP_LABOR.OVERTIME_RATE_STANDARD,
        lateNight: JP_LABOR.OVERTIME_RATE_LATE_NIGHT,
        holiday: JP_LABOR.OVERTIME_RATE_HOLIDAY,
        excess60h: JP_LABOR.OVERTIME_RATE_EXCESS_60H,
      },
      monthlyOvertimeTotal: 8,
    });
    expect(result.lateNightPay).toBe(3 * 1875 * (JP_LABOR.OVERTIME_RATE_STANDARD + JP_LABOR.OVERTIME_RATE_LATE_NIGHT));
  });

  it("calculates holiday overtime (1.35x)", () => {
    const hourlyRate = 1875;
    const result = calculateOvertimePay({
      regularHours: 0,
      lateNightHours: 0,
      holidayHours: 8,
      hourlyRate,
      rates: {
        standard: JP_LABOR.OVERTIME_RATE_STANDARD,
        lateNight: JP_LABOR.OVERTIME_RATE_LATE_NIGHT,
        holiday: JP_LABOR.OVERTIME_RATE_HOLIDAY,
        excess60h: JP_LABOR.OVERTIME_RATE_EXCESS_60H,
      },
      monthlyOvertimeTotal: 8,
    });
    expect(result.holidayPay).toBe(8 * 1875 * JP_LABOR.OVERTIME_RATE_HOLIDAY);
  });

  it("applies 1.5x rate for hours exceeding 60h/month", () => {
    const hourlyRate = 1875;
    const result = calculateOvertimePay({
      regularHours: 5,
      lateNightHours: 0,
      holidayHours: 0,
      hourlyRate,
      rates: {
        standard: JP_LABOR.OVERTIME_RATE_STANDARD,
        lateNight: JP_LABOR.OVERTIME_RATE_LATE_NIGHT,
        holiday: JP_LABOR.OVERTIME_RATE_HOLIDAY,
        excess60h: JP_LABOR.OVERTIME_RATE_EXCESS_60H,
      },
      monthlyOvertimeTotal: 63, // 3h over the 60h threshold
    });
    expect(result.excess60hPay).toBe(3 * 1875 * JP_LABOR.OVERTIME_RATE_EXCESS_60H);
  });
});

describe("Deemed Overtime Threshold", () => {
  it("flags when actual exceeds deemed", () => {
    const result = checkDeemedOvertimeThreshold(50, JP_LABOR.DEEMED_OVERTIME_HOURS);
    expect(result.exceeded).toBe(true);
    expect(result.excessHours).toBe(5);
  });

  it("does not flag when within deemed", () => {
    const result = checkDeemedOvertimeThreshold(40, JP_LABOR.DEEMED_OVERTIME_HOURS);
    expect(result.exceeded).toBe(false);
    expect(result.excessHours).toBe(0);
  });

  it("does not flag at exact deemed hours", () => {
    const result = checkDeemedOvertimeThreshold(JP_LABOR.DEEMED_OVERTIME_HOURS, JP_LABOR.DEEMED_OVERTIME_HOURS);
    expect(result.exceeded).toBe(false);
  });
});

describe("36 Agreement Limits", () => {
  it("warns when approaching monthly limit", () => {
    const result = check36AgreementLimits({
      monthlyHours: 40,
      yearlyHours: 200,
      monthlyLimit: JP_LABOR.MONTHLY_OVERTIME_LIMIT,
      yearlyLimit: JP_LABOR.YEARLY_OVERTIME_LIMIT,
    });
    expect(result.monthlyWarning).toBe(true); // 40/45 = 89%
    expect(result.monthlyExceeded).toBe(false);
  });

  it("flags when monthly limit exactly reached", () => {
    const result = check36AgreementLimits({
      monthlyHours: JP_LABOR.MONTHLY_OVERTIME_LIMIT,
      yearlyHours: 200,
      monthlyLimit: JP_LABOR.MONTHLY_OVERTIME_LIMIT,
      yearlyLimit: JP_LABOR.YEARLY_OVERTIME_LIMIT,
    });
    expect(result.monthlyExceeded).toBe(true);
    expect(result.monthlyWarning).toBe(false); // exceeded, not warning
  });

  it("flags when monthly limit exceeded", () => {
    const result = check36AgreementLimits({
      monthlyHours: 50,
      yearlyHours: 200,
      monthlyLimit: JP_LABOR.MONTHLY_OVERTIME_LIMIT,
      yearlyLimit: JP_LABOR.YEARLY_OVERTIME_LIMIT,
    });
    expect(result.monthlyExceeded).toBe(true);
  });

  it("warns when approaching yearly limit", () => {
    const result = check36AgreementLimits({
      monthlyHours: 10,
      yearlyHours: 320,
      monthlyLimit: JP_LABOR.MONTHLY_OVERTIME_LIMIT,
      yearlyLimit: JP_LABOR.YEARLY_OVERTIME_LIMIT,
    });
    expect(result.yearlyWarning).toBe(true); // 320/360 = 89%
  });

  it("no warnings when well within limits", () => {
    const result = check36AgreementLimits({
      monthlyHours: 10,
      yearlyHours: 100,
      monthlyLimit: JP_LABOR.MONTHLY_OVERTIME_LIMIT,
      yearlyLimit: JP_LABOR.YEARLY_OVERTIME_LIMIT,
    });
    expect(result.monthlyWarning).toBe(false);
    expect(result.yearlyWarning).toBe(false);
  });

  it("handles zero limits gracefully", () => {
    const result = check36AgreementLimits({
      monthlyHours: 10,
      yearlyHours: 50,
      monthlyLimit: 0,
      yearlyLimit: 0,
    });
    expect(result.monthlyWarning).toBe(false);
    expect(result.monthlyExceeded).toBe(true); // 10 >= 0
    expect(result.yearlyWarning).toBe(false);
  });
});
