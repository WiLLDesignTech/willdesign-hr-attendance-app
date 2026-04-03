// ─── Roles ───
export const Roles = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  HR_MANAGER: "HR_MANAGER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

// ─── Sensitivity Levels ───
export const SensitivityLevels = {
  PUBLIC: "PUBLIC",
  INTERNAL: "INTERNAL",
  SENSITIVE: "SENSITIVE",
  CONFIDENTIAL: "CONFIDENTIAL",
} as const;

// ─── Employment ───
export const EmploymentTypes = {
  JP_FULL_TIME: "JP_FULL_TIME",
  JP_CONTRACT: "JP_CONTRACT",
  JP_OUTSOURCED: "JP_OUTSOURCED",
  JP_PART_TIME: "JP_PART_TIME",
  JP_SALES: "JP_SALES",
  JP_INTERN: "JP_INTERN",
  NP_FULL_TIME: "NP_FULL_TIME",
  NP_PAID_INTERN: "NP_PAID_INTERN",
  NP_UNPAID_INTERN: "NP_UNPAID_INTERN",
} as const;

export const EmployeeStatuses = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export const Regions = {
  JP: "JP",
  NP: "NP",
} as const;

// ─── Attendance ───
export const AttendanceActions = {
  CLOCK_IN: "CLOCK_IN",
  CLOCK_OUT: "CLOCK_OUT",
  BREAK_START: "BREAK_START",
  BREAK_END: "BREAK_END",
} as const;

export const AttendanceStates = {
  IDLE: "IDLE",
  CLOCKED_IN: "CLOCKED_IN",
  ON_BREAK: "ON_BREAK",
} as const;

// ─── Work Arrangement ───
export const WorkArrangements = {
  OFFICE: "OFFICE",
  REMOTE: "REMOTE",
  HYBRID: "HYBRID",
} as const;

export const TimeTypes = {
  FIXED: "FIXED",
  FLEX: "FLEX",
  FULL_FLEX: "FULL_FLEX",
} as const;

// ─── Leave ───
export const LeaveTypes = {
  PAID: "PAID",
  UNPAID: "UNPAID",
  SHIFT_PERMISSION: "SHIFT_PERMISSION",
  CREDITED_ABSENCE: "CREDITED_ABSENCE",
  BEREAVEMENT: "BEREAVEMENT",
  MATERNITY: "MATERNITY",
  NURSING: "NURSING",
  MENSTRUAL: "MENSTRUAL",
  COMPANY_SPECIFIC: "COMPANY_SPECIFIC",
} as const;

export const TerminationHandlings = {
  FORFEIT: "FORFEIT",
  LABOR_LAW: "LABOR_LAW",
} as const;

export const LeaveRequestStatuses = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

// ─── Salary & Payroll ───
export const SalaryTypes = {
  MONTHLY: "MONTHLY",
  ANNUAL: "ANNUAL",
  HOURLY: "HOURLY",
} as const;

export const SalaryChangeTypes = {
  INITIAL: "INITIAL",
  PROBATION_END: "PROBATION_END",
  REVIEW: "REVIEW",
  PROMOTION: "PROMOTION",
  ADJUSTMENT: "ADJUSTMENT",
} as const;

export const Currencies = {
  JPY: "JPY",
  NPR: "NPR",
} as const;

// ─── Flags ───
export const FlagLevels = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
} as const;

export const FlagStatuses = {
  PENDING: "PENDING",
  RESOLVED: "RESOLVED",
} as const;

export const FlagResolutions = {
  NO_PENALTY: "NO_PENALTY",
  DEDUCT_FULL: "DEDUCT_FULL",
  USE_BANK: "USE_BANK",
  PARTIAL_BANK: "PARTIAL_BANK",
  DISCUSS: "DISCUSS",
} as const;

// ─── Termination ───
export const TerminationTypes = {
  WITHOUT_CAUSE: "WITHOUT_CAUSE",
  FOR_CAUSE: "FOR_CAUSE",
  MUTUAL: "MUTUAL",
  RESIGNATION: "RESIGNATION",
} as const;

// ─── Documents ───
export const DocumentVerificationStatuses = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;

// ─── Audit ───
export const AuditActions = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  RESOLVE: "RESOLVE",
} as const;

// ─── References ───
export const ReferenceTypes = {
  JIRA: "JIRA",
  GITHUB_PR: "GITHUB_PR",
  GITHUB_ISSUE: "GITHUB_ISSUE",
  OTHER: "OTHER",
} as const;

// ─── Allowance Types ───
export const AllowanceTypes = {
  TRANSPORTATION: "TRANSPORTATION",
  HOUSING: "HOUSING",
  POSITION: "POSITION",
} as const;

// ─── JP Labor Law Constants ───
export const JP_LABOR = {
  OVERTIME_RATE_STANDARD: 1.25,
  OVERTIME_RATE_LATE_NIGHT: 0.25,
  OVERTIME_RATE_HOLIDAY: 1.35,
  OVERTIME_RATE_EXCESS_60H: 1.5,
  DEEMED_OVERTIME_HOURS: 45,
  MONTHLY_OVERTIME_LIMIT: 45,
  YEARLY_OVERTIME_LIMIT: 360,
  MANDATORY_LEAVE_DAYS: 5,
  EXCESS_OVERTIME_THRESHOLD: 60,
  OVERTIME_WARNING_UTILIZATION: 0.85,
} as const;

// ─── Hours Defaults ───
export const HOURS = {
  DAILY_MINIMUM: 8,
  WEEKLY_MINIMUM: 40,
  MONTHLY_FULL_TIME: 160,
  MONTHLY_PART_TIME: 80,
} as const;

// ─── Attendance System ───
export const ATTENDANCE = {
  IDEMPOTENCY_WINDOW_MS: 60_000,
} as const;

// ─── Banking ───
export const BANKING = {
  EXPIRY_MONTHS: 12,
} as const;

// ─── Cognito ───
export const COGNITO = {
  ATTR_EMAIL: "email",
  ATTR_EMAIL_VERIFIED: "email_verified",
  ATTR_EMPLOYEE_ID: "custom:employee_id",
  ATTR_PREFERRED_LANGUAGE: "custom:preferred_language",
  DELIVERY_EMAIL: "EMAIL",
} as const;

// ─── S3 Keys ───
export const S3_PREFIXES = {
  DOCUMENTS: (employeeId: string, name: string) => `documents/${employeeId}/${name}`,
} as const;

// ─── Force Majeure ───
export const FORCE_MAJEURE = {
  TERMINATION_DAYS: 30,
} as const;

// ─── Probation ───
export const PROBATION = {
  DEFAULT_DURATION_MONTHS: 3,
  DEFAULT_NOTICE_DAYS: 14,
} as const;

// ─── Payment ───
export const PAYMENT = {
  JP_DEADLINE_DAY: 31,
  NP_DEADLINE_DAY: 15,
  ALERT_DAYS_BEFORE: 5,
  SETTLEMENT_DEADLINE_DAY: 15,
} as const;

// ─── Cron ───
export const CRON = {
  MIN_SESSION_MINUTES: 5,
  LEAVE_REMINDER_THRESHOLD_HOURS: 24,
  SURPLUS_EXPIRY_WARNING_DAYS: 30,
  PROBATION_ALERT_DAYS: 14,
} as const;
