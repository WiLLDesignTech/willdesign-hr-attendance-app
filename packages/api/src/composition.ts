/**
 * Composition root — instantiates all repositories and services with DI.
 * Used by both Lambda handler and local dev server.
 */
import {
  getDocClient,
  DynamoEmployeeRepository,
  DynamoAttendanceRepository,
  DynamoAuditRepository,
  DynamoLeaveRepository,
  DynamoSalaryRepository,
  DynamoFlagRepository,
  DynamoBankRepository,
  DynamoReportRepository,
  DynamoHolidayRepository,
} from "@willdesign-hr/data";
import {
  AttendanceService,
  LeaveService,
  OnboardingService,
  OffboardingService,
  HolidayService,
  CronService,
  ReminderService,
  EmployeeService,
  PayrollService,
  FlagQueryService,
  BankService,
  ReportService,
  AuditService,
} from "@willdesign-hr/core";
import type { AuthProviderAdapter } from "@willdesign-hr/core";
import type { LeaveBalance } from "@willdesign-hr/types";
import { LeaveTypes, nowMs } from "@willdesign-hr/types";

export interface AppServices {
  readonly employee: EmployeeService;
  readonly attendance: AttendanceService;
  readonly leave: LeaveService;
  readonly payroll: PayrollService;
  readonly flagQuery: FlagQueryService;
  readonly bank: BankService;
  readonly report: ReportService;
  readonly audit: AuditService;
  readonly onboarding: OnboardingService;
  readonly offboarding: OffboardingService;
  readonly holiday: HolidayService;
  readonly cron: CronService;
  readonly reminder: ReminderService;
}

export interface AppDeps {
  readonly services: AppServices;
}

/** Stub auth provider for local dev (no real Cognito). */
const devAuthProvider: AuthProviderAdapter = {
  async createUser() { return { authUserId: `cog-${nowMs()}` }; },
  async disableUser() { /* noop */ },
  async deleteUser() { /* noop */ },
  async setTemporaryPassword() { /* noop */ },
  async updateAttributes() { /* noop */ },
};

let cached: AppDeps | null = null;

export function createDeps(): AppDeps {
  if (cached) return cached;

  const { client, tableName } = getDocClient();

  // Repositories (internal — not exposed to handlers)
  const employeeRepo = new DynamoEmployeeRepository(client, tableName);
  const attendanceRepo = new DynamoAttendanceRepository(client, tableName);
  const auditRepo = new DynamoAuditRepository(client, tableName);
  const leaveRepo = new DynamoLeaveRepository(client, tableName);
  const salaryRepo = new DynamoSalaryRepository(client, tableName);
  const flagRepo = new DynamoFlagRepository(client, tableName);
  const bankRepo = new DynamoBankRepository(client, tableName);
  const reportRepo = new DynamoReportRepository(client, tableName);
  const holidayRepo = new DynamoHolidayRepository(client, tableName);
  // Reserved for future services — instantiated when needed
  // const overrideRepo = new DynamoOverrideRepository(client, tableName);
  // const roleRepo = new DynamoRoleRepository(client, tableName);
  // const monthlySummaryRepo = new DynamoMonthlySummaryRepository(client, tableName);

  const getBalance = async (employeeId: string): Promise<LeaveBalance> => {
    const requests = await leaveRepo.findByEmployee(employeeId, { status: "APPROVED" });
    const used = requests.reduce((sum, r) => {
      if (r.leaveType === LeaveTypes.PAID) {
        const start = new Date(r.startDate).getTime();
        const end = new Date(r.endDate).getTime();
        return sum + Math.max(1, Math.round((end - start) / 86_400_000) + 1);
      }
      return sum;
    }, 0);

    return {
      employeeId,
      paidLeaveTotal: 10,
      paidLeaveUsed: used,
      paidLeaveRemaining: Math.max(0, 10 - used),
      carryOver: 0,
      carryOverExpiry: null,
      lastAccrualDate: null,
    };
  };

  const services: AppServices = {
    employee: new EmployeeService({ employeeRepo }),
    attendance: new AttendanceService(attendanceRepo, auditRepo),
    leave: new LeaveService(leaveRepo, auditRepo, getBalance),
    payroll: new PayrollService({ salaryRepo }),
    flagQuery: new FlagQueryService({ flagRepo }),
    bank: new BankService({ bankRepo }),
    report: new ReportService({ reportRepo }),
    audit: new AuditService({ auditRepo }),
    onboarding: new OnboardingService({
      employeeRepo, salaryRepo,
      authProvider: devAuthProvider,
      auditRepo,
    }),
    offboarding: new OffboardingService({
      employeeRepo, salaryRepo,
      authProvider: devAuthProvider,
      auditRepo,
    }),
    holiday: new HolidayService({ holidayRepo }),
    cron: new CronService({
      employeeRepo, attendanceRepo, flagRepo, bankRepo, auditRepo,
    }),
    reminder: new ReminderService({
      employeeRepo, leaveRepo, bankRepo,
    }),
  };

  cached = { services };
  return cached;
}
