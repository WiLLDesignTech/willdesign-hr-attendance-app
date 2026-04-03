// @willdesign-hr/core — Business logic, services, repository interfaces (ports)
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
  DocumentRepository,
  EmailAdapter,
  AuthProviderAdapter,
  CreateAuthUserInput,
} from "./repositories/index.js";

export { deepMergePolicy, resolveCascade } from "./policies/resolver.js";

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
export type { ProcessEventInput } from "./attendance/service.js";
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
