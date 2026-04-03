import type { AttendanceLock, AttendanceLockScope } from "@hr-attendance-app/types";

export interface AttendanceLockRepository {
  findByYearMonth(yearMonth: string, scope?: AttendanceLockScope): Promise<readonly AttendanceLock[]>;
  save(lock: AttendanceLock): Promise<AttendanceLock>;
  delete(yearMonth: string, scope: AttendanceLockScope, targetId?: string): Promise<void>;
}
