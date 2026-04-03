import { describe, it, expect } from "vitest";
import {
  shouldGenerateFlag,
  resolveFlag,
  createBankEntry,
  isExpired,
  applyBankOffset,
  createQuotaPlan,
  validateQuotaPlan,
  calculateForceMajeureAdjustment,
} from "../src/flags/service.js";
import { FlagLevels, FlagResolutions, HOURS } from "@hr-attendance-app/types";

describe("Flag Generation (9.1)", () => {
  it("generates daily flag when hours below minimum and no leave", () => {
    const result = shouldGenerateFlag({
      level: FlagLevels.DAILY,
      workedHours: 6,
      requiredHours: HOURS.DAILY_MINIMUM,
      hasApprovedLeave: false,
      hasPreApproval: false,
    });
    expect(result.shouldFlag).toBe(true);
    expect(result.deficitHours).toBe(2);
  });

  it("suppresses flag when approved leave exists", () => {
    const result = shouldGenerateFlag({
      level: FlagLevels.DAILY,
      workedHours: 0,
      requiredHours: HOURS.DAILY_MINIMUM,
      hasApprovedLeave: true,
      hasPreApproval: false,
    });
    expect(result.shouldFlag).toBe(false);
  });

  it("suppresses flag when manager pre-approved", () => {
    const result = shouldGenerateFlag({
      level: FlagLevels.DAILY,
      workedHours: 4,
      requiredHours: HOURS.DAILY_MINIMUM,
      hasApprovedLeave: false,
      hasPreApproval: true,
    });
    expect(result.shouldFlag).toBe(false);
  });

  it("generates monthly flag for monthly deficit", () => {
    const result = shouldGenerateFlag({
      level: FlagLevels.MONTHLY,
      workedHours: 140,
      requiredHours: HOURS.MONTHLY_FULL_TIME,
      hasApprovedLeave: false,
      hasPreApproval: false,
    });
    expect(result.shouldFlag).toBe(true);
    expect(result.deficitHours).toBe(20);
  });

  it("does not flag when hours meet requirement", () => {
    const result = shouldGenerateFlag({
      level: FlagLevels.DAILY,
      workedHours: 8,
      requiredHours: HOURS.DAILY_MINIMUM,
      hasApprovedLeave: false,
      hasPreApproval: false,
    });
    expect(result.shouldFlag).toBe(false);
  });

  it("anti-double-penalty: only monthly flags have deductible=true", () => {
    const daily = shouldGenerateFlag({
      level: FlagLevels.DAILY, workedHours: 6, requiredHours: HOURS.DAILY_MINIMUM,
      hasApprovedLeave: false, hasPreApproval: false,
    });
    const monthly = shouldGenerateFlag({
      level: FlagLevels.MONTHLY, workedHours: 140, requiredHours: HOURS.MONTHLY_FULL_TIME,
      hasApprovedLeave: false, hasPreApproval: false,
    });
    expect(daily.deductible).toBe(false);
    expect(monthly.deductible).toBe(true);
  });
});

describe("Flag Resolution (9.2)", () => {
  it("resolves with NO_PENALTY", () => {
    const result = resolveFlag({
      flagId: "FLAG#001",
      resolution: FlagResolutions.NO_PENALTY,
      managerId: "EMP#MGR",
      deficitHours: 10,
    });
    expect(result.resolution).toBe(FlagResolutions.NO_PENALTY);
    expect(result.deductionHours).toBe(0);
  });

  it("resolves with DEDUCT_FULL", () => {
    const result = resolveFlag({
      flagId: "FLAG#001",
      resolution: FlagResolutions.DEDUCT_FULL,
      managerId: "EMP#MGR",
      deficitHours: 10,
    });
    expect(result.deductionHours).toBe(10);
  });

  it("resolves with USE_BANK — full offset", () => {
    const result = resolveFlag({
      flagId: "FLAG#001",
      resolution: FlagResolutions.USE_BANK,
      managerId: "EMP#MGR",
      deficitHours: 10,
      bankOffsetHours: 10,
    });
    expect(result.deductionHours).toBe(0);
    expect(result.bankHoursUsed).toBe(10);
  });

  it("resolves with PARTIAL_BANK", () => {
    const result = resolveFlag({
      flagId: "FLAG#001",
      resolution: FlagResolutions.PARTIAL_BANK,
      managerId: "EMP#MGR",
      deficitHours: 10,
      bankOffsetHours: 6,
    });
    expect(result.deductionHours).toBe(4);
    expect(result.bankHoursUsed).toBe(6);
  });

  it("resolves with DISCUSS — keeps pending", () => {
    const result = resolveFlag({
      flagId: "FLAG#001",
      resolution: FlagResolutions.DISCUSS,
      managerId: "EMP#MGR",
      deficitHours: 10,
    });
    expect(result.deductionHours).toBe(0);
    expect(result.isPending).toBe(true);
  });
});

describe("Hours Banking (9.3)", () => {
  it("creates a bank entry with 12-month expiry", () => {
    const entry = createBankEntry({
      employeeId: "EMP#001",
      surplusHours: 15,
      yearMonth: "2024-01",
      approvedBy: "EMP#MGR",
    });
    expect(entry.surplusHours).toBe(15);
    expect(entry.remainingHours).toBe(15);
    expect(entry.expiresAt).toBe("2025-01-31");
  });

  it("checks expiry correctly", () => {
    expect(isExpired("2024-01-31", new Date("2024-02-01"))).toBe(true);
    expect(isExpired("2024-12-31", new Date("2024-06-01"))).toBe(false);
  });

  it("applies bank offset from active entries only", () => {
    const entries = [
      { remainingHours: 5, expiresAt: "2025-06-30" }, // active
      { remainingHours: 10, expiresAt: "2023-12-31" }, // expired
      { remainingHours: 8, expiresAt: "2025-06-30" }, // active
    ];
    const result = applyBankOffset(entries, 10, new Date("2024-06-01"));
    expect(result.totalApplied).toBe(10);
    expect(result.entriesUsed).toHaveLength(2); // 5 from first, 5 from third
  });

  it("caps offset at available hours", () => {
    const entries = [
      { remainingHours: 3, expiresAt: "2025-06-30" },
    ];
    const result = applyBankOffset(entries, 10, new Date("2024-06-01"));
    expect(result.totalApplied).toBe(3);
  });
});

describe("Quota Redistribution (9.4)", () => {
  it("validates plan totals match standard", () => {
    const result = validateQuotaPlan({
      months: [
        { yearMonth: "2024-04", requiredHours: 140 },
        { yearMonth: "2024-05", requiredHours: 180 },
      ],
      standardMonthlyHours: HOURS.MONTHLY_FULL_TIME,
    });
    expect(result.valid).toBe(true);
    expect(result.totalHours).toBe(320);
    expect(result.expectedTotal).toBe(320); // 160 * 2
  });

  it("warns when total is less than standard", () => {
    const result = validateQuotaPlan({
      months: [
        { yearMonth: "2024-04", requiredHours: 140 },
        { yearMonth: "2024-05", requiredHours: 140 },
      ],
      standardMonthlyHours: HOURS.MONTHLY_FULL_TIME,
    });
    expect(result.valid).toBe(false);
    expect(result.shortfall).toBe(40);
  });

  it("creates quota plan with linked overrides", () => {
    const plan = createQuotaPlan({
      employeeId: "EMP#001",
      months: [
        { yearMonth: "2024-04", requiredHours: 140 },
        { yearMonth: "2024-05", requiredHours: 180 },
      ],
      approvedBy: "EMP#MGR",
    });
    expect(plan.months).toHaveLength(2);
    expect(plan.totalHours).toBe(320);
  });
});

describe("Force Majeure (9.5)", () => {
  it("reduces hours proportionally for affected days", () => {
    const result = calculateForceMajeureAdjustment({
      requiredHours: HOURS.MONTHLY_FULL_TIME,
      totalWorkDays: 20,
      affectedDays: 5,
    });
    expect(result.adjustedHours).toBe(120); // 160 * (15/20)
    expect(result.reductionHours).toBe(40);
  });

  it("returns zero reduction when no affected days", () => {
    const result = calculateForceMajeureAdjustment({
      requiredHours: HOURS.MONTHLY_FULL_TIME,
      totalWorkDays: 20,
      affectedDays: 0,
    });
    expect(result.adjustedHours).toBe(HOURS.MONTHLY_FULL_TIME);
    expect(result.reductionHours).toBe(0);
  });

  it("flags 30-day termination trigger", () => {
    const result = calculateForceMajeureAdjustment({
      requiredHours: HOURS.MONTHLY_FULL_TIME,
      totalWorkDays: 20,
      affectedDays: 20,
      consecutiveDays: 31,
    });
    expect(result.terminationTrigger).toBe(true);
  });
});
