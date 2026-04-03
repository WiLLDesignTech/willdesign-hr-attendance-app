import { describe, it, expect } from "vitest";
import { deepMergePolicy, resolveCascade } from "../src/policies/resolver.js";
import type { RawPolicy, LeaveType } from "@hr-attendance-app/types";
import { LeaveTypes, JP_LABOR } from "@hr-attendance-app/types";

describe("deepMergePolicy", () => {
  it("returns base when override is empty", () => {
    const base: RawPolicy = { hours: { dailyMinimum: 8 } };
    const result = deepMergePolicy(base, {});
    expect(result).toEqual({ hours: { dailyMinimum: 8 } });
  });

  it("overrides scalar fields at nested level", () => {
    const base: RawPolicy = { hours: { dailyMinimum: 8, weeklyMinimum: 40 } };
    const override: RawPolicy = { hours: { dailyMinimum: 6 } };
    const result = deepMergePolicy(base, override);
    expect(result.hours?.dailyMinimum).toBe(6);
    expect(result.hours?.weeklyMinimum).toBe(40);
  });

  it("replaces arrays entirely (not append)", () => {
    const base: RawPolicy = {
      leave: { leaveTypes: [LeaveTypes.PAID, LeaveTypes.UNPAID, LeaveTypes.SHIFT_PERMISSION] as LeaveType[] },
    };
    const override: RawPolicy = {
      leave: { leaveTypes: [LeaveTypes.PAID] as LeaveType[] },
    };
    const result = deepMergePolicy(base, override);
    expect(result.leave?.leaveTypes).toEqual([LeaveTypes.PAID]);
  });

  it("adds new domains from override", () => {
    const base: RawPolicy = { hours: { dailyMinimum: 8 } };
    const override: RawPolicy = { probation: { durationMonths: 6 } };
    const result = deepMergePolicy(base, override);
    expect(result.hours?.dailyMinimum).toBe(8);
    expect(result.probation?.durationMonths).toBe(6);
  });

  it("deep merges nested objects (overtime.rates)", () => {
    const base: RawPolicy = {
      overtime: { rates: { standard: 1.25, lateNight: 0.25, holiday: 1.35, excess60h: 1.5 } },
    };
    const override: RawPolicy = {
      overtime: { rates: { holiday: 1.0 } },
    };
    const result = deepMergePolicy(base, override);
    expect(result.overtime?.rates?.standard).toBe(1.25);
    expect(result.overtime?.rates?.holiday).toBe(1.0);
  });
});

describe("resolveCascade", () => {
  const companyPolicy: RawPolicy = {
    hours: { dailyMinimum: 8, weeklyMinimum: 40, monthlyMinimum: 160 },
    probation: { durationMonths: 3, leaveAllowed: false, noticePeriodDays: 14 },
    overtime: {
      deemedHours: 0,
      rates: { standard: 1.25, lateNight: 0.25, holiday: 1.35, excess60h: 1.5 },
      monthlyLimit: 45,
      yearlyLimit: 360,
    },
  };

  it("resolves single level (company only)", () => {
    const result = resolveCascade(companyPolicy, null, null);
    expect(result.hours?.dailyMinimum).toBe(8);
    expect(result.probation?.durationMonths).toBe(3);
  });

  it("resolves two levels (company + group)", () => {
    const groupPolicy: RawPolicy = {
      hours: { monthlyMinimum: 80 },
      overtime: { deemedHours: 45 },
    };
    const result = resolveCascade(companyPolicy, groupPolicy, null);
    expect(result.hours?.dailyMinimum).toBe(8);
    expect(result.hours?.monthlyMinimum).toBe(80);
    expect(result.overtime?.deemedHours).toBe(45);
    expect(result.overtime?.rates?.standard).toBe(1.25);
  });

  it("resolves three levels (company + group + user)", () => {
    const groupPolicy: RawPolicy = {
      hours: { monthlyMinimum: 80 },
    };
    const userPolicy: RawPolicy = {
      hours: { monthlyMinimum: 120 },
    };
    const result = resolveCascade(companyPolicy, groupPolicy, userPolicy);
    expect(result.hours?.monthlyMinimum).toBe(120);
    expect(result.hours?.dailyMinimum).toBe(8);
  });

  it("handles null group (company + user only)", () => {
    const userPolicy: RawPolicy = {
      probation: { durationMonths: 6 },
    };
    const result = resolveCascade(companyPolicy, null, userPolicy);
    expect(result.probation?.durationMonths).toBe(6);
    expect(result.hours?.dailyMinimum).toBe(8);
  });

  it("filters by effective date", () => {
    const futureGroup: RawPolicy = {
      hours: { monthlyMinimum: 80 },
      effectiveFrom: "2030-01-01",
    };
    const result = resolveCascade(companyPolicy, futureGroup, null, new Date("2025-06-01"));
    expect(result.hours?.monthlyMinimum).toBe(160);
  });

  it("includes policy when effective date has passed", () => {
    const pastGroup: RawPolicy = {
      hours: { monthlyMinimum: 80 },
      effectiveFrom: "2024-01-01",
    };
    const result = resolveCascade(companyPolicy, pastGroup, null, new Date("2025-06-01"));
    expect(result.hours?.monthlyMinimum).toBe(80);
  });

  it("includes policy when effectiveFrom is not set", () => {
    const group: RawPolicy = {
      hours: { monthlyMinimum: 80 },
    };
    const result = resolveCascade(companyPolicy, group, null, new Date("2025-06-01"));
    expect(result.hours?.monthlyMinimum).toBe(80);
  });
});
