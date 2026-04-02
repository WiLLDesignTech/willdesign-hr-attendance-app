export type OverridePeriod = "DAILY" | "WEEKLY" | "MONTHLY";

export interface Override {
  readonly id: string;
  readonly employeeId: string;
  readonly period: OverridePeriod;
  readonly yearMonth: string;
  readonly requiredHours: number;
  readonly reason: string;
  readonly approvedBy: string;
  readonly createdAt: string;
}

export interface QuotaPlan {
  readonly employeeId: string;
  readonly months: readonly QuotaMonth[];
  readonly totalHours: number;
  readonly approvedBy: string;
  readonly createdAt: string;
}

export interface QuotaMonth {
  readonly yearMonth: string;
  readonly requiredHours: number;
}
