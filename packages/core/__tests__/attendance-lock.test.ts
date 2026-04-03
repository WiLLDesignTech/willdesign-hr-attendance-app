import { describe, it, expect, vi } from "vitest";
import { AttendanceService } from "../src/attendance/service.js";
import { AttendanceActions, AttendanceStates, AttendanceLockScopes, ErrorMessages } from "@hr-attendance-app/types";
import type { AttendanceLock } from "@hr-attendance-app/types";
import type { AttendanceRepository, AuditRepository, AttendanceLockRepository, EmployeeRepository } from "../src/repositories/index.js";

function createMockRepos() {
  const attendanceRepo: AttendanceRepository = {
    getState: vi.fn().mockResolvedValue({
      employeeId: "EMP#001",
      state: AttendanceStates.IDLE,
      lastEventId: null,
      lastEventTimestamp: null,
    }),
    saveState: vi.fn().mockResolvedValue(undefined),
    saveEvent: vi.fn().mockResolvedValue(undefined),
    getEventsForDate: vi.fn().mockResolvedValue([]),
    getEventsForMonth: vi.fn().mockResolvedValue([]),
    getUnclosedSessions: vi.fn().mockResolvedValue([]),
  };

  const auditRepo: AuditRepository = {
    append: vi.fn().mockResolvedValue(undefined),
    findByTarget: vi.fn().mockResolvedValue([]),
    findByActor: vi.fn().mockResolvedValue([]),
  };

  const lockRepo: AttendanceLockRepository = {
    findByYearMonth: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockImplementation(async (lock: AttendanceLock) => lock),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  const employeeRepo: EmployeeRepository = {
    findById: vi.fn().mockResolvedValue({
      id: "EMP#001",
      name: "Test Employee",
      email: "test@test.com",
      slackId: "U001",
      employmentType: "JP_FULL_TIME",
      region: "JP",
      timezone: "Asia/Tokyo",
      languagePreference: "en",
      managerId: null,
      joinDate: "2024-01-01",
      probationEndDate: null,
      status: "ACTIVE",
      authUserId: "cog-1",
      terminationDate: null,
    }),
    findBySlackId: vi.fn().mockResolvedValue(null),
    findByManagerId: vi.fn().mockResolvedValue([]),
    findAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null as never),
    update: vi.fn().mockResolvedValue(null as never),
  };

  return { attendanceRepo, auditRepo, lockRepo, employeeRepo };
}

function makeInput(employeeId = "EMP#001") {
  return {
    employeeId,
    action: AttendanceActions.CLOCK_IN as const,
    timestamp: new Date("2026-03-15T09:00:00Z"),
    source: "web" as const,
    actorId: employeeId,
  };
}

describe("AttendanceService — Lock Enforcement", () => {
  it("rejects event when employee-scope lock matches employee ID", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    vi.mocked(lockRepo.findByYearMonth).mockResolvedValue([
      { id: "lock-1", scope: AttendanceLockScopes.EMPLOYEE, yearMonth: "2026-03", employeeId: "EMP#001", lockedBy: "ADMIN", lockedAt: "2026-03-01T00:00:00Z" },
    ]);

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);
    const result = await service.processEvent(makeInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("2026-03");
      expect(result.error).toContain(AttendanceLockScopes.EMPLOYEE);
    }
  });

  it("rejects event when group-scope lock matches employee employment type", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    vi.mocked(lockRepo.findByYearMonth).mockResolvedValue([
      { id: "lock-1", scope: AttendanceLockScopes.GROUP, yearMonth: "2026-03", groupId: "JP_FULL_TIME", lockedBy: "ADMIN", lockedAt: "2026-03-01T00:00:00Z" },
    ]);

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);
    const result = await service.processEvent(makeInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain(AttendanceLockScopes.GROUP);
    }
  });

  it("rejects event when company-scope lock exists", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    vi.mocked(lockRepo.findByYearMonth).mockResolvedValue([
      { id: "lock-1", scope: AttendanceLockScopes.COMPANY, yearMonth: "2026-03", lockedBy: "ADMIN", lockedAt: "2026-03-01T00:00:00Z" },
    ]);

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);
    const result = await service.processEvent(makeInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain(AttendanceLockScopes.COMPANY);
    }
  });

  it("succeeds when no matching lock exists", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    vi.mocked(lockRepo.findByYearMonth).mockResolvedValue([]);

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);
    const result = await service.processEvent(makeInput());

    expect(result.success).toBe(true);
  });

  it("succeeds when locks exist for a different yearMonth", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    // Lock is for 2026-04, event is for 2026-03
    vi.mocked(lockRepo.findByYearMonth).mockResolvedValue([]);

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);
    const result = await service.processEvent(makeInput());

    expect(result.success).toBe(true);
  });

  it("employee-scope lock blocks even when company is unlocked", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    // Only employee lock, no company lock
    vi.mocked(lockRepo.findByYearMonth).mockResolvedValue([
      { id: "lock-1", scope: AttendanceLockScopes.EMPLOYEE, yearMonth: "2026-03", employeeId: "EMP#001", lockedBy: "ADMIN", lockedAt: "2026-03-01T00:00:00Z" },
    ]);

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);
    const result = await service.processEvent(makeInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain(AttendanceLockScopes.EMPLOYEE);
    }
  });

  it("group-scope lock does not block employee of different group", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    // Lock is for NP_FULL_TIME, but employee is JP_FULL_TIME
    vi.mocked(lockRepo.findByYearMonth).mockResolvedValue([
      { id: "lock-1", scope: AttendanceLockScopes.GROUP, yearMonth: "2026-03", groupId: "NP_FULL_TIME", lockedBy: "ADMIN", lockedAt: "2026-03-01T00:00:00Z" },
    ]);

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);
    const result = await service.processEvent(makeInput());

    expect(result.success).toBe(true);
  });
});

describe("AttendanceService — Lock CRUD", () => {
  it("createLock returns created lock record", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);

    const result = await service.createLock({
      scope: AttendanceLockScopes.COMPANY,
      yearMonth: "2026-03",
      lockedBy: "ADMIN",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scope).toBe(AttendanceLockScopes.COMPANY);
      expect(result.data.yearMonth).toBe("2026-03");
    }
  });

  it("createLock returns conflict error when duplicate exists", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    vi.mocked(lockRepo.save).mockRejectedValue(new Error("ConditionalCheckFailed"));

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);

    const result = await service.createLock({
      scope: AttendanceLockScopes.COMPANY,
      yearMonth: "2026-03",
      lockedBy: "ADMIN",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(ErrorMessages.LOCK_ALREADY_EXISTS);
    }
  });

  it("getLocksForMonth delegates to repository", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    const mockLocks = [
      { id: "lock-1", scope: AttendanceLockScopes.COMPANY, yearMonth: "2026-03", lockedBy: "ADMIN", lockedAt: "2026-03-01T00:00:00Z" },
    ] as AttendanceLock[];
    vi.mocked(lockRepo.findByYearMonth).mockResolvedValue(mockLocks);

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);
    const locks = await service.getLocksForMonth("2026-03");

    expect(locks).toEqual(mockLocks);
    expect(lockRepo.findByYearMonth).toHaveBeenCalledWith("2026-03");
  });

  it("removeLock delegates to repository", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);

    await service.removeLock("2026-03", AttendanceLockScopes.COMPANY);

    expect(lockRepo.delete).toHaveBeenCalledWith("2026-03", AttendanceLockScopes.COMPANY, undefined);
  });

  it("error message includes scope and yearMonth", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    vi.mocked(lockRepo.findByYearMonth).mockResolvedValue([
      { id: "lock-1", scope: AttendanceLockScopes.COMPANY, yearMonth: "2026-03", lockedBy: "ADMIN", lockedAt: "2026-03-01T00:00:00Z" },
    ]);

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);
    const result = await service.processEvent(makeInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Period 2026-03 is locked \(scope: COMPANY\)/);
    }
  });
});
