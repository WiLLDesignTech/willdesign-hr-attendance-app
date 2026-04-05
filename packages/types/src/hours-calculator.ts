import type { AttendanceEvent, AttendanceSession, BreakPeriod } from "./attendance.js";
import { AttendanceActions } from "./constants.js";

export interface HoursBreakdown {
  readonly workedHours: number;
  readonly breakHours: number;
  readonly leaveCredits: number;
  readonly totalHours: number;
  readonly sessions: readonly AttendanceSession[];
}

/**
 * Calculate daily hours from attendance events.
 * Cross-midnight: all hours count toward the clock-in date.
 * Open sessions (no clock-out) are not counted toward worked hours.
 */
export const calculateDailyHours = (
  events: readonly AttendanceEvent[],
  leaveCredits: number,
): HoursBreakdown => {
  const sessions = buildSessions(events);

  let workedMinutes = 0;
  let breakMinutes = 0;

  for (const session of sessions) {
    if (!session.clockOut) continue;
    workedMinutes += session.workedMinutes;
    breakMinutes += session.breakMinutes;
  }

  const workedHours = minutesToHours(workedMinutes);
  const breakHours = minutesToHours(breakMinutes);

  return {
    workedHours,
    breakHours,
    leaveCredits,
    totalHours: workedHours + leaveCredits,
    sessions,
  };
};

const buildSessions = (events: readonly AttendanceEvent[]): AttendanceSession[] => {
  const sessions: AttendanceSession[] = [];
  let currentSession: {
    clockIn: string;
    clockOut: string | null;
    breaks: BreakPeriod[];
    workedMinutes: number;
    breakMinutes: number;
  } | null = null;

  for (const event of events) {
    switch (event.action) {
      case AttendanceActions.CLOCK_IN:
        currentSession = {
          clockIn: event.timestamp,
          clockOut: null,
          breaks: [],
          workedMinutes: 0,
          breakMinutes: 0,
        };
        sessions.push(currentSession);
        break;

      case AttendanceActions.CLOCK_OUT:
        if (currentSession) {
          currentSession.clockOut = event.timestamp;
          const totalMs = new Date(event.timestamp).getTime() - new Date(currentSession.clockIn).getTime();
          const breakMs = sumBreakMs(currentSession.breaks);
          currentSession.workedMinutes = Math.round((totalMs - breakMs) / 60_000);
          currentSession.breakMinutes = Math.round(breakMs / 60_000);
          currentSession = null;
        }
        break;

      case AttendanceActions.BREAK_START:
        if (currentSession) {
          currentSession.breaks.push({ start: event.timestamp, end: null });
        }
        break;

      case AttendanceActions.BREAK_END:
        if (currentSession) {
          const openBreak = currentSession.breaks.find((b) => !b.end);
          if (openBreak) {
            (openBreak as { start: string; end: string | null }).end = event.timestamp;
          }
        }
        break;
    }
  }

  return sessions;
};

const sumBreakMs = (breaks: readonly BreakPeriod[]): number => {
  let total = 0;
  for (const brk of breaks) {
    if (brk.end) {
      total += new Date(brk.end).getTime() - new Date(brk.start).getTime();
    }
  }
  return total;
};

const minutesToHours = (minutes: number): number =>
  Math.round((minutes / 60) * 100) / 100;
