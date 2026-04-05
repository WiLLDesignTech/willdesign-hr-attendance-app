/**
 * Centralized query key factory for React Query cache consistency.
 * Keys derived from API route constants for single source of truth.
 */
import {
  API_EMPLOYEES, API_EMPLOYEES_ME,
  API_ATTENDANCE_STATE, API_ATTENDANCE_EVENTS, API_ATTENDANCE_LOCK,
  API_ATTENDANCE_SUMMARY, API_ATTENDANCE_TEAM_STATES,
  API_LEAVE_REQUESTS, API_LEAVE_BALANCE,
  API_PAYROLL, API_FLAGS, API_BANK, API_BANK_APPROVE,
  API_REPORTS, API_HOLIDAYS, API_AUDIT,
  API_POLICIES, API_POLICY_EFFECTIVE, API_POLICY_COMPANY, API_POLICY_USER,
  API_ADMIN_SALARY, API_ROLES, API_DOCUMENTS,
} from "@hr-attendance-app/types";

/** Sub-key constants for cache scoping within query key arrays. */
const SCOPE = {
  PENDING: "pending",
  MONTH: "month",
  LIST: "list",
  TEAM: "team",
} as const;

export const queryKeys = {
  employee: {
    all: [API_EMPLOYEES] as const,
    me: () => [API_EMPLOYEES_ME] as const,
    detail: (id: string) => [API_EMPLOYEES, id] as const,
  },
  attendance: {
    all: [API_ATTENDANCE_STATE] as const,
    state: () => [API_ATTENDANCE_STATE] as const,
    events: (date: string) => [API_ATTENDANCE_EVENTS, date] as const,
    monthEvents: (month: string) => [API_ATTENDANCE_EVENTS, SCOPE.MONTH, month] as const,
    summary: () => [API_ATTENDANCE_SUMMARY] as const,
    teamStates: (ids: string) => [API_ATTENDANCE_TEAM_STATES, ids] as const,
  },
  leave: {
    all: [API_LEAVE_REQUESTS] as const,
    requests: () => [API_LEAVE_REQUESTS] as const,
    pending: () => [API_LEAVE_REQUESTS, SCOPE.PENDING] as const,
    balance: () => [API_LEAVE_BALANCE] as const,
  },
  payroll: {
    all: [API_PAYROLL] as const,
    month: (yearMonth: string) => [API_PAYROLL, yearMonth] as const,
  },
  flags: {
    all: [API_FLAGS] as const,
    list: () => [API_FLAGS, SCOPE.LIST] as const,
  },
  bank: {
    all: [API_BANK] as const,
    list: () => [API_BANK, SCOPE.LIST] as const,
    byEmployee: (employeeId: string) => [API_BANK, employeeId] as const,
    approve: () => [API_BANK_APPROVE] as const,
  },
  reports: {
    all: [API_REPORTS] as const,
    byDate: (date: string) => [API_REPORTS, date] as const,
  },
  team: {
    all: [API_EMPLOYEES] as const,
    members: () => [API_EMPLOYEES, SCOPE.TEAM] as const,
  },
  holidays: {
    all: [API_HOLIDAYS] as const,
    byRegion: (region: string, year: number) => [API_HOLIDAYS, region, year] as const,
  },
  audit: {
    all: [API_AUDIT] as const,
    byTarget: (targetId: string) => [API_AUDIT, targetId] as const,
  },
  locks: {
    all: [API_ATTENDANCE_LOCK] as const,
    byMonth: (yearMonth: string) => [API_ATTENDANCE_LOCK, yearMonth] as const,
  },
  policies: {
    all: [API_POLICIES] as const,
    byGroup: (groupName: string) => [API_POLICIES, groupName] as const,
    company: () => [API_POLICY_COMPANY] as const,
    byUser: (userId: string) => [API_POLICY_USER, userId] as const,
    effective: () => [API_POLICY_EFFECTIVE] as const,
  },
  roles: {
    all: [API_ROLES] as const,
  },
  documents: {
    all: [API_DOCUMENTS] as const,
    byEmployee: (employeeId: string) => [API_DOCUMENTS, employeeId] as const,
  },
  salary: {
    all: [API_ADMIN_SALARY] as const,
    byEmployee: (employeeId: string) => [API_ADMIN_SALARY, employeeId] as const,
  },
} as const;
