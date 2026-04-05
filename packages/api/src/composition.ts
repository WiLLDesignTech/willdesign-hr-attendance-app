/**
 * Composition root — instantiates all repositories and services with DI.
 * Used by both Lambda handler and local dev server.
 *
 * Supports multi-tenancy: each tenantId gets its own set of repos/services,
 * cached for Lambda reuse across invocations within the same tenant.
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
  DynamoAttendanceLockRepository,
  DynamoRoleRepository,
} from "@hr-attendance-app/data";
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
  RoleService,
  DocumentService,
} from "@hr-attendance-app/core";
import type { AuthProviderAdapter } from "@hr-attendance-app/core";
import { nowMs, DEFAULT_TENANT_ID } from "@hr-attendance-app/types";

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
  readonly role: RoleService;
  readonly document: DocumentService;
}

export interface AppDeps {
  readonly services: AppServices;
}

/** Resolves tenant-scoped deps from a tenantId. Used by route handlers. */
export type DepsResolver = (tenantId: string) => AppDeps;

/** Stub auth provider for local dev (no real Cognito). */
const devAuthProvider: AuthProviderAdapter = {
  async createUser() { return { authUserId: `cog-${nowMs()}` }; },
  async disableUser() { /* noop */ },
  async deleteUser() { /* noop */ },
  async setTemporaryPassword() { /* noop */ },
  async updateAttributes() { /* noop */ },
};

const tenantCache = new Map<string, AppDeps>();

/**
 * Get or create tenant-scoped dependencies.
 * Repos are tenant-specific (keys prefixed with T#{tenantId}#).
 * Services are stateless and safe to cache per tenant.
 */
export function getTenantDeps(tenantId: string): AppDeps {
  const cached = tenantCache.get(tenantId);
  if (cached) return cached;

  const { client, tableName } = getDocClient();

  // Repositories (internal — not exposed to handlers)
  const employeeRepo = new DynamoEmployeeRepository(client, tableName, tenantId);
  const attendanceRepo = new DynamoAttendanceRepository(client, tableName, tenantId);
  const auditRepo = new DynamoAuditRepository(client, tableName, tenantId);
  const leaveRepo = new DynamoLeaveRepository(client, tableName, tenantId);
  const salaryRepo = new DynamoSalaryRepository(client, tableName, tenantId);
  const flagRepo = new DynamoFlagRepository(client, tableName, tenantId);
  const bankRepo = new DynamoBankRepository(client, tableName, tenantId);
  const reportRepo = new DynamoReportRepository(client, tableName, tenantId);
  const holidayRepo = new DynamoHolidayRepository(client, tableName, tenantId);
  const lockRepo = new DynamoAttendanceLockRepository(client, tableName, tenantId);
  const roleRepo = new DynamoRoleRepository(client, tableName, tenantId);

  const services: AppServices = {
    employee: new EmployeeService({ employeeRepo }),
    attendance: new AttendanceService(attendanceRepo, auditRepo, lockRepo, employeeRepo),
    leave: new LeaveService(leaveRepo, auditRepo),
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
    role: new RoleService({ roleRepo }),
    document: new DocumentService({ documentRepo: { findByEmployee: async () => [], getUploadUrl: async () => "", getDownloadUrl: async () => "", save: async (d) => d } }),
  };

  const deps = { services };
  tenantCache.set(tenantId, deps);
  return deps;
}

/** Backward-compatible: returns deps for the default (single-tenant) tenant. */
export function createDeps(): AppDeps {
  return getTenantDeps(DEFAULT_TENANT_ID);
}
