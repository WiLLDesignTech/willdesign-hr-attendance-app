import type { LeaveRequest, LeaveBalance, LeaveType, Result } from "@willdesign-hr/types";
import { LeaveTypes, LeaveRequestStatuses, AuditActions, AuditSources, KeyPatterns, KeyPrefixes, nowIso } from "@willdesign-hr/types";
import type { LeaveRepository, AuditRepository } from "../repositories/index.js";

export interface CreateLeaveRequestInput {
  readonly employeeId: string;
  readonly leaveType: LeaveType;
  readonly startDate: string;
  readonly endDate: string;
  readonly reason: string;
}

const BALANCE_REQUIRED_TYPES: ReadonlySet<string> = new Set([
  LeaveTypes.PAID,
]);

export class LeaveService {
  constructor(
    private readonly leaveRepo: LeaveRepository,
    private readonly auditRepo: AuditRepository,
    private readonly getBalance: (employeeId: string) => Promise<LeaveBalance>,
  ) {}

  async createRequest(input: CreateLeaveRequestInput): Promise<Result<LeaveRequest, string>> {
    if (BALANCE_REQUIRED_TYPES.has(input.leaveType)) {
      const balance = await this.getBalance(input.employeeId);
      const days = countDays(input.startDate, input.endDate);

      if (balance.paidLeaveRemaining < days) {
        return {
          success: false,
          error: `Insufficient paid leave balance (${balance.paidLeaveRemaining} remaining, ${days} requested). Consider ${LeaveTypes.UNPAID} or ${LeaveTypes.SHIFT_PERMISSION} instead.`,
        };
      }
    }

    const now = nowIso();
    const request: LeaveRequest = {
      id: KeyPatterns.leave(input.employeeId, input.startDate),
      employeeId: input.employeeId,
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
      status: LeaveRequestStatuses.PENDING,
      reason: input.reason,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.leaveRepo.create(request);

    await this.auditRepo.append({
      id: KeyPatterns.audit(request.id),
      targetId: input.employeeId,
      targetType: KeyPrefixes.LEAVE,
      action: AuditActions.CREATE,
      actorId: input.employeeId,
      source: AuditSources.WEB,
      before: null,
      after: { leaveRequest: request },
      timestamp: now,
    });

    return { success: true, data: created };
  }

  async approveRequest(requestId: string, managerId: string): Promise<Result<LeaveRequest, string>> {
    const request = await this.leaveRepo.findById(requestId);
    if (!request) {
      return { success: false, error: `Leave request ${requestId} not found` };
    }

    const now = nowIso();
    const updated = await this.leaveRepo.update(requestId, {
      status: LeaveRequestStatuses.APPROVED,
      approvedBy: managerId,
      updatedAt: now,
    });

    await this.auditRepo.append({
      id: KeyPatterns.auditAction(AuditActions.APPROVE, requestId),
      targetId: request.employeeId,
      targetType: KeyPrefixes.LEAVE,
      action: AuditActions.APPROVE,
      actorId: managerId,
      source: AuditSources.WEB,
      before: { status: request.status },
      after: { status: LeaveRequestStatuses.APPROVED },
      timestamp: now,
    });

    return { success: true, data: updated };
  }

  async findRequests(employeeId: string, options?: { status?: LeaveRequest["status"] }): Promise<readonly LeaveRequest[]> {
    return this.leaveRepo.findByEmployee(employeeId, options);
  }

  async findPending(): Promise<readonly LeaveRequest[]> {
    return this.leaveRepo.findPending();
  }

  async getLeaveBalance(employeeId: string): Promise<LeaveBalance> {
    return this.getBalance(employeeId);
  }

  async rejectRequest(requestId: string, managerId: string, reason: string): Promise<Result<LeaveRequest, string>> {
    const request = await this.leaveRepo.findById(requestId);
    if (!request) {
      return { success: false, error: `Leave request ${requestId} not found` };
    }

    const now = nowIso();
    const updated = await this.leaveRepo.update(requestId, {
      status: LeaveRequestStatuses.REJECTED,
      rejectionReason: reason,
      updatedAt: now,
    });

    await this.auditRepo.append({
      id: KeyPatterns.auditAction(AuditActions.REJECT, requestId),
      targetId: request.employeeId,
      targetType: KeyPrefixes.LEAVE,
      action: AuditActions.REJECT,
      actorId: managerId,
      source: AuditSources.WEB,
      before: { status: request.status },
      after: { status: LeaveRequestStatuses.REJECTED, rejectionReason: reason },
      timestamp: now,
    });

    return { success: true, data: updated };
  }
}

function countDays(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}
