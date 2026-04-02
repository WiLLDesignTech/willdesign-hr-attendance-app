export type BankApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BankEntry {
  readonly id: string;
  readonly employeeId: string;
  readonly surplusHours: number;
  readonly usedHours: number;
  readonly remainingHours: number;
  readonly approvalStatus: BankApprovalStatus;
  readonly yearMonth: string;
  readonly expiresAt: string;
  readonly createdAt: string;
}
