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
export const TerminationHandlings = {
  FORFEIT: "FORFEIT",
  LABOR_LAW: "LABOR_LAW",
} as const;

export const LeaveRequestStatuses = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

// ─── Salary ───
export const SalaryTypes = {
  MONTHLY: "MONTHLY",
  ANNUAL: "ANNUAL",
  HOURLY: "HOURLY",
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
} as const;

// ─── Hours Defaults ───
export const HOURS = {
  DAILY_MINIMUM: 8,
  WEEKLY_MINIMUM: 40,
  MONTHLY_FULL_TIME: 160,
  MONTHLY_PART_TIME: 80,
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
