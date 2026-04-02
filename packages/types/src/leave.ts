export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type LeaveType =
  | "PAID"
  | "UNPAID"
  | "SHIFT_PERMISSION"
  | "CREDITED_ABSENCE"
  | "BEREAVEMENT"
  | "MATERNITY"
  | "NURSING"
  | "MENSTRUAL"
  | "COMPANY_SPECIFIC";

export interface LeaveRequest {
  readonly id: string;
  readonly employeeId: string;
  readonly leaveType: LeaveType;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: LeaveRequestStatus;
  readonly reason: string;
  readonly approvedBy?: string;
  readonly rejectionReason?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LeaveBalance {
  readonly employeeId: string;
  readonly paidLeaveTotal: number;
  readonly paidLeaveUsed: number;
  readonly paidLeaveRemaining: number;
  readonly carryOver: number;
  readonly carryOverExpiry: string | null;
  readonly lastAccrualDate: string | null;
}

export interface LeaveAccrualRule {
  readonly tenureMonths: number;
  readonly daysGranted: number;
}
