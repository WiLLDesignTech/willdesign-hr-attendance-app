import { describe, it, expect } from "vitest";
import {
  getEffectiveSalary,
  calculateBlendedSalary,
  toMonthlySalary,
  calculateProRata,
  calculateDeficitDeduction,
  calculatePayrollBreakdown,
} from "../src/payroll/calculator.js";
import { SalaryTypes, SalaryChangeTypes, Currencies, JP_LABOR, AllowanceTypes } from "@hr-attendance-app/types";
import type { SalaryRecord, AllowanceItem } from "@hr-attendance-app/types";

function makeSalary(overrides: Partial<SalaryRecord> & { amount: number; effectiveFrom: string }): SalaryRecord {
  return {
    id: `SALARY#${Math.random()}`,
    employeeId: "EMP#001",
    currency: Currencies.JPY,
    salaryType: SalaryTypes.MONTHLY,
    changeType: SalaryChangeTypes.INITIAL,
    createdAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getEffectiveSalary", () => {
  it("returns the most recent entry effective on or before target month", () => {
    const history: SalaryRecord[] = [
      makeSalary({ amount: 300000, effectiveFrom: "2024-01-01" }),
      makeSalary({ amount: 350000, effectiveFrom: "2024-06-01" }),
    ];
    const result = getEffectiveSalary(history, "2024-07");
    expect(result?.amount).toBe(350000);
  });

  it("returns earlier entry when later one is not yet effective", () => {
    const history: SalaryRecord[] = [
      makeSalary({ amount: 300000, effectiveFrom: "2024-01-01" }),
      makeSalary({ amount: 350000, effectiveFrom: "2024-06-01" }),
    ];
    const result = getEffectiveSalary(history, "2024-03");
    expect(result?.amount).toBe(300000);
  });

  it("returns null when no history exists", () => {
    expect(getEffectiveSalary([], "2024-01")).toBeNull();
  });

  it("returns null when all entries are future", () => {
    const history: SalaryRecord[] = [
      makeSalary({ amount: 300000, effectiveFrom: "2025-01-01" }),
    ];
    expect(getEffectiveSalary(history, "2024-06")).toBeNull();
  });
});

describe("calculateBlendedSalary", () => {
  it("blends two salaries within the same month", () => {
    const history: SalaryRecord[] = [
      makeSalary({ amount: 300000, effectiveFrom: "2024-01-01" }),
      makeSalary({ amount: 360000, effectiveFrom: "2024-01-16" }),
    ];
    // 15 days at 300k, 16 days at 360k (Jan has 31 days)
    const result = calculateBlendedSalary(history, "2024-01");
    const expected = (300000 * 15) / 31 + (360000 * 16) / 31;
    expect(result.blendedAmount).toBeCloseTo(expected, 0);
  });

  it("blends three salary changes within the same month", () => {
    const history: SalaryRecord[] = [
      makeSalary({ amount: 300000, effectiveFrom: "2024-01-01" }),
      makeSalary({ amount: 330000, effectiveFrom: "2024-01-11" }),
      makeSalary({ amount: 360000, effectiveFrom: "2024-01-21" }),
    ];
    const result = calculateBlendedSalary(history, "2024-01");
    // 10 days at 300k, 10 days at 330k, 11 days at 360k (Jan = 31 days)
    const expected = (300000 * 10 + 330000 * 10 + 360000 * 11) / 31;
    expect(result.blendedAmount).toBeCloseTo(expected, 0);
  });

  it("returns single salary when no blending needed", () => {
    const history: SalaryRecord[] = [
      makeSalary({ amount: 300000, effectiveFrom: "2024-01-01" }),
    ];
    const result = calculateBlendedSalary(history, "2024-03");
    expect(result.blendedAmount).toBe(300000);
    expect(result.details).toBeNull();
  });
});

describe("toMonthlySalary", () => {
  it("converts annual to monthly (divide by 12)", () => {
    expect(toMonthlySalary(3600000, SalaryTypes.ANNUAL)).toBe(300000);
  });

  it("returns monthly as-is", () => {
    expect(toMonthlySalary(300000, SalaryTypes.MONTHLY)).toBe(300000);
  });

  it("converts hourly (160h default for full-time)", () => {
    expect(toMonthlySalary(2000, SalaryTypes.HOURLY)).toBe(320000); // 2000 * 160
  });
});

describe("calculateProRata", () => {
  it("calculates pro-rata for mid-month join", () => {
    // Joined on 16th, 16 days in a 31-day month
    const result = calculateProRata(300000, 16, 31);
    expect(result).toBeCloseTo((300000 * 16) / 31, 0);
  });

  it("returns full salary for full month", () => {
    expect(calculateProRata(300000, 31, 31)).toBe(300000);
  });
});

describe("calculateDeficitDeduction", () => {
  it("calculates NP deficit deduction with ceiling rounding", () => {
    // 50000 NPR / 160h = 312.5/h, 5h deficit = 1562.5 → ceil = 1563
    const result = calculateDeficitDeduction(50000, 160, 5);
    expect(result).toBe(1563);
  });

  it("returns 0 for no deficit", () => {
    expect(calculateDeficitDeduction(50000, 160, 0)).toBe(0);
  });
});

describe("calculatePayrollBreakdown", () => {
  it("produces full JP payroll with overtime and allowances", () => {
    const allowances: AllowanceItem[] = [
      { type: AllowanceTypes.TRANSPORTATION, name: "Transportation", amount: 15000, currency: Currencies.JPY },
    ];
    const result = calculatePayrollBreakdown({
      baseSalary: 300000,
      currency: Currencies.JPY,
      employeeId: "EMP#001",
      yearMonth: "2024-01",
      overtimeHours: 10,
      overtimeRate: JP_LABOR.OVERTIME_RATE_STANDARD,
      hourlyRateForOvertime: 1875, // 300000 / 160
      allowances,
      bonus: 0,
      commission: 0,
      deficitHours: 0,
      monthlyHourlyRate: 0,
      proRataDays: null,
      totalDays: 31,
      exchangeRate: null,
      exchangeRateDate: null,
      transferFees: 0,
    });

    expect(result.baseSalary).toBe(300000);
    expect(result.overtimePay).toBe(10 * 1875 * JP_LABOR.OVERTIME_RATE_STANDARD);
    expect(result.allowances).toHaveLength(1);
    expect(result.netAmount).toBe(300000 + result.overtimePay + 15000);
    expect(result.currency).toBe(Currencies.JPY);
  });

  it("produces NP payroll with deficit deduction and exchange rate", () => {
    const result = calculatePayrollBreakdown({
      baseSalary: 50000,
      currency: Currencies.NPR,
      employeeId: "EMP#002",
      yearMonth: "2024-01",
      overtimeHours: 0,
      overtimeRate: 1.0,
      hourlyRateForOvertime: 0,
      allowances: [],
      bonus: 0,
      commission: 0,
      deficitHours: 5,
      monthlyHourlyRate: 312.5, // 50000 / 160
      proRataDays: null,
      totalDays: 31,
      exchangeRate: 0.77,
      exchangeRateDate: "2024-01-25",
      transferFees: 500,
    });

    expect(result.deficitDeduction).toBe(1563); // ceil(312.5 * 5)
    expect(result.netAmount).toBe(50000 - 1563 - 500);
    expect(result.jpyEquivalent).toBeCloseTo((50000 - 1563) * 0.77, 0);
    expect(result.exchangeRate).toBe(0.77);
    expect(result.transferFees).toBe(500);
  });

  it("applies pro-rata for mid-month join", () => {
    const result = calculatePayrollBreakdown({
      baseSalary: 300000,
      currency: Currencies.JPY,
      employeeId: "EMP#001",
      yearMonth: "2024-01",
      overtimeHours: 0,
      overtimeRate: 1.25,
      hourlyRateForOvertime: 0,
      allowances: [],
      bonus: 0,
      commission: 0,
      deficitHours: 0,
      monthlyHourlyRate: 0,
      proRataDays: 16,
      totalDays: 31,
      exchangeRate: null,
      exchangeRateDate: null,
      transferFees: 0,
    });

    expect(result.proRataAdjustment).toBeCloseTo(300000 - (300000 * 16) / 31, 0);
    expect(result.netAmount).toBeCloseTo((300000 * 16) / 31, 0);
  });

  it("includes commission for sales roles", () => {
    const result = calculatePayrollBreakdown({
      baseSalary: 300000,
      currency: Currencies.JPY,
      employeeId: "EMP#001",
      yearMonth: "2024-01",
      overtimeHours: 0,
      overtimeRate: 1.25,
      hourlyRateForOvertime: 0,
      allowances: [],
      bonus: 0,
      commission: 50000,
      deficitHours: 0,
      monthlyHourlyRate: 0,
      proRataDays: null,
      totalDays: 31,
      exchangeRate: null,
      exchangeRateDate: null,
      transferFees: 0,
    });

    expect(result.commission).toBe(50000);
    expect(result.netAmount).toBe(350000);
  });
});
