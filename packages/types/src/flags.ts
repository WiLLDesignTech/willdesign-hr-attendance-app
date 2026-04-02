export type FlagLevel = "DAILY" | "WEEKLY" | "MONTHLY";

export type FlagResolution =
  | "NO_PENALTY"
  | "DEDUCT_FULL"
  | "USE_BANK"
  | "PARTIAL_BANK"
  | "DISCUSS";

export type FlagStatus = "PENDING" | "RESOLVED";

export interface Flag {
  readonly id: string;
  readonly employeeId: string;
  readonly level: FlagLevel;
  readonly period: string;
  readonly deficitHours: number;
  readonly status: FlagStatus;
  readonly resolution?: FlagResolution;
  readonly resolvedBy?: string;
  readonly bankOffsetHours?: number;
  readonly createdAt: string;
  readonly resolvedAt?: string;
}
