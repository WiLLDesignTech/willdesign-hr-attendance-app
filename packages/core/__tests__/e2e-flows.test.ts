import { describe, it, expect, vi, beforeEach } from "vitest";
import { AttendanceService } from "../src/attendance/service";
import { LeaveService } from "../src/leave/service";
import { OnboardingService } from "../src/onboarding/service";
import { shouldGenerateFlag, resolveFlag, applyBankOffset } from "../src/flags/service";
import { calculatePayrollBreakdown } from "../src/payroll/calculator";
import {
  AttendanceStates, AttendanceActions, Roles, FlagLevels, FlagResolutions,
  EmployeeStatuses, EmploymentTypes, LeaveTypes, LeaveRequestStatuses, HOURS, Currencies,
} from "@hr-attendance-app/types";
import type { LeaveBalance } from "@hr-attendance-app/types";

describe("E2E Flow: Slack Attendance → Hours → Flag", () => {
  let attendanceService: AttendanceService;
  let attendanceRepo: Record<string, ReturnType<typeof vi.fn>>;
  let auditRepo: Record<string, ReturnType<typeof vi.fn>>;
  let lockRepo: Record<string, ReturnType<typeof vi.fn>>;
  let employeeRepo: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    attendanceRepo = {
      getState: vi.fn().mockResolvedValue({ employeeId: "EMP#001", state: AttendanceStates.IDLE, lastEventTimestamp: "" }),
      saveState: vi.fn(), saveEvent: vi.fn(),
      getEventsForDate: vi.fn().mockResolvedValue([]),
      getEventsForMonth: vi.fn().mockResolvedValue([]),
      getUnclosedSessions: vi.fn().mockResolvedValue([]),
    };
    auditRepo = { append: vi.fn(), findByTarget: vi.fn().mockResolvedValue([]), findByActor: vi.fn().mockResolvedValue([]) };
    lockRepo = { findByYearMonth: vi.fn().mockResolvedValue([]), save: vi.fn(), delete: vi.fn() };
    employeeRepo = { findById: vi.fn().mockResolvedValue(null), findBySlackId: vi.fn().mockResolvedValue(null), findByManagerId: vi.fn().mockResolvedValue([]), findAll: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn() };
    attendanceService = new AttendanceService(attendanceRepo as never, auditRepo as never, lockRepo as never, employeeRepo as never);
  });

  it("processes clock-in → clock-out → generates shortfall flag for deficit hours", async () => {
    const clockIn = await attendanceService.processEvent({
      employeeId: "EMP#001", action: AttendanceActions.CLOCK_IN,
      timestamp: new Date("2026-04-03T09:00:00Z"), source: "slack", actorId: "EMP#001",
    });
    expect(clockIn.success).toBe(true);

    attendanceRepo.getState.mockResolvedValue({
      employeeId: "EMP#001", state: AttendanceStates.CLOCKED_IN, lastEventTimestamp: "2026-04-03T09:00:00Z",
    });

    const clockOut = await attendanceService.processEvent({
      employeeId: "EMP#001", action: AttendanceActions.CLOCK_OUT,
      timestamp: new Date("2026-04-03T13:00:00Z"), source: "slack", actorId: "EMP#001",
    });
    expect(clockOut.success).toBe(true);

    // 4h worked < 8h daily minimum → shortfall flag
    const flagCheck = shouldGenerateFlag({
      level: FlagLevels.DAILY, workedHours: 4, requiredHours: HOURS.DAILY_MINIMUM,
      hasApprovedLeave: false, hasPreApproval: false,
    });
    expect(flagCheck.shouldFlag).toBe(true);
    expect(flagCheck.deficitHours).toBe(4);
  });

  it("suppresses flag when employee has approved leave", () => {
    const flagCheck = shouldGenerateFlag({
      level: FlagLevels.DAILY, workedHours: 4, requiredHours: HOURS.DAILY_MINIMUM,
      hasApprovedLeave: true, hasPreApproval: false,
    });
    expect(flagCheck.shouldFlag).toBe(false);
  });
});

describe("E2E Flow: Leave Request → Approval", () => {
  it("creates leave request → manager approves", async () => {
    const leaveRepo = {
      create: vi.fn().mockImplementation((r) => Promise.resolve(r)),
      findById: vi.fn(), findByEmployee: vi.fn().mockResolvedValue([]),
      findPending: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockImplementation((_id, updates) => Promise.resolve({ id: "LEAVE#001", ...updates })),
    };
    const auditRepo = { append: vi.fn(), findByTarget: vi.fn().mockResolvedValue([]), findByActor: vi.fn().mockResolvedValue([]) };
    const getBalance = vi.fn().mockResolvedValue({
      employeeId: "EMP#001", paidLeaveTotal: 10, paidLeaveUsed: 0,
      paidLeaveRemaining: 10, carryOver: 0, carryOverExpiry: null, lastAccrualDate: null,
    } satisfies LeaveBalance);

    const leaveService = new LeaveService(leaveRepo as never, auditRepo as never, getBalance);

    const createResult = await leaveService.createRequest({
      employeeId: "EMP#001", leaveType: LeaveTypes.PAID,
      startDate: "2026-04-10", endDate: "2026-04-10", reason: "Personal",
    });
    expect(createResult.success).toBe(true);

    leaveRepo.findById.mockResolvedValue({
      id: "LEAVE#001", employeeId: "EMP#001", leaveType: LeaveTypes.PAID,
      startDate: "2026-04-10", endDate: "2026-04-10",
      status: LeaveRequestStatuses.PENDING, reason: "Personal",
      createdAt: "2026-04-03T00:00:00Z", updatedAt: "2026-04-03T00:00:00Z",
    });

    const approveResult = await leaveService.approveRequest("LEAVE#001", "EMP#MGR");
    expect(approveResult.success).toBe(true);
  });
});

describe("E2E Flow: Onboarding → First Clock-In", () => {
  it("onboards employee then processes first attendance event", async () => {
    const employeeRepo = {
      findById: vi.fn(), findBySlackId: vi.fn(), findByManagerId: vi.fn(), findAll: vi.fn(),
      create: vi.fn().mockImplementation((input) => Promise.resolve({
        id: "EMP#NEW", ...input, status: EmployeeStatuses.ACTIVE,
        createdAt: "2026-04-03T00:00:00Z", updatedAt: "2026-04-03T00:00:00Z",
      })),
      update: vi.fn().mockResolvedValue({}),
    };
    const salaryRepo = { getHistory: vi.fn(), getEffective: vi.fn(), addEntry: vi.fn().mockResolvedValue({}) };
    const authProvider = {
      createUser: vi.fn().mockResolvedValue({ authUserId: "cog-1" }),
      disableUser: vi.fn(), deleteUser: vi.fn(), setTemporaryPassword: vi.fn(), updateAttributes: vi.fn(),
    };
    const auditRepo = { append: vi.fn(), findByTarget: vi.fn().mockResolvedValue([]), findByActor: vi.fn().mockResolvedValue([]) };

    const onboardResult = await new OnboardingService({
      employeeRepo: employeeRepo as never, salaryRepo: salaryRepo as never,
      authProvider: authProvider as never, auditRepo: auditRepo as never,
    }).onboard({
      name: "New Hire", email: "new@example.com", slackId: "U_NEW",
      employmentType: EmploymentTypes.JP_FULL_TIME, region: "JP", timezone: "Asia/Tokyo",
      languagePreference: "ja", managerId: "EMP#MGR", joinDate: "2026-04-01",
      probationEndDate: "2026-07-01", monthlySalary: 300000, currency: Currencies.JPY, role: Roles.EMPLOYEE,
    });
    expect(onboardResult.success).toBe(true);

    const attendanceRepo = {
      getState: vi.fn().mockResolvedValue({ employeeId: "EMP#NEW", state: AttendanceStates.IDLE, lastEventTimestamp: "" }),
      saveState: vi.fn(), saveEvent: vi.fn(),
      getEventsForDate: vi.fn().mockResolvedValue([]),
      getEventsForMonth: vi.fn().mockResolvedValue([]),
      getUnclosedSessions: vi.fn().mockResolvedValue([]),
    };
    const lockRepo2 = { findByYearMonth: vi.fn().mockResolvedValue([]), save: vi.fn(), delete: vi.fn() };
    const employeeRepo2 = { findById: vi.fn().mockResolvedValue(null), findBySlackId: vi.fn().mockResolvedValue(null), findByManagerId: vi.fn().mockResolvedValue([]), findAll: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn() };
    const clockIn = await new AttendanceService(attendanceRepo as never, auditRepo as never, lockRepo2 as never, employeeRepo2 as never).processEvent({
      employeeId: "EMP#NEW", action: AttendanceActions.CLOCK_IN,
      timestamp: new Date("2026-04-03T09:00:00Z"), source: "slack", actorId: "EMP#NEW",
    });
    expect(clockIn.success).toBe(true);
  });
});

describe("E2E Flow: Flag Resolution with Bank Offset", () => {
  it("resolves monthly flag using banked surplus → no salary deduction", () => {
    const resolved = resolveFlag({
      flagId: "FLAG#001", resolution: FlagResolutions.USE_BANK,
      managerId: "EMP#MGR", deficitHours: 5, bankOffsetHours: 5,
    });
    expect(resolved.resolution).toBe(FlagResolutions.USE_BANK);
    expect(resolved.deductionHours).toBe(0);
    expect(resolved.bankHoursUsed).toBe(5);

    const bankEntries = [
      { remainingHours: 10, expiresAt: "2027-01-01T00:00:00Z" },
    ];
    const offset = applyBankOffset(bankEntries, 5, new Date("2026-04-03T00:00:00Z"));
    expect(offset.totalApplied).toBe(5);
    expect(offset.fullyApplied).toBe(true);
  });
});

describe("E2E Flow: Payroll Calculation", () => {
  it("calculates complete payroll breakdown for a month", () => {
    const result = calculatePayrollBreakdown({
      employeeId: "EMP#001", yearMonth: "2026-03",
      baseSalary: 300000, currency: Currencies.JPY,
      overtimeHours: 10, overtimeRate: 1.25, hourlyRateForOvertime: 1875,
      allowances: [{ type: "TRANSPORTATION", name: "Transport", amount: 15000, currency: Currencies.JPY }],
      bonus: 0, commission: 0, deficitHours: 0, monthlyHourlyRate: 1875,
      proRataDays: null, totalDays: 31, exchangeRate: null, exchangeRateDate: null, transferFees: 0,
    });

    expect(result.baseSalary).toBe(300000);
    expect(result.overtimePay).toBeGreaterThan(0);
    expect(result.allowances).toHaveLength(1);
    expect(result.netAmount).toBeGreaterThan(300000);
  });
});
