import { describe, it, expect, vi } from "vitest";
import { AttendanceService } from "../src/attendance/service.js";
import { AttendanceActions, AttendanceStates } from "@hr-attendance-app/types";
import type { AttendanceRepository, AuditRepository, AttendanceLockRepository, EmployeeRepository } from "../src/repositories/index.js";

function createMockRepos() {
  const events: unknown[] = [];
  const auditEntries: unknown[] = [];

  const attendanceRepo: AttendanceRepository = {
    getState: vi.fn().mockResolvedValue({
      employeeId: "EMP#001",
      state: AttendanceStates.IDLE,
      lastEventId: null,
      lastEventTimestamp: null,
    }),
    saveState: vi.fn().mockResolvedValue(undefined),
    saveEvent: vi.fn().mockImplementation(async (e) => { events.push(e); }),
    getEventsForDate: vi.fn().mockResolvedValue([]),
    getEventsForMonth: vi.fn().mockResolvedValue([]),
    getUnclosedSessions: vi.fn().mockResolvedValue([]),
  };

  const auditRepo: AuditRepository = {
    append: vi.fn().mockImplementation(async (e) => { auditEntries.push(e); }),
    findByTarget: vi.fn().mockResolvedValue([]),
    findByActor: vi.fn().mockResolvedValue([]),
  };

  const lockRepo: AttendanceLockRepository = {
    findByYearMonth: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  const employeeRepo: EmployeeRepository = {
    findById: vi.fn().mockResolvedValue(null),
    findBySlackId: vi.fn().mockResolvedValue(null),
    findByManagerId: vi.fn().mockResolvedValue([]),
    findAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null as never),
    update: vi.fn().mockResolvedValue(null as never),
  };

  return { attendanceRepo, auditRepo, lockRepo, employeeRepo, events, auditEntries };
}

describe("AttendanceService", () => {
  it("processes a valid clock-in event", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);

    const result = await service.processEvent({
      employeeId: "EMP#001",
      action: AttendanceActions.CLOCK_IN,
      timestamp: new Date("2024-01-15T09:00:00Z"),
      source: "slack",
      actorId: "EMP#001",
    });

    expect(result.success).toBe(true);
    expect(attendanceRepo.saveEvent).toHaveBeenCalled();
    expect(attendanceRepo.saveState).toHaveBeenCalled();
    expect(auditRepo.append).toHaveBeenCalled();
  });

  it("rejects invalid transition", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    // Already IDLE, trying to clock out
    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);

    const result = await service.processEvent({
      employeeId: "EMP#001",
      action: AttendanceActions.CLOCK_OUT,
      timestamp: new Date("2024-01-15T09:00:00Z"),
      source: "slack",
      actorId: "EMP#001",
    });

    expect(result.success).toBe(false);
    expect(attendanceRepo.saveEvent).not.toHaveBeenCalled();
  });

  it("enforces 60-second idempotency window", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    vi.mocked(attendanceRepo.getState).mockResolvedValue({
      employeeId: "EMP#001",
      state: AttendanceStates.IDLE,
      lastEventId: "ATT#prev",
      lastEventTimestamp: "2024-01-15T09:00:00Z",
    });

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);

    const result = await service.processEvent({
      employeeId: "EMP#001",
      action: AttendanceActions.CLOCK_IN,
      timestamp: new Date("2024-01-15T09:00:30Z"), // 30s later — within window
      source: "slack",
      actorId: "EMP#001",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("idempotency");
  });

  it("allows event at exact boundary (60s)", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    vi.mocked(attendanceRepo.getState).mockResolvedValue({
      employeeId: "EMP#001",
      state: AttendanceStates.IDLE,
      lastEventId: "ATT#prev",
      lastEventTimestamp: "2024-01-15T09:00:00Z",
    });

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);

    const result = await service.processEvent({
      employeeId: "EMP#001",
      action: AttendanceActions.CLOCK_IN,
      timestamp: new Date("2024-01-15T09:01:00Z"), // exactly 60s
      source: "slack",
      actorId: "EMP#001",
    });

    expect(result.success).toBe(true);
  });

  it("rejects event with past timestamp", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    vi.mocked(attendanceRepo.getState).mockResolvedValue({
      employeeId: "EMP#001",
      state: AttendanceStates.IDLE,
      lastEventId: "ATT#prev",
      lastEventTimestamp: "2024-01-15T09:00:00Z",
    });

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);

    const result = await service.processEvent({
      employeeId: "EMP#001",
      action: AttendanceActions.CLOCK_IN,
      timestamp: new Date("2024-01-15T08:50:00Z"), // before last event
      source: "slack",
      actorId: "EMP#001",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("before");
  });

  it("allows event after idempotency window expires", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    vi.mocked(attendanceRepo.getState).mockResolvedValue({
      employeeId: "EMP#001",
      state: AttendanceStates.IDLE,
      lastEventId: "ATT#prev",
      lastEventTimestamp: "2024-01-15T09:00:00Z",
    });

    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);

    const result = await service.processEvent({
      employeeId: "EMP#001",
      action: AttendanceActions.CLOCK_IN,
      timestamp: new Date("2024-01-15T09:02:00Z"), // 2 min later — outside window
      source: "slack",
      actorId: "EMP#001",
    });

    expect(result.success).toBe(true);
  });

  it("tracks work location when provided", async () => {
    const { attendanceRepo, auditRepo, lockRepo, employeeRepo } = createMockRepos();
    const service = new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo);

    await service.processEvent({
      employeeId: "EMP#001",
      action: AttendanceActions.CLOCK_IN,
      timestamp: new Date("2024-01-15T09:00:00Z"),
      source: "web",
      actorId: "EMP#001",
      workLocation: "office",
    });

    const savedEvent = vi.mocked(attendanceRepo.saveEvent).mock.calls[0]?.[0];
    expect(savedEvent?.workLocation).toBe("office");
  });
});
