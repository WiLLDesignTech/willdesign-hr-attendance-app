import type { AttendanceAction, AttendanceState } from "@hr-attendance-app/types";
import { AttendanceActions, AttendanceStates } from "@hr-attendance-app/types";

export type TransitionResult =
  | { success: true; newState: AttendanceState }
  | { success: false; error: string; currentState: AttendanceState; lastEventTimestamp: string };

const VALID_TRANSITIONS: Record<AttendanceState, Partial<Record<AttendanceAction, AttendanceState>>> = {
  [AttendanceStates.IDLE]: {
    [AttendanceActions.CLOCK_IN]: AttendanceStates.CLOCKED_IN,
  },
  [AttendanceStates.CLOCKED_IN]: {
    [AttendanceActions.CLOCK_OUT]: AttendanceStates.IDLE,
    [AttendanceActions.BREAK_START]: AttendanceStates.ON_BREAK,
  },
  [AttendanceStates.ON_BREAK]: {
    [AttendanceActions.BREAK_END]: AttendanceStates.CLOCKED_IN,
  },
};

export function validateTransition(
  currentState: AttendanceState,
  action: AttendanceAction,
  lastEventTimestamp: string,
): TransitionResult {
  const newState = VALID_TRANSITIONS[currentState]?.[action];

  if (newState) {
    return { success: true, newState };
  }

  return {
    success: false,
    error: `Invalid transition: cannot ${action} while in ${currentState} state (last event at ${lastEventTimestamp})`,
    currentState,
    lastEventTimestamp,
  };
}
