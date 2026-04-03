import type { LeaveRequest, LeaveRequestStatus } from "@hr-attendance-app/types";

export interface LeaveQueryOptions {
  readonly status?: LeaveRequestStatus;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface LeaveRepository {
  create(request: LeaveRequest): Promise<LeaveRequest>;
  findById(id: string): Promise<LeaveRequest | null>;
  findByEmployee(employeeId: string, options?: LeaveQueryOptions): Promise<readonly LeaveRequest[]>;
  findPending(): Promise<readonly LeaveRequest[]>;
  update(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest>;
}
