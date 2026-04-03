/**
 * DynamoDB key prefixes and pattern builders.
 * Single source of truth for all entity key formats.
 * Shared across core (services) and data (repositories).
 */
import { AttendanceLockScopes } from "./constants.js";

// ─── Key Prefixes ───
export const KeyPrefixes = {
  EMPLOYEE: "EMP",
  ATTENDANCE: "ATT",
  ATTENDANCE_STATE: "ATT_STATE",
  LEAVE: "LEAVE",
  LEAVE_BALANCE: "LEAVE_BALANCE",
  SALARY: "SAL",
  REPORT: "REPORT",
  FLAG: "FLAG",
  BANK: "BANK",
  HOLIDAY: "HOL",
  AUDIT: "AUDIT",
  REGION: "REGION",
  OVERRIDE: "OVR",
  ROLE: "ROLE",
  MONTH: "MONTH",
  CONFIG: "CONFIG",
  CHANNEL: "CHANNEL",
  DOCUMENT: "DOC",
  LEGAL: "LEGAL",
  PROFILE: "PROFILE",
  LOCK: "LOCK",
  LOCK_GROUP: "GROUP",
} as const;

// ─── Key Builders ───
const P = KeyPrefixes;

export const KeyPatterns = {
  employee: (id: string) => `${P.EMPLOYEE}#${id}`,
  profile: P.PROFILE,
  attendanceEvent: (date: string, ts: string) => `${P.ATTENDANCE}#${date}#${ts}`,
  attendanceState: P.ATTENDANCE_STATE,
  leave: (employeeId: string, startDate: string) => `${P.LEAVE}#${employeeId}#${startDate}`,
  leaveBalance: P.LEAVE_BALANCE,
  salary: (employeeId: string, ts: number) => `${P.SALARY}#${employeeId}#${ts}`,
  salaryByDate: (effectiveDate: string) => `${P.SALARY}#${effectiveDate}`,
  report: (date: string, version: number) => `${P.REPORT}#${date}#v${version}`,
  flag: (type: string, period: string) => `${P.FLAG}#${type}#${period}`,
  flagInstance: (type: string, period: string, employeeId: string, ts: number) =>
    `${P.FLAG}#${type}#${period}#${employeeId}#${ts}`,
  bank: (period: string) => `${P.BANK}#${period}`,
  holiday: (region: string, date: string) => `${P.HOLIDAY}#${region}#${date}`,
  region: (region: string) => `${P.REGION}#${region}`,
  audit: (targetId: string) => `${P.AUDIT}#${targetId}`,
  auditAction: (action: string, targetId: string) => `${P.AUDIT}#${action}#${targetId}`,
  override: (type: string, value: string) => `${P.OVERRIDE}#${type}#${value}`,
  role: (name: string) => `${P.ROLE}#${name}`,
  month: (yearMonth: string) => `${P.MONTH}#${yearMonth}`,
  channel: (channelId: string) => `${P.CHANNEL}#${channelId}`,
  document: (id: string) => `${P.DOCUMENT}#${id}`,
  legal: (type: string) => `${P.LEGAL}#${type}`,
  lock: (yearMonth: string) => `${P.LOCK}#${yearMonth}`,
  lockSkCompany: AttendanceLockScopes.COMPANY,
  lockSkGroup: (groupId: string) => `${P.LOCK_GROUP}#${groupId}`,
  lockSkEmployee: (employeeId: string) => `${P.EMPLOYEE}#${employeeId}`,
} as const;
