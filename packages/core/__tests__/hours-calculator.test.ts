import { describe, it, expect } from "vitest";
import { calculateDailyHours } from "../src/attendance/hours-calculator.js";
import { AttendanceActions } from "@hr-attendance-app/types";
import type { AttendanceEvent } from "@hr-attendance-app/types";

function makeEvent(action: string, timestamp: string): AttendanceEvent {
  return {
    id: `ATT#${Date.now()}${Math.random()}`,
    employeeId: "EMP#001",
    action: action as AttendanceEvent["action"],
    timestamp,
    source: "slack",
  };
}

describe("Hours Calculator — Daily", () => {
  it("calculates hours for a simple session", () => {
    const events: AttendanceEvent[] = [
      makeEvent(AttendanceActions.CLOCK_IN, "2024-01-15T09:00:00Z"),
      makeEvent(AttendanceActions.CLOCK_OUT, "2024-01-15T17:00:00Z"),
    ];
    const result = calculateDailyHours(events, 0);
    expect(result.workedHours).toBe(8);
    expect(result.breakHours).toBe(0);
    expect(result.totalHours).toBe(8);
  });

  it("subtracts break time", () => {
    const events: AttendanceEvent[] = [
      makeEvent(AttendanceActions.CLOCK_IN, "2024-01-15T09:00:00Z"),
      makeEvent(AttendanceActions.BREAK_START, "2024-01-15T12:00:00Z"),
      makeEvent(AttendanceActions.BREAK_END, "2024-01-15T13:00:00Z"),
      makeEvent(AttendanceActions.CLOCK_OUT, "2024-01-15T17:00:00Z"),
    ];
    const result = calculateDailyHours(events, 0);
    expect(result.workedHours).toBe(7);
    expect(result.breakHours).toBe(1);
    expect(result.totalHours).toBe(7);
  });

  it("adds leave credits to total", () => {
    const events: AttendanceEvent[] = [
      makeEvent(AttendanceActions.CLOCK_IN, "2024-01-15T09:00:00Z"),
      makeEvent(AttendanceActions.CLOCK_OUT, "2024-01-15T13:00:00Z"),
    ];
    const result = calculateDailyHours(events, 4); // 4h leave credit
    expect(result.workedHours).toBe(4);
    expect(result.leaveCredits).toBe(4);
    expect(result.totalHours).toBe(8);
  });

  it("handles multiple sessions per day", () => {
    const events: AttendanceEvent[] = [
      makeEvent(AttendanceActions.CLOCK_IN, "2024-01-15T09:00:00Z"),
      makeEvent(AttendanceActions.CLOCK_OUT, "2024-01-15T12:00:00Z"),
      makeEvent(AttendanceActions.CLOCK_IN, "2024-01-15T13:00:00Z"),
      makeEvent(AttendanceActions.CLOCK_OUT, "2024-01-15T17:00:00Z"),
    ];
    const result = calculateDailyHours(events, 0);
    expect(result.workedHours).toBe(7);
    expect(result.sessions).toHaveLength(2);
  });

  it("handles cross-midnight session (hours count toward clock-in date)", () => {
    const events: AttendanceEvent[] = [
      makeEvent(AttendanceActions.CLOCK_IN, "2024-01-15T22:00:00Z"),
      makeEvent(AttendanceActions.CLOCK_OUT, "2024-01-16T02:00:00Z"),
    ];
    const result = calculateDailyHours(events, 0);
    expect(result.workedHours).toBe(4);
  });

  it("handles open session (no clock-out) — counts up to now or ignores", () => {
    const events: AttendanceEvent[] = [
      makeEvent(AttendanceActions.CLOCK_IN, "2024-01-15T09:00:00Z"),
      // no clock-out
    ];
    const result = calculateDailyHours(events, 0);
    // Open sessions return 0 worked hours (not counted until closed)
    expect(result.workedHours).toBe(0);
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]?.clockOut).toBeNull();
  });

  it("handles open break — break not counted until ended", () => {
    const events: AttendanceEvent[] = [
      makeEvent(AttendanceActions.CLOCK_IN, "2024-01-15T09:00:00Z"),
      makeEvent(AttendanceActions.BREAK_START, "2024-01-15T12:00:00Z"),
      // break still open
    ];
    const result = calculateDailyHours(events, 0);
    expect(result.workedHours).toBe(0); // open session
    expect(result.sessions[0]?.clockOut).toBeNull();
  });

  it("returns zero for empty events", () => {
    const result = calculateDailyHours([], 0);
    expect(result.workedHours).toBe(0);
    expect(result.totalHours).toBe(0);
    expect(result.sessions).toHaveLength(0);
  });
});
