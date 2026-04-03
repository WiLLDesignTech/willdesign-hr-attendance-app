import type { AttendanceEvent, AttendanceStateRecord } from "@hr-attendance-app/types";

export interface AttendanceRepository {
  getState(employeeId: string): Promise<AttendanceStateRecord>;
  saveState(employeeId: string, state: AttendanceStateRecord): Promise<void>;
  saveEvent(event: AttendanceEvent): Promise<void>;
  getEventsForDate(employeeId: string, date: string): Promise<readonly AttendanceEvent[]>;
  getEventsForMonth(employeeId: string, yearMonth: string): Promise<readonly AttendanceEvent[]>;
  getUnclosedSessions(date: string): Promise<readonly AttendanceStateRecord[]>;
}
