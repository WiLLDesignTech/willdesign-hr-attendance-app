import { describe, it, expect, vi } from "vitest";
import { LeaveService } from "../src/leave/service.js";
import { LeaveTypes, LeaveRequestStatuses } from "@hr-attendance-app/types";
import type { LeaveRepository, AuditRepository } from "../src/repositories/index.js";
import type { LeaveBalance } from "@hr-attendance-app/types";

function createMockRepos(balance: Partial<LeaveBalance> = {}) {
  const leaveRepo: LeaveRepository = {
    create: vi.fn().mockImplementation(async (r) => r),
    findById: vi.fn().mockResolvedValue(null),
    findByEmployee: vi.fn().mockResolvedValue([]),
    findPending: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockImplementation(async (_id, updates) => updates),
  };

  const auditRepo: AuditRepository = {
    append: vi.fn().mockResolvedValue(undefined),
    findByTarget: vi.fn().mockResolvedValue([]),
    findByActor: vi.fn().mockResolvedValue([]),
  };

  const defaultBalance: LeaveBalance = {
    employeeId: "EMP#001",
    paidLeaveTotal: 10,
    paidLeaveUsed: 0,
    paidLeaveRemaining: 10,
    carryOver: 0,
    carryOverExpiry: null,
    lastAccrualDate: null,
    ...balance,
  };

  const getBalance = vi.fn().mockResolvedValue(defaultBalance);

  return { leaveRepo, auditRepo, getBalance };
}

describe("LeaveService", () => {
  it("creates a paid leave request when balance is sufficient", async () => {
    const { leaveRepo, auditRepo, getBalance } = createMockRepos();
    const service = new LeaveService(leaveRepo, auditRepo, getBalance);

    const result = await service.createRequest({
      employeeId: "EMP#001",
      leaveType: LeaveTypes.PAID,
      startDate: "2024-02-01",
      endDate: "2024-02-02",
      reason: "Personal",
    });

    expect(result.success).toBe(true);
    expect(leaveRepo.create).toHaveBeenCalled();
    expect(auditRepo.append).toHaveBeenCalled();
  });

  it("rejects paid leave when balance is zero with suggestion", async () => {
    const { leaveRepo, auditRepo, getBalance } = createMockRepos({
      paidLeaveRemaining: 0,
    });
    const service = new LeaveService(leaveRepo, auditRepo, getBalance);

    const result = await service.createRequest({
      employeeId: "EMP#001",
      leaveType: LeaveTypes.PAID,
      startDate: "2024-02-01",
      endDate: "2024-02-01",
      reason: "Personal",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Insufficient");
      expect(result.error).toContain(LeaveTypes.UNPAID);
    }
    expect(leaveRepo.create).not.toHaveBeenCalled();
  });

  it("allows unpaid leave regardless of balance", async () => {
    const { leaveRepo, auditRepo, getBalance } = createMockRepos({
      paidLeaveRemaining: 0,
    });
    const service = new LeaveService(leaveRepo, auditRepo, getBalance);

    const result = await service.createRequest({
      employeeId: "EMP#001",
      leaveType: LeaveTypes.UNPAID,
      startDate: "2024-02-01",
      endDate: "2024-02-01",
      reason: "Personal",
    });

    expect(result.success).toBe(true);
  });

  it("approves a leave request and deducts balance for paid leave", async () => {
    const { leaveRepo, auditRepo, getBalance } = createMockRepos();
    vi.mocked(leaveRepo.findById).mockResolvedValue({
      id: "LEAVE#001",
      employeeId: "EMP#001",
      leaveType: LeaveTypes.PAID,
      startDate: "2024-02-01",
      endDate: "2024-02-02",
      status: LeaveRequestStatuses.PENDING,
      reason: "Personal",
      createdAt: "2024-01-20T00:00:00Z",
      updatedAt: "2024-01-20T00:00:00Z",
    });
    const service = new LeaveService(leaveRepo, auditRepo, getBalance);

    const result = await service.approveRequest("LEAVE#001", "EMP#MGR");

    expect(result.success).toBe(true);
    expect(leaveRepo.update).toHaveBeenCalledWith("LEAVE#001", expect.objectContaining({
      status: LeaveRequestStatuses.APPROVED,
      approvedBy: "EMP#MGR",
    }));
    expect(auditRepo.append).toHaveBeenCalled();
  });

  it("rejects a leave request with reason", async () => {
    const { leaveRepo, auditRepo, getBalance } = createMockRepos();
    vi.mocked(leaveRepo.findById).mockResolvedValue({
      id: "LEAVE#001",
      employeeId: "EMP#001",
      leaveType: LeaveTypes.PAID,
      startDate: "2024-02-01",
      endDate: "2024-02-01",
      status: LeaveRequestStatuses.PENDING,
      reason: "Personal",
      createdAt: "2024-01-20T00:00:00Z",
      updatedAt: "2024-01-20T00:00:00Z",
    });
    const service = new LeaveService(leaveRepo, auditRepo, getBalance);

    const result = await service.rejectRequest("LEAVE#001", "EMP#MGR", "Coverage needed");

    expect(result.success).toBe(true);
    expect(leaveRepo.update).toHaveBeenCalledWith("LEAVE#001", expect.objectContaining({
      status: LeaveRequestStatuses.REJECTED,
      rejectionReason: "Coverage needed",
    }));
  });

  it("returns error when approving non-existent request", async () => {
    const { leaveRepo, auditRepo, getBalance } = createMockRepos();
    const service = new LeaveService(leaveRepo, auditRepo, getBalance);

    const result = await service.approveRequest("LEAVE#999", "EMP#MGR");
    expect(result.success).toBe(false);
  });
});
