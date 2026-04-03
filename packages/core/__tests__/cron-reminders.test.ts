import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReminderService } from "../src/cron/reminders";
import { CRON, PROBATION, PAYMENT } from "@hr-attendance-app/types";
import type { Employee, LeaveRequest, BankEntry } from "@hr-attendance-app/types";

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

describe("ReminderService", () => {
  let service: ReminderService;
  let employeeRepo: { findAll: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn> };
  let leaveRepo: { findPending: ReturnType<typeof vi.fn> };
  let bankRepo: { findActive: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    employeeRepo = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
    };
    leaveRepo = {
      findPending: vi.fn().mockResolvedValue([]),
    };
    bankRepo = {
      findActive: vi.fn().mockResolvedValue([]),
    };
    service = new ReminderService({
      employeeRepo: employeeRepo as never,
      leaveRepo: leaveRepo as never,
      bankRepo: bankRepo as never,
    });
  });

  describe("checkPendingLeaveReminders", () => {
    it("returns reminders for leave requests older than threshold", async () => {
      const oldRequest = {
        id: "LEAVE#001",
        employeeId: "EMP#001",
        type: "PAID",
        startDate: "2026-04-10",
        endDate: "2026-04-10",
        status: "PENDING",
        createdAt: "2026-04-01T00:00:00Z",
      };
      leaveRepo.findPending.mockResolvedValue([oldRequest]);
      employeeRepo.findById.mockResolvedValue(mockEmployee());

      const now = new Date("2026-04-03T00:00:00Z");
      const result = await service.checkPendingLeaveReminders(now);

      expect(result.length).toBe(1);
      expect(result[0].leaveRequestId).toBe("LEAVE#001");
      expect(result[0].managerId).toBe("EMP#MGR");
    });

    it("skips recent leave requests", async () => {
      const recentRequest = {
        id: "LEAVE#002",
        employeeId: "EMP#001",
        type: "PAID",
        startDate: "2026-04-10",
        endDate: "2026-04-10",
        status: "PENDING",
        createdAt: "2026-04-02T23:00:00Z",
      };
      leaveRepo.findPending.mockResolvedValue([recentRequest]);

      const now = new Date("2026-04-03T00:00:00Z");
      const result = await service.checkPendingLeaveReminders(now);

      expect(result.length).toBe(0);
    });
  });

  describe("checkSurplusExpiryWarnings", () => {
    it("returns warnings for entries expiring within threshold", async () => {
      const expiringSoon: BankEntry = {
        id: "BANK#001",
        employeeId: "EMP#001",
        surplusHours: 10,
        remainingHours: 10,
        maxLeaveDays: 0,
        approvalStatus: "APPROVED",
        createdAt: "2025-04-01T00:00:00Z",
        expiresAt: "2026-04-20T00:00:00Z",
      };
      employeeRepo.findAll.mockResolvedValue([mockEmployee()]);
      bankRepo.findActive.mockResolvedValue([expiringSoon]);

      const now = new Date("2026-04-03T00:00:00Z");
      const result = await service.checkSurplusExpiryWarnings(now);

      expect(result.length).toBe(1);
      expect(result[0].employeeId).toBe("EMP#001");
    });

    it("skips entries not expiring soon", async () => {
      const farFuture: BankEntry = {
        id: "BANK#002",
        employeeId: "EMP#001",
        surplusHours: 10,
        remainingHours: 10,
        maxLeaveDays: 0,
        approvalStatus: "APPROVED",
        createdAt: "2025-04-01T00:00:00Z",
        expiresAt: "2027-01-01T00:00:00Z",
      };
      employeeRepo.findAll.mockResolvedValue([mockEmployee()]);
      bankRepo.findActive.mockResolvedValue([farFuture]);

      const now = new Date("2026-04-03T00:00:00Z");
      const result = await service.checkSurplusExpiryWarnings(now);

      expect(result.length).toBe(0);
    });
  });

  describe("checkProbationAlerts", () => {
    it("returns alerts for employees with probation ending within threshold", async () => {
      const emp = mockEmployee({ probationEndDate: "2026-04-15" });
      employeeRepo.findAll.mockResolvedValue([emp]);

      const now = new Date("2026-04-03T00:00:00Z");
      const result = await service.checkProbationAlerts(now);

      expect(result.length).toBe(1);
      expect(result[0].employeeId).toBe("EMP#001");
      expect(result[0].managerId).toBe("EMP#MGR");
    });

    it("skips employees with no probation or far-future probation", async () => {
      const noProbation = mockEmployee({ probationEndDate: null });
      const farProbation = mockEmployee({ id: "EMP#002", probationEndDate: "2026-06-01" });
      employeeRepo.findAll.mockResolvedValue([noProbation, farProbation]);

      const now = new Date("2026-04-03T00:00:00Z");
      const result = await service.checkProbationAlerts(now);

      expect(result.length).toBe(0);
    });
  });
});
