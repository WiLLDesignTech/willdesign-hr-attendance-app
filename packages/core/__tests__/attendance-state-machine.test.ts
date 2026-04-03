import { describe, it, expect } from "vitest";
import { validateTransition } from "../src/attendance/state-machine.js";
import { AttendanceActions, AttendanceStates } from "@hr-attendance-app/types";

describe("Attendance State Machine", () => {
  const ts = "2024-01-15T09:00:00Z";

  describe("valid transitions", () => {
    it("IDLE → CLOCKED_IN on CLOCK_IN", () => {
      const result = validateTransition(AttendanceStates.IDLE, AttendanceActions.CLOCK_IN, ts);
      expect(result.success).toBe(true);
      if (result.success) expect(result.newState).toBe(AttendanceStates.CLOCKED_IN);
    });

    it("CLOCKED_IN → IDLE on CLOCK_OUT", () => {
      const result = validateTransition(AttendanceStates.CLOCKED_IN, AttendanceActions.CLOCK_OUT, ts);
      expect(result.success).toBe(true);
      if (result.success) expect(result.newState).toBe(AttendanceStates.IDLE);
    });

    it("CLOCKED_IN → ON_BREAK on BREAK_START", () => {
      const result = validateTransition(AttendanceStates.CLOCKED_IN, AttendanceActions.BREAK_START, ts);
      expect(result.success).toBe(true);
      if (result.success) expect(result.newState).toBe(AttendanceStates.ON_BREAK);
    });

    it("ON_BREAK → CLOCKED_IN on BREAK_END", () => {
      const result = validateTransition(AttendanceStates.ON_BREAK, AttendanceActions.BREAK_END, ts);
      expect(result.success).toBe(true);
      if (result.success) expect(result.newState).toBe(AttendanceStates.CLOCKED_IN);
    });
  });

  describe("invalid transitions", () => {
    it("IDLE → CLOCK_OUT is invalid", () => {
      const result = validateTransition(AttendanceStates.IDLE, AttendanceActions.CLOCK_OUT, ts);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.currentState).toBe(AttendanceStates.IDLE);
        expect(result.lastEventTimestamp).toBe(ts);
        expect(result.error).toContain(AttendanceStates.IDLE);
      }
    });

    it("IDLE → BREAK_START is invalid", () => {
      const result = validateTransition(AttendanceStates.IDLE, AttendanceActions.BREAK_START, ts);
      expect(result.success).toBe(false);
    });

    it("IDLE → BREAK_END is invalid", () => {
      const result = validateTransition(AttendanceStates.IDLE, AttendanceActions.BREAK_END, ts);
      expect(result.success).toBe(false);
    });

    it("CLOCKED_IN → CLOCK_IN is invalid", () => {
      const result = validateTransition(AttendanceStates.CLOCKED_IN, AttendanceActions.CLOCK_IN, ts);
      expect(result.success).toBe(false);
    });

    it("CLOCKED_IN → BREAK_END is invalid", () => {
      const result = validateTransition(AttendanceStates.CLOCKED_IN, AttendanceActions.BREAK_END, ts);
      expect(result.success).toBe(false);
    });

    it("ON_BREAK → CLOCK_IN is invalid", () => {
      const result = validateTransition(AttendanceStates.ON_BREAK, AttendanceActions.CLOCK_IN, ts);
      expect(result.success).toBe(false);
    });

    it("ON_BREAK → CLOCK_OUT is invalid", () => {
      const result = validateTransition(AttendanceStates.ON_BREAK, AttendanceActions.CLOCK_OUT, ts);
      expect(result.success).toBe(false);
    });

    it("ON_BREAK → BREAK_START is invalid", () => {
      const result = validateTransition(AttendanceStates.ON_BREAK, AttendanceActions.BREAK_START, ts);
      expect(result.success).toBe(false);
    });
  });

  describe("multiple sessions", () => {
    it("allows clock-in again after clock-out (IDLE → CLOCKED_IN)", () => {
      const r1 = validateTransition(AttendanceStates.IDLE, AttendanceActions.CLOCK_IN, ts);
      expect(r1.success).toBe(true);
      if (!r1.success) return;

      const r2 = validateTransition(r1.newState, AttendanceActions.CLOCK_OUT, "2024-01-15T12:00:00Z");
      expect(r2.success).toBe(true);
      if (!r2.success) return;

      const r3 = validateTransition(r2.newState, AttendanceActions.CLOCK_IN, "2024-01-15T13:00:00Z");
      expect(r3.success).toBe(true);
      if (r3.success) expect(r3.newState).toBe(AttendanceStates.CLOCKED_IN);
    });
  });
});
