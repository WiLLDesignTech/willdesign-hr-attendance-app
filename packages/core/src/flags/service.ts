import type { FlagLevel, FlagResolution } from "@hr-attendance-app/types";
import { FlagLevels, FlagResolutions, BANKING, FORCE_MAJEURE } from "@hr-attendance-app/types";

// ─── Flag Generation (9.1) ───

export interface FlagCheckInput {
  readonly level: FlagLevel;
  readonly workedHours: number;
  readonly requiredHours: number;
  readonly hasApprovedLeave: boolean;
  readonly hasPreApproval: boolean;
}

export interface FlagCheckResult {
  readonly shouldFlag: boolean;
  readonly deficitHours: number;
  readonly deductible: boolean;
}

export function shouldGenerateFlag(input: FlagCheckInput): FlagCheckResult {
  if (input.hasApprovedLeave || input.hasPreApproval) {
    return { shouldFlag: false, deficitHours: 0, deductible: false };
  }

  const deficit = input.requiredHours - input.workedHours;
  if (deficit <= 0) {
    return { shouldFlag: false, deficitHours: 0, deductible: false };
  }

  // Anti-double-penalty: only MONTHLY flags result in salary deductions
  const deductible = input.level === FlagLevels.MONTHLY;

  return { shouldFlag: true, deficitHours: deficit, deductible };
}

// ─── Flag Resolution (9.2) ───

export interface ResolveInput {
  readonly flagId: string;
  readonly resolution: FlagResolution;
  readonly managerId: string;
  readonly deficitHours: number;
  readonly bankOffsetHours?: number;
}

export interface ResolveResult {
  readonly resolution: FlagResolution;
  readonly deductionHours: number;
  readonly bankHoursUsed: number;
  readonly isPending: boolean;
}

export function resolveFlag(input: ResolveInput): ResolveResult {
  const bankOffset = input.bankOffsetHours ?? 0;

  switch (input.resolution) {
    case FlagResolutions.NO_PENALTY:
      return { resolution: input.resolution, deductionHours: 0, bankHoursUsed: 0, isPending: false };

    case FlagResolutions.DEDUCT_FULL:
      return { resolution: input.resolution, deductionHours: input.deficitHours, bankHoursUsed: 0, isPending: false };

    case FlagResolutions.USE_BANK:
      return {
        resolution: input.resolution,
        deductionHours: Math.max(0, input.deficitHours - bankOffset),
        bankHoursUsed: Math.min(bankOffset, input.deficitHours),
        isPending: false,
      };

    case FlagResolutions.PARTIAL_BANK:
      return {
        resolution: input.resolution,
        deductionHours: Math.max(0, input.deficitHours - bankOffset),
        bankHoursUsed: Math.min(bankOffset, input.deficitHours),
        isPending: false,
      };

    case FlagResolutions.DISCUSS:
      return { resolution: input.resolution, deductionHours: 0, bankHoursUsed: 0, isPending: true };

    default:
      return { resolution: input.resolution, deductionHours: 0, bankHoursUsed: 0, isPending: true };
  }
}

// ─── Hours Banking (9.3) ───

export interface CreateBankInput {
  readonly employeeId: string;
  readonly surplusHours: number;
  readonly yearMonth: string;
  readonly approvedBy: string;
}

export interface BankEntryResult {
  readonly employeeId: string;
  readonly surplusHours: number;
  readonly usedHours: number;
  readonly remainingHours: number;
  readonly yearMonth: string;
  readonly expiresAt: string;
}


export function createBankEntry(input: CreateBankInput): BankEntryResult {
  const [year, month] = input.yearMonth.split("-").map(Number) as [number, number];
  const expiryMonth = month - 1 + BANKING.EXPIRY_MONTHS; // 0-indexed target month
  const expiryYear = year + Math.floor(expiryMonth / 12);
  const expiryMonthNorm = expiryMonth % 12;
  const lastDay = new Date(expiryYear, expiryMonthNorm + 1, 0).getDate();
  const expiresAt = `${expiryYear}-${String(expiryMonthNorm + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return {
    employeeId: input.employeeId,
    surplusHours: input.surplusHours,
    usedHours: 0,
    remainingHours: input.surplusHours,
    yearMonth: input.yearMonth,
    expiresAt,
  };
}

export function isExpired(expiresAt: string, now: Date): boolean {
  return new Date(expiresAt).getTime() < now.getTime();
}

export interface BankOffsetEntry {
  readonly remainingHours: number;
  readonly expiresAt: string;
}

export interface BankOffsetResult {
  readonly totalApplied: number;
  readonly fullyApplied: boolean;
  readonly entriesUsed: readonly { index: number; hoursUsed: number }[];
}

export function applyBankOffset(
  entries: readonly BankOffsetEntry[],
  hoursNeeded: number,
  now: Date,
): BankOffsetResult {
  let remaining = hoursNeeded;
  const entriesUsed: { index: number; hoursUsed: number }[] = [];

  for (let i = 0; i < entries.length; i++) {
    if (remaining <= 0) break;
    const entry = entries[i]!;
    if (isExpired(entry.expiresAt, now)) continue;
    if (entry.remainingHours <= 0) continue;

    const use = Math.min(entry.remainingHours, remaining);
    entriesUsed.push({ index: i, hoursUsed: use });
    remaining -= use;
  }

  return {
    totalApplied: hoursNeeded - remaining,
    fullyApplied: remaining <= 0,
    entriesUsed,
  };
}

// ─── Quota Redistribution (9.4) ───

export interface QuotaMonth {
  readonly yearMonth: string;
  readonly requiredHours: number;
}

export interface ValidateQuotaInput {
  readonly months: readonly QuotaMonth[];
  readonly standardMonthlyHours: number;
}

export interface ValidateQuotaResult {
  readonly valid: boolean;
  readonly totalHours: number;
  readonly expectedTotal: number;
  readonly shortfall: number;
}

export function validateQuotaPlan(input: ValidateQuotaInput): ValidateQuotaResult {
  if (input.months.length === 0) {
    return { valid: false, totalHours: 0, expectedTotal: 0, shortfall: 0 };
  }

  const totalHours = input.months.reduce((sum, m) => sum + m.requiredHours, 0);
  const expectedTotal = input.months.length * input.standardMonthlyHours;
  const shortfall = Math.max(0, expectedTotal - totalHours);

  return {
    valid: totalHours >= expectedTotal,
    totalHours,
    expectedTotal,
    shortfall,
  };
}

export interface CreateQuotaPlanInput {
  readonly employeeId: string;
  readonly months: readonly QuotaMonth[];
  readonly approvedBy: string;
}

export interface QuotaPlanResult {
  readonly employeeId: string;
  readonly months: readonly QuotaMonth[];
  readonly totalHours: number;
  readonly approvedBy: string;
}

export function createQuotaPlan(input: CreateQuotaPlanInput): QuotaPlanResult {
  return {
    employeeId: input.employeeId,
    months: input.months,
    totalHours: input.months.reduce((sum, m) => sum + m.requiredHours, 0),
    approvedBy: input.approvedBy,
  };
}

// ─── Force Majeure (9.5) ───

export interface ForceMajeureInput {
  readonly requiredHours: number;
  readonly totalWorkDays: number;
  readonly affectedDays: number;
  readonly consecutiveDays?: number;
}

export interface ForceMajeureResult {
  readonly adjustedHours: number;
  readonly reductionHours: number;
  readonly terminationTrigger: boolean;
}


export function calculateForceMajeureAdjustment(input: ForceMajeureInput): ForceMajeureResult {
  if (input.affectedDays === 0) {
    return {
      adjustedHours: input.requiredHours,
      reductionHours: 0,
      terminationTrigger: false,
    };
  }

  const effectiveDays = input.totalWorkDays - input.affectedDays;
  const adjustedHours = Math.round((input.requiredHours * effectiveDays) / input.totalWorkDays);
  const reductionHours = input.requiredHours - adjustedHours;
  const terminationTrigger = (input.consecutiveDays ?? 0) > FORCE_MAJEURE.TERMINATION_DAYS;

  return { adjustedHours, reductionHours, terminationTrigger };
}
