export type AttendanceAction = "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";

export type AttendanceState = "IDLE" | "CLOCKED_IN" | "ON_BREAK";

export type AttendanceSource = "slack" | "web" | "system" | "admin";

export type WorkLocation = "office" | "remote" | "hybrid";

export interface AttendanceEvent {
  readonly id: string;
  readonly employeeId: string;
  readonly action: AttendanceAction;
  readonly timestamp: string;
  readonly source: AttendanceSource;
  readonly workLocation?: WorkLocation;
  readonly isEmergency?: boolean;
}

export interface AttendanceSession {
  readonly clockIn: string;
  readonly clockOut: string | null;
  readonly breaks: readonly BreakPeriod[];
  readonly workedMinutes: number;
  readonly breakMinutes: number;
}

export interface BreakPeriod {
  readonly start: string;
  readonly end: string | null;
}

// ─── Attendance Lock ───

export type AttendanceLockScope = "COMPANY" | "GROUP" | "EMPLOYEE";

export interface AttendanceLock {
  readonly id: string;
  readonly scope: AttendanceLockScope;
  readonly yearMonth: string;
  readonly groupId?: string;
  readonly employeeId?: string;
  readonly lockedBy: string;
  readonly lockedAt: string;
}
