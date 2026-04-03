/**
 * Centralized API route definitions.
 * Used by both backend (route registration) and frontend (hook calls).
 * Single source of truth for all endpoints, path params, and query params.
 */

// ─── Employees ───
export const API_EMPLOYEES_ME = "/api/employees/me" as const;
export const API_EMPLOYEES_BY_ID = "/api/employees/:id" as const;
export const API_EMPLOYEES = "/api/employees" as const;

export interface EmployeesQueryParams {
  readonly status?: "ACTIVE" | "INACTIVE";
}

// ─── Attendance ───
export const API_ATTENDANCE_STATE = "/api/attendance/state" as const;
export const API_ATTENDANCE_EVENTS = "/api/attendance/events" as const;

export interface AttendanceEventsQueryParams {
  readonly employeeId?: string;
  readonly date?: string;
  readonly month?: string;
}

export interface ClockActionBody {
  readonly action: string;
  readonly workLocation?: "office" | "remote";
  readonly isEmergency?: boolean;
}

// ─── Leave ───
export const API_LEAVE_REQUESTS = "/api/leave-requests" as const;
export const API_LEAVE_REQUEST_BY_ID = "/api/leave-requests/:id" as const;
export const API_LEAVE_BALANCE = "/api/leave/balance" as const;

export interface LeaveRequestsQueryParams {
  readonly employeeId?: string;
  readonly status?: "PENDING" | "APPROVED" | "REJECTED";
  readonly pending?: "true";
}

export interface CreateLeaveBody {
  readonly leaveType: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly reason?: string;
}

export interface LeaveActionBody {
  readonly action: "approve" | "reject";
  readonly reason?: string;
}

export interface LeaveBalanceQueryParams {
  readonly employeeId?: string;
}

// ─── Payroll ───
export const API_PAYROLL = "/api/payroll/:yearMonth" as const;

// ─── Flags ───
export const API_FLAGS = "/api/flags" as const;
export const API_FLAG_BY_ID = "/api/flags/:id" as const;

export interface FlagsQueryParams {
  readonly status?: "PENDING" | "RESOLVED";
}

export interface ResolveFlagBody {
  readonly flagId: string;
  readonly resolution: string;
  readonly deficitHours?: number;
  readonly bankOffsetHours?: number;
}

// ─── Bank ───
export const API_BANK = "/api/bank" as const;
export const API_BANK_APPROVE = "/api/bank/approve" as const;

export interface BankQueryParams {
  readonly employeeId?: string;
}

export interface BankApproveBody {
  readonly entryId: string;
}

// ─── Reports ───
export const API_REPORTS = "/api/reports" as const;

export interface ReportsQueryParams {
  readonly employeeId?: string;
  readonly date?: string;
}

export interface CreateReportBody {
  readonly text: string;
  readonly date?: string;
}

// ─── Admin ───
export const API_ONBOARD = "/api/onboard" as const;
export const API_OFFBOARD = "/api/offboard/:id" as const;
export const API_AUDIT = "/api/audit/:targetId" as const;

// ─── Holidays ───
export const API_HOLIDAYS = "/api/holidays" as const;
export const API_HOLIDAY_DELETE = "/api/holidays/:region/:date" as const;

export interface HolidaysQueryParams {
  readonly region?: string;
  readonly year?: string;
}

export interface CreateHolidayBody {
  readonly date: string;
  readonly name: string;
  readonly nameJa?: string;
  readonly region: string;
  readonly isSubstitute?: boolean;
}

// ─── Attendance Lock ───
export const API_ATTENDANCE_LOCK = "/api/attendance/lock" as const;

export interface CreateAttendanceLockBody {
  readonly scope: import("./attendance.js").AttendanceLockScope;
  readonly yearMonth: string;
  readonly groupId?: string;
  readonly employeeId?: string;
}

export interface DeleteAttendanceLockParams {
  readonly scope: import("./attendance.js").AttendanceLockScope;
  readonly yearMonth: string;
  readonly groupId?: string;
  readonly employeeId?: string;
}

export interface AttendanceLockQueryParams {
  readonly yearMonth?: string;
  readonly scope?: import("./attendance.js").AttendanceLockScope;
}

// ─── Policies ───
export const API_POLICIES = "/api/policies/:groupName" as const;

// ─── Dev Auth (dev only) ───
export const API_DEV_AUTH_EMPLOYEES = "/api/dev-auth/employees" as const;
export const API_DEV_AUTH_LOGIN = "/api/dev-auth/login" as const;

// ─── Frontend Route Segments (for <Route path="">) ───
export const ROUTE_SEGMENTS = {
  LOGIN: "login",
  DASHBOARD: "",
  ATTENDANCE: "attendance",
  LEAVE: "leave",
  REPORTS: "reports",
  PAYROLL: "payroll",
  TEAM: "team",
  ADMIN: "admin",
  SETTINGS: "settings",
} as const;

// ─── Frontend Routes (absolute paths for <NavLink to="">) ───
export const ROUTES = {
  LOGIN: `/${ROUTE_SEGMENTS.LOGIN}`,
  DASHBOARD: "/",
  ATTENDANCE: `/${ROUTE_SEGMENTS.ATTENDANCE}`,
  LEAVE: `/${ROUTE_SEGMENTS.LEAVE}`,
  REPORTS: `/${ROUTE_SEGMENTS.REPORTS}`,
  PAYROLL: `/${ROUTE_SEGMENTS.PAYROLL}`,
  TEAM: `/${ROUTE_SEGMENTS.TEAM}`,
  ADMIN: `/${ROUTE_SEGMENTS.ADMIN}`,
  SETTINGS: `/${ROUTE_SEGMENTS.SETTINGS}`,
} as const;

// ─── URL builder helpers ───
export function apiPath(template: string, params: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, encodeURIComponent(value));
  }
  return result;
}

export function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null) as [string, string | number][];
  if (entries.length === 0) return path;
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
  return `${path}?${qs}`;
}
