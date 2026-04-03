import type { AttendanceAction, AttendanceEvent, AttendanceSource, AttendanceStateRecord, AttendanceLock, AttendanceLockScope, Result, WorkLocation } from "@willdesign-hr/types";
import { AuditActions, ATTENDANCE, AttendanceLockScopes, ErrorMessages, KeyPatterns, KeyPrefixes, dateToIso, dateToDateStr, isoToYearMonth, nowIso } from "@willdesign-hr/types";
import type { AttendanceRepository, AuditRepository, AttendanceLockRepository, EmployeeRepository } from "../repositories/index.js";
import { validateTransition } from "./state-machine.js";

export interface ProcessEventInput {
  readonly employeeId: string;
  readonly action: AttendanceAction;
  readonly timestamp: Date;
  readonly source: AttendanceSource;
  readonly actorId: string;
  readonly workLocation?: WorkLocation;
  readonly isEmergency?: boolean;
}

export interface CreateAttendanceLockInput {
  readonly scope: AttendanceLockScope;
  readonly yearMonth: string;
  readonly groupId?: string;
  readonly employeeId?: string;
  readonly lockedBy: string;
}

export class AttendanceService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly auditRepo: AuditRepository,
    private readonly lockRepo: AttendanceLockRepository,
    private readonly employeeRepo: EmployeeRepository,
  ) {}

  async getState(employeeId: string): Promise<AttendanceStateRecord> {
    return this.attendanceRepo.getState(employeeId);
  }

  async getEventsForDate(employeeId: string, date: string): Promise<readonly AttendanceEvent[]> {
    return this.attendanceRepo.getEventsForDate(employeeId, date);
  }

  async getEventsForMonth(employeeId: string, yearMonth: string): Promise<readonly AttendanceEvent[]> {
    return this.attendanceRepo.getEventsForMonth(employeeId, yearMonth);
  }

  async createLock(input: CreateAttendanceLockInput): Promise<Result<AttendanceLock, string>> {
    let sk: string;
    if (input.scope === AttendanceLockScopes.COMPANY) {
      sk = KeyPatterns.lockSkCompany;
    } else if (input.scope === AttendanceLockScopes.GROUP) {
      sk = KeyPatterns.lockSkGroup(input.groupId!);
    } else {
      sk = KeyPatterns.lockSkEmployee(input.employeeId!);
    }

    const lock: AttendanceLock = {
      id: `${KeyPatterns.lock(input.yearMonth)}#${sk}`,
      scope: input.scope,
      yearMonth: input.yearMonth,
      groupId: input.groupId,
      employeeId: input.employeeId,
      lockedBy: input.lockedBy,
      lockedAt: nowIso(),
    };

    try {
      const saved = await this.lockRepo.save(lock);
      return { success: true, data: saved };
    } catch (err) {
      if (err instanceof Error && err.message.includes("ConditionalCheckFailed")) {
        return { success: false, error: ErrorMessages.LOCK_ALREADY_EXISTS };
      }
      throw err;
    }
  }

  async removeLock(yearMonth: string, scope: AttendanceLockScope, targetId?: string): Promise<void> {
    await this.lockRepo.delete(yearMonth, scope, targetId);
  }

  async getLocksForMonth(yearMonth: string): Promise<readonly AttendanceLock[]> {
    return this.lockRepo.findByYearMonth(yearMonth);
  }

  async processEvent(input: ProcessEventInput): Promise<Result<AttendanceEvent, string>> {
    // Lock enforcement — check most specific scope first
    const lockCheckResult = await this.checkLocks(input.employeeId, input.timestamp);
    if (lockCheckResult) return lockCheckResult;

    const state = await this.attendanceRepo.getState(input.employeeId);

    // Idempotency + temporal ordering check
    if (state.lastEventTimestamp) {
      const lastTime = new Date(state.lastEventTimestamp).getTime();
      const newTime = input.timestamp.getTime();
      const delta = newTime - lastTime;

      if (delta < 0) {
        return {
          success: false,
          error: `Rejected: event timestamp is before last known event at ${state.lastEventTimestamp}`,
        };
      }

      if (delta < ATTENDANCE.IDEMPOTENCY_WINDOW_MS) {
        return {
          success: false,
          error: `Rejected: idempotency window (${ATTENDANCE.IDEMPOTENCY_WINDOW_MS / 1000}s) — last event at ${state.lastEventTimestamp}`,
        };
      }
    }

    // Validate transition
    const transition = validateTransition(
      state.state,
      input.action,
      state.lastEventTimestamp ?? dateToIso(input.timestamp),
    );

    if (!transition.success) {
      return { success: false, error: transition.error };
    }

    // Build event
    const event: AttendanceEvent = {
      id: KeyPatterns.attendanceEvent(dateToDateStr(input.timestamp), dateToIso(input.timestamp)),
      employeeId: input.employeeId,
      action: input.action,
      timestamp: dateToIso(input.timestamp),
      source: input.source,
      workLocation: input.workLocation,
      isEmergency: input.isEmergency,
    };

    // Persist event + state + audit
    await this.attendanceRepo.saveEvent(event);
    await this.attendanceRepo.saveState(input.employeeId, {
      employeeId: input.employeeId,
      state: transition.newState,
      lastEventId: event.id,
      lastEventTimestamp: event.timestamp,
    });
    await this.auditRepo.append({
      id: KeyPatterns.audit(event.id),
      targetId: input.employeeId,
      targetType: KeyPrefixes.ATTENDANCE,
      action: AuditActions.UPDATE,
      actorId: input.actorId,
      source: input.source,
      before: { state: state.state, action: input.action },
      after: { state: transition.newState },
      timestamp: event.timestamp,
    });

    return { success: true, data: event };
  }

  private async checkLocks(employeeId: string, timestamp: Date): Promise<Result<never, string> | null> {
    const yearMonth = isoToYearMonth(dateToIso(timestamp));
    const locks = await this.lockRepo.findByYearMonth(yearMonth);
    if (locks.length === 0) return null;

    // Employee-scope: most specific, blocks individual even if company/group unlocked
    const employeeLock = locks.find(
      l => l.scope === AttendanceLockScopes.EMPLOYEE && l.employeeId === employeeId,
    );
    if (employeeLock) {
      return { success: false, error: `Period ${yearMonth} is locked (scope: ${AttendanceLockScopes.EMPLOYEE})` };
    }

    // Group-scope: blocks by employment type
    const groupLocks = locks.filter(l => l.scope === AttendanceLockScopes.GROUP);
    if (groupLocks.length > 0) {
      const employee = await this.employeeRepo.findById(employeeId);
      if (employee) {
        const matchingGroupLock = groupLocks.find(l => l.groupId === employee.employmentType);
        if (matchingGroupLock) {
          return { success: false, error: `Period ${yearMonth} is locked (scope: ${AttendanceLockScopes.GROUP})` };
        }
      }
    }

    // Company-scope: broadest, blocks everyone
    const companyLock = locks.find(l => l.scope === AttendanceLockScopes.COMPANY);
    if (companyLock) {
      return { success: false, error: `Period ${yearMonth} is locked (scope: ${AttendanceLockScopes.COMPANY})` };
    }

    return null;
  }
}
