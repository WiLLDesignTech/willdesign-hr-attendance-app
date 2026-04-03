import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingService } from "../src/onboarding/service";
import { Roles, SalaryChangeTypes, EmployeeStatuses } from "@hr-attendance-app/types";
import type { Employee } from "@hr-attendance-app/types";

describe("OnboardingService", () => {
  let service: OnboardingService;
  let employeeRepo: ReturnType<typeof createMockEmployeeRepo>;
  let salaryRepo: ReturnType<typeof createMockSalaryRepo>;
  let authProvider: ReturnType<typeof createMockAuthProvider>;
  let auditRepo: ReturnType<typeof createMockAuditRepo>;

  function createMockEmployeeRepo() {
    return {
      findById: vi.fn(),
      findBySlackId: vi.fn(),
      findByManagerId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn().mockImplementation((input: unknown) =>
        Promise.resolve({ id: "EMP#NEW001", ...input, status: EmployeeStatuses.ACTIVE, createdAt: "2026-04-03T00:00:00Z", updatedAt: "2026-04-03T00:00:00Z" } as Employee),
      ),
      update: vi.fn().mockResolvedValue({}),
    };
  }

  function createMockSalaryRepo() {
    return {
      getHistory: vi.fn(),
      getEffective: vi.fn(),
      addEntry: vi.fn().mockResolvedValue({}),
    };
  }

  function createMockAuthProvider() {
    return {
      createUser: vi.fn().mockResolvedValue({ authUserId: "cognito-id-001" }),
      disableUser: vi.fn(),
      deleteUser: vi.fn(),
      setTemporaryPassword: vi.fn(),
      updateAttributes: vi.fn(),
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
    salaryRepo = createMockSalaryRepo();
    authProvider = createMockAuthProvider();
    auditRepo = createMockAuditRepo();
    service = new OnboardingService({
      employeeRepo,
      salaryRepo,
      authProvider,
      auditRepo,
    });
  });

  it("creates employee record with all fields", async () => {
    const input = {
      name: "Taro Yamada",
      email: "taro@example.com",
      slackId: "U_TARO",
      employmentType: "FULL_TIME" as const,
      region: "JP" as const,
      timezone: "Asia/Tokyo",
      languagePreference: "ja" as const,
      managerId: "EMP#MGR001",
      joinDate: "2026-04-01",
      probationEndDate: "2026-07-01",
      monthlySalary: 300000,
      currency: "JPY" as const,
      role: Roles.EMPLOYEE,
    };

    const result = await service.onboard(input);

    expect(result.success).toBe(true);
    expect(employeeRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: "Taro Yamada",
      email: "taro@example.com",
      slackId: "U_TARO",
      region: "JP",
    }));
  });

  it("creates Cognito user account", async () => {
    const input = {
      name: "Taro Yamada",
      email: "taro@example.com",
      slackId: "U_TARO",
      employmentType: "FULL_TIME" as const,
      region: "JP" as const,
      timezone: "Asia/Tokyo",
      languagePreference: "ja" as const,
      managerId: null,
      joinDate: "2026-04-01",
      probationEndDate: null,
      monthlySalary: 300000,
      currency: "JPY" as const,
      role: Roles.EMPLOYEE,
    };

    await service.onboard(input);

    expect(authProvider.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: "taro@example.com",
      role: Roles.EMPLOYEE,
    }));
  });

  it("creates initial salary entry with INITIAL change type", async () => {
    const input = {
      name: "Test",
      email: "test@test.com",
      slackId: "U_TEST",
      employmentType: "FULL_TIME" as const,
      region: "JP" as const,
      timezone: "Asia/Tokyo",
      languagePreference: "en" as const,
      managerId: null,
      joinDate: "2026-04-01",
      probationEndDate: null,
      monthlySalary: 250000,
      currency: "JPY" as const,
      role: Roles.EMPLOYEE,
    };

    await service.onboard(input);

    expect(salaryRepo.addEntry).toHaveBeenCalledWith(expect.objectContaining({
      changeType: SalaryChangeTypes.INITIAL,
      amount: 250000,
    }));
  });

  it("logs onboarding in audit trail", async () => {
    const input = {
      name: "Test",
      email: "test@test.com",
      slackId: "U_TEST",
      employmentType: "FULL_TIME" as const,
      region: "JP" as const,
      timezone: "Asia/Tokyo",
      languagePreference: "en" as const,
      managerId: null,
      joinDate: "2026-04-01",
      probationEndDate: null,
      monthlySalary: 250000,
      currency: "JPY" as const,
      role: Roles.EMPLOYEE,
    };

    await service.onboard(input);

    expect(auditRepo.append).toHaveBeenCalled();
  });

  it("rolls back on auth provider failure", async () => {
    authProvider.createUser.mockRejectedValue(new Error("Cognito error"));

    const input = {
      name: "Test",
      email: "test@test.com",
      slackId: "U_TEST",
      employmentType: "FULL_TIME" as const,
      region: "JP" as const,
      timezone: "Asia/Tokyo",
      languagePreference: "en" as const,
      managerId: null,
      joinDate: "2026-04-01",
      probationEndDate: null,
      monthlySalary: 250000,
      currency: "JPY" as const,
      role: Roles.EMPLOYEE,
    };

    const result = await service.onboard(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Cognito error");
    expect(employeeRepo.update).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ status: EmployeeStatuses.INACTIVE }),
    );
  });
});
