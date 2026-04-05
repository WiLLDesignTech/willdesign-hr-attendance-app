import { AttendanceStates } from "@hr-attendance-app/types";
import type { AttendanceState } from "@hr-attendance-app/types";
import type { theme } from "../theme/theme";

export type ThemeColorKey = keyof typeof theme.colors;
type BadgeVariant = "success" | "info" | "warning";

export interface AttendanceStatusEntry {
  readonly labelKey: string;
  readonly color: ThemeColorKey;
  readonly variant: BadgeVariant;
}

export const ATTENDANCE_STATUS_CONFIG: Record<AttendanceState, AttendanceStatusEntry> = {
  [AttendanceStates.IDLE]: { labelKey: "dashboard.statusIdle", color: "textMuted", variant: "success" },
  [AttendanceStates.CLOCKED_IN]: { labelKey: "dashboard.statusWorking", color: "accent", variant: "info" },
  [AttendanceStates.ON_BREAK]: { labelKey: "dashboard.statusBreak", color: "warning", variant: "warning" },
};

const ERROR_PATTERNS: readonly { readonly pattern: RegExp; readonly key: string }[] = [
  { pattern: /idempotency window/i, key: "dashboard.errorTooFast" },
  { pattern: /cannot CLOCK_IN while in CLOCKED_IN/i, key: "dashboard.errorAlreadyClockedIn" },
  { pattern: /cannot CLOCK_OUT while in IDLE/i, key: "dashboard.errorAlreadyIdle" },
  { pattern: /is locked/i, key: "dashboard.errorLocked" },
  { pattern: /Invalid transition/i, key: "dashboard.errorInvalidTransition" },
];

/** Map a raw backend clock-action error to a user-friendly i18n key. */
export const clockErrorToI18nKey = (error: unknown): string => {
  const msg = error instanceof Error ? error.message : String(error);
  const match = ERROR_PATTERNS.find((p) => p.pattern.test(msg));
  return match?.key ?? "dashboard.errorGeneric";
};
