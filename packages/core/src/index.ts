// @hr-attendance-app/core — Business logic, services, repository interfaces (ports)
// Zero AWS dependencies — pure TypeScript

export type {
  EmployeeRepository,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  AttendanceRepository,
  LeaveRepository,
  LeaveQueryOptions,
  SalaryRepository,
  ReportRepository,
  FlagRepository,
  FlagQueryOptions,
  BankRepository,
  BankQueryOptions,
  AuditRepository,
  AuditQueryOptions,
  HolidayRepository,
  OverrideRepository,
  PolicyRepository,
  RoleRepository,
  MonthlySummaryRepository,
  AttendanceLockRepository,
  DocumentRepository,
  EmailAdapter,
  AuthProviderAdapter,
  CreateAuthUserInput,
} from "./repositories/index.js";

export { deepMergePolicy, resolveCascade, resolveCascadeWithRegion } from "./policies/resolver.js";

export {
  ROLE_HIERARCHY,
  getRoleLevel,
  hasMinimumRole,
  hasPermission,
  authorize,
} from "./permissions/engine.js";

export { validateTransition } from "./attendance/state-machine.js";
export type { TransitionResult } from "./attendance/state-machine.js";
export { matchKeyword, matchCommand, DEFAULT_KEYWORD_CONFIGS } from "./attendance/keyword-matcher.js";
export type { KeywordConfig, MatchResult, CommandResult } from "./attendance/keyword-matcher.js";
export { AttendanceService } from "./attendance/service.js";
export type { ProcessEventInput, CreateAttendanceLockInput } from "./attendance/service.js";
export { calculateDailyHours } from "./attendance/hours-calculator.js";
export type { HoursBreakdown } from "./attendance/hours-calculator.js";

export { LeaveService } from "./leave/service.js";
export type { CreateLeaveRequestInput } from "./leave/service.js";
export { calculateAccrual, getJpAccrualDays, getNpAccrualDays, getMandatoryLeaveStatus } from "./leave/accrual.js";
export type { AccrualInput, AccrualResult, MandatoryLeaveStatus } from "./leave/accrual.js";

export {
  getEffectiveSalary,
  calculateBlendedSalary,
  toMonthlySalary,
  calculateProRata,
  calculateDeficitDeduction,
  calculatePayrollBreakdown,
} from "./payroll/calculator.js";
export type { PayrollInput } from "./payroll/calculator.js";

export {
  shouldGenerateFlag,
  resolveFlag,
  createBankEntry,
  isExpired,
  applyBankOffset,
  createQuotaPlan,
  validateQuotaPlan,
  calculateForceMajeureAdjustment,
} from "./flags/service.js";

export { extractReferences, parseReport, hasMissingReferences, createNewVersion } from "./reports/parser.js";
export type { ParsedReport } from "./reports/parser.js";

export {
  calculateOvertimeHours,
  calculateOvertimePay,
  checkDeemedOvertimeThreshold,
  check36AgreementLimits,
} from "./overtime/calculator.js";

export { CronService } from "./cron/service.js";
export type { CronDeps, DailyCheckResult, WeeklyCheckResult, MonthlyCheckResult } from "./cron/service.js";
export { ReminderService } from "./cron/reminders.js";
export type { ReminderDeps, LeaveReminder, SurplusExpiryWarning, ProbationAlert } from "./cron/reminders.js";

export { OnboardingService } from "./onboarding/service.js";
export type { OnboardingDeps, OnboardingInput, OnboardingResult } from "./onboarding/service.js";
export { OffboardingService } from "./onboarding/offboarding.js";
export type { OffboardingDeps, OffboardingInput, OffboardingResult, SettlementPreview } from "./onboarding/offboarding.js";

export { HolidayService } from "./holidays/service.js";
export type { HolidayServiceDeps, SeedResult } from "./holidays/service.js";
export { generateJpHolidays } from "./holidays/jp-generator.js";

export { EmployeeService } from "./employee/service.js";
export type { EmployeeServiceDeps } from "./employee/service.js";
export { PayrollService } from "./payroll/service.js";
export type { PayrollServiceDeps } from "./payroll/service.js";
export { FlagQueryService } from "./flags/query-service.js";
export type { FlagQueryServiceDeps } from "./flags/query-service.js";
export { BankService } from "./banking/service.js";
export type { BankServiceDeps } from "./banking/service.js";
export { ReportService } from "./reports/service.js";
export type { ReportServiceDeps } from "./reports/service.js";
export { AuditService } from "./audit/service.js";
export type { AuditServiceDeps } from "./audit/service.js";
export { RoleService } from "./roles/service.js";
export type { RoleServiceDeps } from "./roles/service.js";
export { DocumentService } from "./documents/service.js";
export type { DocumentServiceDeps } from "./documents/service.js";

// ─── Config ───
export { loadConfigFromObject, getDefaultConfig } from "./config/loader.js";

// ─── Regions ───
export { RegionRegistry, regionRegistry, jpRegionConfig, npRegionConfig } from "./regions/index.js";
export type {
  RegionConfig,
  OvertimeStrategy,
  LeaveAccrualStrategy,
  HolidayGeneratorStrategy,
  PayrollDeductionStrategy,
} from "./regions/index.js";
