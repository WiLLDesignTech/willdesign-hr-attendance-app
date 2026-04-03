import { describe, it, expect } from "vitest";
import type {
  Employee, EmploymentType, Region, EmployeeStatus,
  AttendanceAction, AttendanceState, AttendanceEvent,
  LeaveRequest, LeaveRequestStatus, LeaveType, SalaryRecord, SalaryChangeType, Currency,
  PayrollBreakdown, DailyReport, Flag, FlagLevel, FlagResolution, BankEntry, Holiday,
  AuditEntry, Role, AuthContext, ResourceContext, SensitivityLevel,
  EffectivePolicy, Override, OverridePeriod, Document, DocumentVerificationStatus,
  TerminationType, OffboardingRecord, Result,
} from "@hr-attendance-app/types";
import {
  Roles, SensitivityLevels, EmploymentTypes, EmployeeStatuses, Regions,
  AttendanceActions, AttendanceStates, LeaveTypes, LeaveRequestStatuses,
  SalaryTypes, SalaryChangeTypes, Currencies, FlagLevels, FlagResolutions,
  TerminationTypes, DocumentVerificationStatuses, AuditActions, ReferenceTypes,
  WorkArrangements, TimeTypes, TerminationHandlings, JP_LABOR, HOURS, PROBATION, PAYMENT,
} from "@hr-attendance-app/types";

describe("Employee types", () => {
  it("should define all employment types for JP and NP", () => {
    const jpTypes: EmploymentType[] = [
      EmploymentTypes.JP_FULL_TIME, EmploymentTypes.JP_CONTRACT,
      EmploymentTypes.JP_OUTSOURCED, EmploymentTypes.JP_PART_TIME,
      EmploymentTypes.JP_SALES, EmploymentTypes.JP_INTERN,
    ];
    const npTypes: EmploymentType[] = [
      EmploymentTypes.NP_FULL_TIME, EmploymentTypes.NP_PAID_INTERN, EmploymentTypes.NP_UNPAID_INTERN,
    ];
    expect(jpTypes).toHaveLength(6);
    expect(npTypes).toHaveLength(3);
  });

  it("should define regions", () => {
    const regions: Region[] = [Regions.JP, Regions.NP];
    expect(regions).toHaveLength(2);
  });

  it("should define employee statuses", () => {
    const statuses: EmployeeStatus[] = [EmployeeStatuses.ACTIVE, EmployeeStatuses.INACTIVE];
    expect(statuses).toHaveLength(2);
  });

  it("should create a valid employee", () => {
    const emp: Employee = {
      id: "EMP#001",
      name: "Taro Yamada",
      email: "taro@example.com",
      slackId: "U12345",
      employmentType: EmploymentTypes.JP_FULL_TIME,
      region: Regions.JP,
      timezone: "Asia/Tokyo",
      languagePreference: "ja",
      managerId: "EMP#000",
      status: EmployeeStatuses.ACTIVE,
      joinDate: "2024-01-15",
      probationEndDate: "2024-04-15",
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z",
    };
    expect(emp.id).toBe("EMP#001");
    expect(emp.region).toBe(Regions.JP);
  });
});

describe("Attendance types", () => {
  it("should define all actions and states", () => {
    const actions: AttendanceAction[] = [
      AttendanceActions.CLOCK_IN, AttendanceActions.CLOCK_OUT,
      AttendanceActions.BREAK_START, AttendanceActions.BREAK_END,
    ];
    const states: AttendanceState[] = [
      AttendanceStates.IDLE, AttendanceStates.CLOCKED_IN, AttendanceStates.ON_BREAK,
    ];
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
    const statuses: LeaveRequestStatus[] = [
      LeaveRequestStatuses.PENDING, LeaveRequestStatuses.APPROVED, LeaveRequestStatuses.REJECTED,
    ];
    expect(statuses).toHaveLength(3);
  });

  it("should create a leave request", () => {
    const req: LeaveRequest = {
      id: "LEAVE#001",
      employeeId: "EMP#001",
      leaveType: LeaveTypes.PAID,
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
      SalaryChangeTypes.INITIAL, SalaryChangeTypes.PROBATION_END,
      SalaryChangeTypes.REVIEW, SalaryChangeTypes.PROMOTION, SalaryChangeTypes.ADJUSTMENT,
    ];
    expect(types).toHaveLength(5);
  });

  it("should define currencies", () => {
    const currencies: Currency[] = [Currencies.JPY, Currencies.NPR];
    expect(currencies).toHaveLength(2);
  });

  it("should create a salary record with optional agreement link", () => {
    const record: SalaryRecord = {
      id: "SALARY#001",
      employeeId: "EMP#001",
      amount: 300000,
      currency: Currencies.JPY,
      salaryType: SalaryTypes.MONTHLY,
      changeType: SalaryChangeTypes.INITIAL,
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
      currency: Currencies.JPY,
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
        { type: ReferenceTypes.JIRA, id: "HR-123" },
        { type: ReferenceTypes.GITHUB_PR, id: "example/hr#45" },
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
    const levels: FlagLevel[] = [FlagLevels.DAILY, FlagLevels.WEEKLY, FlagLevels.MONTHLY];
    const resolutions: FlagResolution[] = [
      FlagResolutions.NO_PENALTY, FlagResolutions.DEDUCT_FULL,
      FlagResolutions.USE_BANK, FlagResolutions.PARTIAL_BANK, FlagResolutions.DISCUSS,
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
      region: Regions.JP,
      year: 2024,
      isSubstitute: false,
    };
    expect(h.region).toBe(Regions.JP);
  });
});

describe("Audit types", () => {
  it("should create an audit entry with before/after", () => {
    const entry: AuditEntry = {
      id: "AUDIT#001",
      targetId: "EMP#001",
      targetType: "EMPLOYEE",
      action: AuditActions.UPDATE,
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
      Roles.EMPLOYEE, Roles.MANAGER, Roles.HR_MANAGER, Roles.ADMIN, Roles.SUPER_ADMIN,
    ];
    expect(roles).toHaveLength(5);
  });

  it("should define sensitivity levels", () => {
    const levels: SensitivityLevel[] = [
      SensitivityLevels.PUBLIC, SensitivityLevels.INTERNAL,
      SensitivityLevels.SENSITIVE, SensitivityLevels.CONFIDENTIAL,
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
        dailyMinimum: HOURS.DAILY_MINIMUM,
        weeklyMinimum: HOURS.WEEKLY_MINIMUM,
        monthlyMinimum: HOURS.MONTHLY_FULL_TIME,
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
        leaveTypes: [LeaveTypes.PAID, LeaveTypes.UNPAID],
        mandatoryUsageDays: JP_LABOR.MANDATORY_LEAVE_DAYS,
        terminationHandling: TerminationHandlings.LABOR_LAW,
      },
      overtime: {
        deemedHours: JP_LABOR.DEEMED_OVERTIME_HOURS,
        rates: {
          standard: JP_LABOR.OVERTIME_RATE_STANDARD,
          lateNight: JP_LABOR.OVERTIME_RATE_LATE_NIGHT,
          holiday: JP_LABOR.OVERTIME_RATE_HOLIDAY,
          excess60h: JP_LABOR.OVERTIME_RATE_EXCESS_60H,
        },
        monthlyLimit: JP_LABOR.MONTHLY_OVERTIME_LIMIT,
        yearlyLimit: JP_LABOR.YEARLY_OVERTIME_LIMIT,
      },
      compensation: {
        salaryType: SalaryTypes.MONTHLY,
        bonusSchedule: [],
        allowanceTypes: [],
        commissionTracking: false,
      },
      probation: {
        durationMonths: PROBATION.DEFAULT_DURATION_MONTHS,
        leaveAllowed: false,
        noticePeriodDays: PROBATION.DEFAULT_NOTICE_DAYS,
      },
      flags: {
        dailyThreshold: true,
        weeklyThreshold: true,
        monthlyThreshold: true,
        gracePeriodMinutes: 15,
      },
      payment: {
        deadlineDay: PAYMENT.JP_DEADLINE_DAY,
        alertDaysBefore: PAYMENT.ALERT_DAYS_BEFORE,
        settlementDeadlineDay: PAYMENT.SETTLEMENT_DEADLINE_DAY,
      },
      report: {
        submissionDeadline: "18:00",
        reminderTime: "17:00",
      },
    };
    expect(policy.hours.monthlyMinimum).toBe(HOURS.MONTHLY_FULL_TIME);
    expect(policy.overtime.deemedHours).toBe(JP_LABOR.DEEMED_OVERTIME_HOURS);
  });
});

describe("Document types", () => {
  it("should define verification statuses", () => {
    const statuses: DocumentVerificationStatus[] = [
      DocumentVerificationStatuses.PENDING,
      DocumentVerificationStatuses.VERIFIED,
      DocumentVerificationStatuses.REJECTED,
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
      verificationStatus: DocumentVerificationStatuses.PENDING,
      uploadedAt: "2024-01-15T00:00:00Z",
    };
    expect(doc.verificationStatus).toBe(DocumentVerificationStatuses.PENDING);
  });
});

describe("Onboarding/Offboarding types", () => {
  it("should define termination types", () => {
    const types: TerminationType[] = [
      TerminationTypes.WITHOUT_CAUSE, TerminationTypes.FOR_CAUSE,
      TerminationTypes.MUTUAL, TerminationTypes.RESIGNATION,
    ];
    expect(types).toHaveLength(4);
  });

  it("should create an offboarding record", () => {
    const record: OffboardingRecord = {
      employeeId: "EMP#001",
      terminationType: TerminationTypes.WITHOUT_CAUSE,
      terminationDate: "2024-06-30",
      noticePeriodBuyout: true,
      buyoutAmount: 300000,
      settlementDeadline: "2024-07-15",
      curePeriodExpiry: null,
      legalObligations: [
        { type: "CONFIDENTIALITY", description: "2-year NDA", expiresAt: "2026-06-30" },
      ],
      createdAt: "2024-06-01T00:00:00Z",
    };
    expect(record.noticePeriodBuyout).toBe(true);
    expect(record.legalObligations).toHaveLength(1);
  });
});

describe("Result type", () => {
  it("should create success result", () => {
    const result: Result<string, Error> = { success: true, data: "hello" };
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("hello");
  });

  it("should create error result", () => {
    const result: Result<string, string> = { success: false, error: "something went wrong" };
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("something went wrong");
  });
});

describe("Override types", () => {
  it("should define period types", () => {
    const periods: OverridePeriod[] = [FlagLevels.DAILY, FlagLevels.WEEKLY, FlagLevels.MONTHLY];
    expect(periods).toHaveLength(3);
  });

  it("should create an override", () => {
    const override: Override = {
      id: "OVR#001",
      employeeId: "EMP#001",
      period: FlagLevels.MONTHLY,
      yearMonth: "2024-02",
      requiredHours: 120,
      reason: "Quota redistribution",
      approvedBy: "EMP#000",
      createdAt: "2024-01-25T00:00:00Z",
    };
    expect(override.requiredHours).toBe(120);
  });
});
