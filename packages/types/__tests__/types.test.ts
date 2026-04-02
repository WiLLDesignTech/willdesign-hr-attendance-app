import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  Employee,
  EmploymentType,
  Region,
  EmployeeStatus,
  AttendanceAction,
  AttendanceState,
  AttendanceEvent,
  AttendanceSession,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
  LeaveBalance,
  SalaryRecord,
  SalaryChangeType,
  SalaryType,
  Currency,
  AllowanceItem,
  PayrollBreakdown,
  DailyReport,
  ReportReference,
  Flag,
  FlagLevel,
  FlagResolution,
  BankEntry,
  Holiday,
  AuditEntry,
  AuditSource,
  Role,
  AuthContext,
  ResourceContext,
  SensitivityLevel,
  AuthorizationResult,
  EffectivePolicy,
  HoursPolicy,
  LeavePolicy,
  OvertimePolicy,
  CompensationPolicy,
  ProbationPolicy,
  FlagPolicy,
  RawPolicy,
  Override,
  OverridePeriod,
  Document,
  DocumentVerificationStatus,
  TerminationType,
  OffboardingRecord,
  LegalObligation,
  Result,
  PaymentPolicy,
  ReportPolicy,
} from "@willdesign-hr/types";
import {
  Roles,
  SensitivityLevels,
  AttendanceActions,
  AttendanceStates,
  WorkArrangements,
  TimeTypes,
  TerminationHandlings,
  LeaveRequestStatuses,
  SalaryTypes,
} from "@willdesign-hr/types";

describe("Employee types", () => {
  it("should define all employment types for JP and NP", () => {
    const jpTypes: EmploymentType[] = [
      "JP_FULL_TIME",
      "JP_CONTRACT",
      "JP_OUTSOURCED",
      "JP_PART_TIME",
      "JP_SALES",
      "JP_INTERN",
    ];
    const npTypes: EmploymentType[] = [
      "NP_FULL_TIME",
      "NP_PAID_INTERN",
      "NP_UNPAID_INTERN",
    ];
    expect(jpTypes).toHaveLength(6);
    expect(npTypes).toHaveLength(3);
  });

  it("should define regions", () => {
    const regions: Region[] = ["JP", "NP"];
    expect(regions).toHaveLength(2);
  });

  it("should define employee statuses", () => {
    const statuses: EmployeeStatus[] = ["ACTIVE", "INACTIVE"];
    expect(statuses).toHaveLength(2);
  });

  it("should create a valid employee", () => {
    const emp: Employee = {
      id: "EMP#001",
      name: "Taro Yamada",
      email: "taro@willdesign.com",
      slackId: "U12345",
      employmentType: "JP_FULL_TIME",
      region: "JP",
      timezone: "Asia/Tokyo",
      languagePreference: "ja",
      managerId: "EMP#000",
      status: "ACTIVE",
      joinDate: "2024-01-15",
      probationEndDate: "2024-04-15",
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z",
    };
    expect(emp.id).toBe("EMP#001");
    expect(emp.region).toBe("JP");
  });
});

describe("Attendance types", () => {
  it("should define all actions and states", () => {
    const actions: AttendanceAction[] = [
      AttendanceActions.CLOCK_IN,
      AttendanceActions.CLOCK_OUT,
      AttendanceActions.BREAK_START,
      AttendanceActions.BREAK_END,
    ];
    const states: AttendanceState[] = [AttendanceStates.IDLE, AttendanceStates.CLOCKED_IN, AttendanceStates.ON_BREAK];
    expect(actions).toHaveLength(4);
    expect(states).toHaveLength(3);
  });

  it("should create an attendance event with optional emergency tag", () => {
    const event: AttendanceEvent = {
      id: "ATT#001",
      employeeId: "EMP#001",
      action: AttendanceActions.CLOCK_IN,
      timestamp: "2024-01-15T09:00:00Z",
      source: "slack",
      workLocation: "office",
      isEmergency: false,
    };
    expect(event.action).toBe(AttendanceActions.CLOCK_IN);
    expect(event.isEmergency).toBe(false);
  });
});

describe("Leave types", () => {
  it("should define request statuses", () => {
    const statuses: LeaveRequestStatus[] = [LeaveRequestStatuses.PENDING, LeaveRequestStatuses.APPROVED, LeaveRequestStatuses.REJECTED];
    expect(statuses).toHaveLength(3);
  });

  it("should create a leave request", () => {
    const req: LeaveRequest = {
      id: "LEAVE#001",
      employeeId: "EMP#001",
      leaveType: "PAID",
      startDate: "2024-02-01",
      endDate: "2024-02-02",
      status: LeaveRequestStatuses.PENDING,
      reason: "Personal",
      createdAt: "2024-01-20T00:00:00Z",
      updatedAt: "2024-01-20T00:00:00Z",
    };
    expect(req.status).toBe(LeaveRequestStatuses.PENDING);
  });
});

describe("Payroll types", () => {
  it("should define salary change types", () => {
    const types: SalaryChangeType[] = [
      "INITIAL",
      "PROBATION_END",
      "REVIEW",
      "PROMOTION",
      "ADJUSTMENT",
    ];
    expect(types).toHaveLength(5);
  });

  it("should define currencies", () => {
    const currencies: Currency[] = ["JPY", "NPR"];
    expect(currencies).toHaveLength(2);
  });

  it("should create a salary record with optional agreement link", () => {
    const record: SalaryRecord = {
      id: "SALARY#001",
      employeeId: "EMP#001",
      amount: 300000,
      currency: "JPY",
      salaryType: SalaryTypes.MONTHLY,
      changeType: "INITIAL",
      effectiveFrom: "2024-01-15",
      agreementDocumentId: "DOC#001",
      createdAt: "2024-01-15T00:00:00Z",
    };
    expect(record.agreementDocumentId).toBe("DOC#001");
  });

  it("should create a payroll breakdown", () => {
    const breakdown: PayrollBreakdown = {
      employeeId: "EMP#001",
      yearMonth: "2024-01",
      baseSalary: 300000,
      proRataAdjustment: 0,
      overtimePay: 0,
      allowances: [],
      bonus: 0,
      commission: 0,
      deficitDeduction: 0,
      blendingDetails: null,
      transferFees: 0,
      netAmount: 300000,
      currency: "JPY",
      jpyEquivalent: null,
      exchangeRate: null,
      exchangeRateDate: null,
    };
    expect(breakdown.netAmount).toBe(300000);
  });
});

describe("Report types", () => {
  it("should create a daily report with references", () => {
    const report: DailyReport = {
      id: "REPORT#001",
      employeeId: "EMP#001",
      date: "2024-01-15",
      yesterday: "Worked on feature X",
      today: "Will work on feature Y",
      blockers: "None",
      references: [
        { type: "JIRA", id: "HR-123" },
        { type: "GITHUB_PR", id: "willdesign/hr#45" },
      ],
      version: 1,
      slackMessageTs: "1705312000.000100",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    };
    expect(report.references).toHaveLength(2);
  });
});

describe("Flag types", () => {
  it("should define all flag levels and resolutions", () => {
    const levels: FlagLevel[] = ["DAILY", "WEEKLY", "MONTHLY"];
    const resolutions: FlagResolution[] = [
      "NO_PENALTY",
      "DEDUCT_FULL",
      "USE_BANK",
      "PARTIAL_BANK",
      "DISCUSS",
    ];
    expect(levels).toHaveLength(3);
    expect(resolutions).toHaveLength(5);
  });
});

describe("Banking types", () => {
  it("should create a bank entry with expiry", () => {
    const entry: BankEntry = {
      id: "BANK#001",
      employeeId: "EMP#001",
      surplusHours: 10,
      usedHours: 0,
      remainingHours: 10,
      approvalStatus: LeaveRequestStatuses.PENDING,
      yearMonth: "2024-01",
      expiresAt: "2025-01-31",
      createdAt: "2024-02-01T00:00:00Z",
    };
    expect(entry.remainingHours).toBe(10);
  });
});

describe("Holiday types", () => {
  it("should create a holiday", () => {
    const h: Holiday = {
      id: "HOL#001",
      date: "2024-01-01",
      name: "New Year's Day",
      nameJa: "元日",
      region: "JP",
      year: 2024,
      isSubstitute: false,
    };
    expect(h.region).toBe("JP");
  });
});

describe("Audit types", () => {
  it("should create an audit entry with before/after", () => {
    const entry: AuditEntry = {
      id: "AUDIT#001",
      targetId: "EMP#001",
      targetType: "EMPLOYEE",
      action: "UPDATE",
      actorId: "EMP#000",
      source: "web",
      before: { name: "Old Name" },
      after: { name: "New Name" },
      timestamp: "2024-01-15T12:00:00Z",
    };
    expect(entry.source).toBe("web");
  });
});

describe("Permission types", () => {
  it("should define default roles", () => {
    const roles: Role[] = [
      Roles.EMPLOYEE,
      Roles.MANAGER,
      Roles.HR_MANAGER,
      Roles.ADMIN,
      Roles.SUPER_ADMIN,
    ];
    expect(roles).toHaveLength(5);
  });

  it("should define sensitivity levels", () => {
    const levels: SensitivityLevel[] = [
      SensitivityLevels.PUBLIC,
      SensitivityLevels.INTERNAL,
      SensitivityLevels.SENSITIVE,
      SensitivityLevels.CONFIDENTIAL,
    ];
    expect(levels).toHaveLength(4);
  });

  it("should create auth and resource contexts", () => {
    const auth: AuthContext = {
      actorId: "EMP#001",
      actorRole: Roles.MANAGER,
      actorCustomPermissions: ["leave:approve"],
    };
    const resource: ResourceContext = {
      resourceType: "LEAVE_REQUEST",
      resourceOwnerId: "EMP#002",
      ownerManagerId: "EMP#001",
      sensitivityLevel: SensitivityLevels.INTERNAL,
    };
    expect(auth.actorRole).toBe(Roles.MANAGER);
    expect(resource.sensitivityLevel).toBe(SensitivityLevels.INTERNAL);
  });
});

describe("Policy types", () => {
  it("should define effective policy with all domains", () => {
    const policy: EffectivePolicy = {
      hours: {
        dailyMinimum: 8,
        weeklyMinimum: 40,
        monthlyMinimum: 160,
        workArrangement: WorkArrangements.OFFICE,
        timeType: TimeTypes.FIXED,
        coreHoursStart: "10:00",
        coreHoursEnd: "15:00",
      },
      leave: {
        accrualSchedule: [],
        startConditionMonths: 6,
        annualCap: 20,
        carryOverMonths: 24,
        leaveTypes: ["PAID", "UNPAID"],
        mandatoryUsageDays: 5,
        terminationHandling: TerminationHandlings.LABOR_LAW,
      },
      overtime: {
        deemedHours: 45,
        rates: { standard: 1.25, lateNight: 0.25, holiday: 1.35, excess60h: 1.5 },
        monthlyLimit: 45,
        yearlyLimit: 360,
      },
      compensation: {
        salaryType: SalaryTypes.MONTHLY,
        bonusSchedule: [],
        allowanceTypes: [],
        commissionTracking: false,
      },
      probation: {
        durationMonths: 3,
        leaveAllowed: false,
        noticePeriodDays: 14,
      },
      flags: {
        dailyThreshold: true,
        weeklyThreshold: true,
        monthlyThreshold: true,
        gracePeriodMinutes: 15,
      },
      payment: {
        deadlineDay: 31,
        alertDaysBefore: 5,
        settlementDeadlineDay: 15,
      },
      report: {
        submissionDeadline: "18:00",
        reminderTime: "17:00",
      },
    };
    expect(policy.hours.monthlyMinimum).toBe(160);
    expect(policy.overtime.deemedHours).toBe(45);
  });
});

describe("Document types", () => {
  it("should define verification statuses", () => {
    const statuses: DocumentVerificationStatus[] = [
      "PENDING",
      "VERIFIED",
      "REJECTED",
    ];
    expect(statuses).toHaveLength(3);
  });

  it("should create a document", () => {
    const doc: Document = {
      id: "DOC#001",
      employeeId: "EMP#001",
      fileName: "contract.pdf",
      fileType: "application/pdf",
      s3Key: "documents/EMP#001/contract.pdf",
      verificationStatus: LeaveRequestStatuses.PENDING,
      uploadedAt: "2024-01-15T00:00:00Z",
    };
    expect(doc.verificationStatus).toBe(LeaveRequestStatuses.PENDING);
  });
});

describe("Onboarding/Offboarding types", () => {
  it("should define termination types", () => {
    const types: TerminationType[] = [
      "WITHOUT_CAUSE",
      "FOR_CAUSE",
      "MUTUAL",
      "RESIGNATION",
    ];
    expect(types).toHaveLength(4);
  });

  it("should create an offboarding record", () => {
    const record: OffboardingRecord = {
      employeeId: "EMP#001",
      terminationType: "WITHOUT_CAUSE",
      terminationDate: "2024-06-30",
      noticePeriodBuyout: true,
      buyoutAmount: 300000,
      settlementDeadline: "2024-07-15",
      curePeriodExpiry: null,
      legalObligations: [
        {
          type: "CONFIDENTIALITY",
          description: "2-year NDA",
          expiresAt: "2026-06-30",
        },
      ],
      createdAt: "2024-06-01T00:00:00Z",
    };
    expect(record.noticePeriodBuyout).toBe(true);
    expect(record.legalObligations).toHaveLength(1);
  });
});

describe("Result type", () => {
  it("should create success result", () => {
    const result: Result<string, Error> = {
      success: true,
      data: "hello",
    };
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("hello");
    }
  });

  it("should create error result", () => {
    const result: Result<string, string> = {
      success: false,
      error: "something went wrong",
    };
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("something went wrong");
    }
  });
});

describe("Override types", () => {
  it("should define period types", () => {
    const periods: OverridePeriod[] = ["DAILY", "WEEKLY", "MONTHLY"];
    expect(periods).toHaveLength(3);
  });

  it("should create an override", () => {
    const override: Override = {
      id: "OVR#001",
      employeeId: "EMP#001",
      period: "MONTHLY",
      yearMonth: "2024-02",
      requiredHours: 120,
      reason: "Quota redistribution",
      approvedBy: "EMP#000",
      createdAt: "2024-01-25T00:00:00Z",
    };
    expect(override.requiredHours).toBe(120);
  });
});
