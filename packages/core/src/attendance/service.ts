import type { AttendanceAction, AttendanceEvent, AttendanceSource, AttendanceStateRecord, Result, WorkLocation } from "@willdesign-hr/types";
import { AuditActions, ATTENDANCE, KeyPatterns, KeyPrefixes, dateToIso, dateToDateStr } from "@willdesign-hr/types";
import type { AttendanceRepository, AuditRepository } from "../repositories/index.js";
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

export class AttendanceService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly auditRepo: AuditRepository,
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

  async processEvent(input: ProcessEventInput): Promise<Result<AttendanceEvent, string>> {
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
}
