import { describe, it, expect, vi, beforeEach } from "vitest";
import { OffboardingService } from "../src/onboarding/offboarding";
import { TerminationTypes, EmployeeStatuses, PAYMENT } from "@willdesign-hr/types";
import type { Employee } from "@willdesign-hr/types";

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
    status: EmployeeStatuses.ACTIVE,
    terminationDate: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  } as Employee;
}

describe("OffboardingService", () => {
  let service: OffboardingService;
  let employeeRepo: ReturnType<typeof createMocks>["employeeRepo"];
  let salaryRepo: ReturnType<typeof createMocks>["salaryRepo"];
  let authProvider: ReturnType<typeof createMocks>["authProvider"];
  let auditRepo: ReturnType<typeof createMocks>["auditRepo"];

  function createMocks() {
    return {
      employeeRepo: {
        findById: vi.fn().mockResolvedValue(mockEmployee()),
        findBySlackId: vi.fn(),
        findByManagerId: vi.fn(),
        findAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn().mockImplementation((_id: string, updates: Partial<Employee>) =>
          Promise.resolve({ ...mockEmployee(), ...updates }),
        ),
      },
      salaryRepo: {
        getHistory: vi.fn(),
        getEffective: vi.fn().mockResolvedValue({
          id: "SAL#001",
          employeeId: "EMP#001",
          amount: 300000,
          currency: "JPY",
          salaryType: "MONTHLY",
          changeType: "INITIAL",
          effectiveFrom: "2025-01-01",
          createdAt: "2025-01-01T00:00:00Z",
        }),
        addEntry: vi.fn(),
      },
      authProvider: {
        createUser: vi.fn(),
        disableUser: vi.fn(),
        deleteUser: vi.fn(),
        setTemporaryPassword: vi.fn(),
        updateAttributes: vi.fn(),
      },
      auditRepo: {
        append: vi.fn(),
        findByTarget: vi.fn().mockResolvedValue([]),
        findByActor: vi.fn().mockResolvedValue([]),
      },
    };
  }

  beforeEach(() => {
    const mocks = createMocks();
    employeeRepo = mocks.employeeRepo;
    salaryRepo = mocks.salaryRepo;
    authProvider = mocks.authProvider;
    auditRepo = mocks.auditRepo;
    service = new OffboardingService({
      employeeRepo: employeeRepo as never,
      salaryRepo: salaryRepo as never,
      authProvider: authProvider as never,
      auditRepo: auditRepo as never,
    });
  });

  it("generates settlement preview with pro-rata salary", async () => {
    const preview = await service.getSettlementPreview("EMP#001", "2026-04-15");

    expect(preview).toHaveProperty("proRataSalary");
    expect(preview.proRataSalary).toBeGreaterThan(0);
  });

  it("calculates buyout amount as one month service fee", async () => {
    const preview = await service.getSettlementPreview("EMP#001", "2026-04-15");

    expect(preview.buyoutAmount).toBe(300000);
  });

  it("deactivates employee and disables Cognito on offboard", async () => {
    const result = await service.offboard({
      employeeId: "EMP#001",
      terminationType: TerminationTypes.WITHOUT_CAUSE,
      terminationDate: "2026-04-30",
      noticePeriodBuyout: false,
      exitNotes: "Knowledge transfer complete",
    });

    expect(result.success).toBe(true);
    expect(employeeRepo.update).toHaveBeenCalledWith("EMP#001", expect.objectContaining({
      status: EmployeeStatuses.INACTIVE,
    }));
    expect(authProvider.disableUser).toHaveBeenCalled();
  });

  it("tracks legal obligations with correct expiry dates", async () => {
    const result = await service.offboard({
      employeeId: "EMP#001",
      terminationType: TerminationTypes.WITHOUT_CAUSE,
      terminationDate: "2026-04-30",
      noticePeriodBuyout: false,
      exitNotes: null,
    });

    expect(result.success).toBe(true);
    expect(result.legalObligations).toHaveLength(2);
    const confidentiality = result.legalObligations!.find(o => o.type === "CONFIDENTIALITY");
    const nonCompete = result.legalObligations!.find(o => o.type === "NON_COMPETE");
    expect(confidentiality).toBeDefined();
    expect(nonCompete).toBeDefined();
  });

  it("sets cure period expiry for FOR_CAUSE termination", async () => {
    const result = await service.offboard({
      employeeId: "EMP#001",
      terminationType: TerminationTypes.FOR_CAUSE,
      terminationDate: "2026-04-30",
      noticePeriodBuyout: false,
      exitNotes: null,
    });

    expect(result.curePeriodExpiry).toBeDefined();
  });

  it("logs offboarding in audit trail", async () => {
    await service.offboard({
      employeeId: "EMP#001",
      terminationType: TerminationTypes.RESIGNATION,
      terminationDate: "2026-04-30",
      noticePeriodBuyout: false,
      exitNotes: null,
    });

    expect(auditRepo.append).toHaveBeenCalled();
  });
});
