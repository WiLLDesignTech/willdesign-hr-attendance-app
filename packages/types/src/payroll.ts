export type Currency = "JPY" | "NPR";

export type SalaryType = "MONTHLY" | "ANNUAL" | "HOURLY";

export type SalaryChangeType =
  | "INITIAL"
  | "PROBATION_END"
  | "REVIEW"
  | "PROMOTION"
  | "ADJUSTMENT";

export interface SalaryRecord {
  readonly id: string;
  readonly employeeId: string;
  readonly amount: number;
  readonly currency: Currency;
  readonly salaryType: SalaryType;
  readonly changeType: SalaryChangeType;
  readonly effectiveFrom: string;
  readonly agreementDocumentId?: string;
  readonly createdAt: string;
}

export interface AllowanceItem {
  readonly type: string;
  readonly name: string;
  readonly amount: number;
  readonly currency: Currency;
}

export interface BlendingDetails {
  readonly oldSalary: number;
  readonly newSalary: number;
  readonly oldDays: number;
  readonly newDays: number;
  readonly totalDays: number;
}

export interface PayrollBreakdown {
  readonly employeeId: string;
  readonly yearMonth: string;
  readonly baseSalary: number;
  readonly proRataAdjustment: number;
  readonly overtimePay: number;
  readonly allowances: readonly AllowanceItem[];
  readonly bonus: number;
  readonly commission: number;
  readonly deficitDeduction: number;
  readonly blendingDetails: BlendingDetails | null;
  readonly transferFees: number;
  readonly netAmount: number;
  readonly currency: Currency;
  readonly jpyEquivalent: number | null;
  readonly exchangeRate: number | null;
  readonly exchangeRateDate: string | null;
}
