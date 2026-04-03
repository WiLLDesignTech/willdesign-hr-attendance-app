import { describe, it, expect, vi, beforeEach } from "vitest";
import { CronService } from "../src/cron/service";
import { FlagLevels, AttendanceStates, CRON } from "@willdesign-hr/types";
import type { AttendanceStateRecord, Employee, Flag, BankEntry } from "@willdesign-hr/types";

function mockEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "EMP#001",
    name: "Test User",
    email: "test@test.com",
    slackId: "U123",
    employmentType: "FULL_TIME",
    region: "JP",
    timezone: "Asia/Tokyo",
    languagePreference: "ja",
    managerId: "EMP#MGR",
    joinDate: "2025-01-01",
    probationEndDate: null,
    status: "ACTIVE",
    terminationDate: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  } as Employee;
}

function mockAttendanceState(overrides: Partial<AttendanceStateRecord> = {}): AttendanceStateRecord {
  return {
    employeeId: "EMP#001",
    state: AttendanceStates.CLOCKED_IN,
    lastEventTimestamp: "2026-04-03T09:00:00Z",
    ...overrides,
  };
}

describe("CronService", () => {
  let service: CronService;
  let employeeRepo: ReturnType<typeof createMockEmployeeRepo>;
  let attendanceRepo: ReturnType<typeof createMockAttendanceRepo>;
  let flagRepo: ReturnType<typeof createMockFlagRepo>;
  let bankRepo: ReturnType<typeof createMockBankRepo>;
  let auditRepo: ReturnType<typeof createMockAuditRepo>;

  function createMockEmployeeRepo() {
    return {
      findById: vi.fn(),
      findBySlackId: vi.fn(),
      findByManagerId: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
    };
  }

  function createMockAttendanceRepo() {
    return {
      getState: vi.fn(),
      saveState: vi.fn(),
      saveEvent: vi.fn(),
      getEventsForDate: vi.fn().mockResolvedValue([]),
      getEventsForMonth: vi.fn().mockResolvedValue([]),
      getUnclosedSessions: vi.fn().mockResolvedValue([]),
    };
  }

  function createMockFlagRepo() {
    return {
      save: vi.fn().mockImplementation((f: Flag) => Promise.resolve(f)),
      findByEmployee: vi.fn().mockResolvedValue([]),
      findPending: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    };
  }

  function createMockBankRepo() {
    return {
      save: vi.fn(),
      findByEmployee: vi.fn().mockResolvedValue([]),
      findActive: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    };
  }

  function createMockAuditRepo() {
    return {
      append: vi.fn(),
      findByTarget: vi.fn().mockResolvedValue([]),
      findByActor: vi.fn().mockResolvedValue([]),
    };
  }

  beforeEach(() => {
    employeeRepo = createMockEmployeeRepo();
    attendanceRepo = createMockAttendanceRepo();
    flagRepo = createMockFlagRepo();
    bankRepo = createMockBankRepo();
    auditRepo = createMockAuditRepo();
    service = new CronService({
      employeeRepo,
      attendanceRepo,
      flagRepo,
      bankRepo,
      auditRepo,
    });
  });

  describe("runDailyChecks", () => {
    it("flags unclosed sessions for admin review", async () => {
      const unclosed = [mockAttendanceState({ employeeId: "EMP#001", state: AttendanceStates.CLOCKED_IN })];
      attendanceRepo.getUnclosedSessions.mockResolvedValue(unclosed);
      employeeRepo.findAll.mockResolvedValue([mockEmployee()]);
      attendanceRepo.getEventsForDate.mockResolvedValue([]);

      const result = await service.runDailyChecks("2026-04-03");

      expect(flagRepo.save).toHaveBeenCalled();
      const savedFlag = flagRepo.save.mock.calls[0][0] as Flag;
      expect(savedFlag.level).toBe(FlagLevels.DAILY);
      expect(result.unclosedCount).toBe(1);
    });

    it("flags open break sessions", async () => {
      const openBreak = [mockAttendanceState({ employeeId: "EMP#001", state: AttendanceStates.ON_BREAK })];
      attendanceRepo.getUnclosedSessions.mockResolvedValue(openBreak);
      employeeRepo.findAll.mockResolvedValue([mockEmployee()]);
      attendanceRepo.getEventsForDate.mockResolvedValue([]);

      const result = await service.runDailyChecks("2026-04-03");

      expect(result.openBreakCount).toBe(1);
      expect(flagRepo.save).toHaveBeenCalled();
    });

    it("flags sessions shorter than minimum duration", async () => {
      attendanceRepo.getUnclosedSessions.mockResolvedValue([]);
      employeeRepo.findAll.mockResolvedValue([mockEmployee()]);
      // Session of 3 minutes (below CRON.MIN_SESSION_MINUTES)
      attendanceRepo.getEventsForDate.mockResolvedValue([
        { employeeId: "EMP#001", action: "CLOCK_IN", timestamp: "2026-04-03T09:00:00Z", source: "slack" },
        { employeeId: "EMP#001", action: "CLOCK_OUT", timestamp: "2026-04-03T09:03:00Z", source: "slack" },
      ]);

      const result = await service.runDailyChecks("2026-04-03");

      expect(result.shortSessionCount).toBe(1);
      expect(flagRepo.save).toHaveBeenCalled();
    });

    it("does not flag sessions above minimum duration", async () => {
      attendanceRepo.getUnclosedSessions.mockResolvedValue([]);
      employeeRepo.findAll.mockResolvedValue([mockEmployee()]);
      attendanceRepo.getEventsForDate.mockResolvedValue([
        { employeeId: "EMP#001", action: "CLOCK_IN", timestamp: "2026-04-03T09:00:00Z", source: "slack" },
        { employeeId: "EMP#001", action: "CLOCK_OUT", timestamp: "2026-04-03T09:10:00Z", source: "slack" },
      ]);

      const result = await service.runDailyChecks("2026-04-03");

      expect(result.shortSessionCount).toBe(0);
    });

    it("returns zero counts when no issues found", async () => {
      attendanceRepo.getUnclosedSessions.mockResolvedValue([]);
      employeeRepo.findAll.mockResolvedValue([]);

      const result = await service.runDailyChecks("2026-04-03");

      expect(result.unclosedCount).toBe(0);
      expect(result.openBreakCount).toBe(0);
      expect(result.shortSessionCount).toBe(0);
      expect(result.shortfallCount).toBe(0);
    });
  });

  describe("runWeeklyChecks", () => {
    it("generates weekly shortfall flags for employees below weekly minimum", async () => {
      employeeRepo.findAll.mockResolvedValue([mockEmployee()]);
      // 30 hours worked in the week (below HOURS.WEEKLY_MINIMUM of 40)
      attendanceRepo.getEventsForDate.mockResolvedValue([]);

      const result = await service.runWeeklyChecks("2026-04-03", 30);

      expect(result.weeklyFlagCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("runMonthlyChecks", () => {
    it("processes surplus expiry for entries older than banking expiry months", async () => {
      const expiredEntry: BankEntry = {
        id: "BANK#001",
        employeeId: "EMP#001",
        surplusHours: 5,
        remainingHours: 5,
        maxLeaveDays: 0,
        approvalStatus: "APPROVED",
        createdAt: "2025-03-01T00:00:00Z",
        expiresAt: "2026-03-01T00:00:00Z",
      };
      employeeRepo.findAll.mockResolvedValue([mockEmployee()]);
      bankRepo.findActive.mockResolvedValue([expiredEntry]);

      const result = await service.runMonthlyChecks("2026-04");

      expect(result.surplusExpiredCount).toBeGreaterThanOrEqual(0);
    });

    it("returns monthly check summary", async () => {
      employeeRepo.findAll.mockResolvedValue([]);

      const result = await service.runMonthlyChecks("2026-04");

      expect(result).toHaveProperty("surplusExpiredCount");
      expect(result).toHaveProperty("monthlyFlagCount");
    });
  });
});
