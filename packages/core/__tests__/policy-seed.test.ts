import { describe, it, expect } from "vitest";
import { resolveCascade } from "../src/policies/resolver.js";
import { TerminationHandlings, SalaryTypes, WorkArrangements } from "@hr-attendance-app/types";
import {
  orgPolicy,
  jpFulltimePolicy,
  jpContractPolicy,
  jpOutsourcedPolicy,
  jpParttimePolicy,
  jpSalesPolicy,
  jpInternPolicy,
  npFulltimePolicy,
  npPaidInternPolicy,
  npUnpaidInternPolicy,
} from "../src/policies/seed/index.js";

describe("Seed policy cascade", () => {
  it("org policy has all 8 domains", () => {
    expect(orgPolicy.hours).toBeDefined();
    expect(orgPolicy.leave).toBeDefined();
    expect(orgPolicy.overtime).toBeDefined();
    expect(orgPolicy.compensation).toBeDefined();
    expect(orgPolicy.probation).toBeDefined();
    expect(orgPolicy.flags).toBeDefined();
    expect(orgPolicy.payment).toBeDefined();
    expect(orgPolicy.report).toBeDefined();
  });

  it("JP full-time resolves with deemed overtime 45h", () => {
    const resolved = resolveCascade(orgPolicy, jpFulltimePolicy, null);
    expect(resolved.overtime?.deemedHours).toBe(45);
    expect(resolved.overtime?.rates?.standard).toBe(1.25);
    expect(resolved.hours?.monthlyMinimum).toBe(160);
  });

  it("JP contract resolves with 30-day notice period", () => {
    const resolved = resolveCascade(orgPolicy, jpContractPolicy, null);
    expect(resolved.probation?.noticePeriodDays).toBe(30);
    expect(resolved.overtime?.deemedHours).toBe(45);
  });

  it("JP outsourced has no leave accrual", () => {
    const resolved = resolveCascade(orgPolicy, jpOutsourcedPolicy, null);
    expect(resolved.leave?.accrualSchedule).toEqual([]);
    expect(resolved.leave?.terminationHandling).toBe(TerminationHandlings.FORFEIT);
    expect(resolved.overtime?.monthlyLimit).toBe(0);
  });

  it("JP part-time resolves with 80h/mo and hourly salary", () => {
    const resolved = resolveCascade(orgPolicy, jpParttimePolicy, null);
    expect(resolved.hours?.monthlyMinimum).toBe(80);
    expect(resolved.compensation?.salaryType).toBe(SalaryTypes.HOURLY);
    expect(resolved.hours?.dailyMinimum).toBe(8);
  });

  it("JP sales has commission tracking enabled", () => {
    const resolved = resolveCascade(orgPolicy, jpSalesPolicy, null);
    expect(resolved.compensation?.commissionTracking).toBe(true);
    expect(resolved.overtime?.deemedHours).toBe(45);
  });

  it("JP intern has no overtime limits and no mandatory leave", () => {
    const resolved = resolveCascade(orgPolicy, jpInternPolicy, null);
    expect(resolved.overtime?.monthlyLimit).toBe(0);
    expect(resolved.leave?.mandatoryUsageDays).toBe(0);
    expect(resolved.hours?.monthlyMinimum).toBe(80);
  });

  it("NP full-time resolves with remote work and FORFEIT leave", () => {
    const resolved = resolveCascade(orgPolicy, npFulltimePolicy, null);
    expect(resolved.hours?.workArrangement).toBe(WorkArrangements.REMOTE);
    expect(resolved.leave?.terminationHandling).toBe(TerminationHandlings.FORFEIT);
    expect(resolved.leave?.startConditionMonths).toBe(3);
    expect(resolved.overtime?.rates?.standard).toBe(1.0);
    expect(resolved.payment?.deadlineDay).toBe(15);
  });

  it("NP paid intern has 80h/mo minimum", () => {
    const resolved = resolveCascade(orgPolicy, npPaidInternPolicy, null);
    expect(resolved.hours?.monthlyMinimum).toBe(80);
    expect(resolved.hours?.workArrangement).toBe(WorkArrangements.REMOTE);
    expect(resolved.leave?.terminationHandling).toBe(TerminationHandlings.FORFEIT);
  });

  it("NP unpaid intern has no leave types", () => {
    const resolved = resolveCascade(orgPolicy, npUnpaidInternPolicy, null);
    expect(resolved.leave?.leaveTypes).toEqual([]);
    expect(resolved.leave?.annualCap).toBe(0);
    expect(resolved.hours?.monthlyMinimum).toBe(80);
  });

  it("36 Agreement limits present in org policy", () => {
    expect(orgPolicy.overtime?.monthlyLimit).toBe(45);
    expect(orgPolicy.overtime?.yearlyLimit).toBe(360);
  });

  it("user override on top of group works", () => {
    const userOverride = { hours: { monthlyMinimum: 140 } };
    const resolved = resolveCascade(orgPolicy, npFulltimePolicy, userOverride);
    expect(resolved.hours?.monthlyMinimum).toBe(140);
    expect(resolved.hours?.workArrangement).toBe(WorkArrangements.REMOTE);
  });
});
