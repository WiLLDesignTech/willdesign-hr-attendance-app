import { AttendanceStates } from "@hr-attendance-app/types";
import type { AttendanceState } from "@hr-attendance-app/types";
import type { theme } from "../theme/theme";

export type ThemeColorKey = keyof typeof theme.colors;
type BadgeVariant = "success" | "info" | "warning" | "danger";

export interface AttendanceStatusEntry {
  readonly labelKey: string;
  readonly color: ThemeColorKey;
  readonly variant: BadgeVariant;
}

export const ATTENDANCE_STATUS_CONFIG: Record<AttendanceState, AttendanceStatusEntry> = {
  [AttendanceStates.IDLE]: { labelKey: "dashboard.statusIdle", color: "textMuted", variant: "danger" },
  [AttendanceStates.CLOCKED_IN]: { labelKey: "dashboard.statusWorking", color: "accent", variant: "success" },
  [AttendanceStates.ON_BREAK]: { labelKey: "dashboard.statusBreak", color: "warning", variant: "warning" },
};

const TOO_FAST_PATTERN = /\|(\d+)$/;

const ERROR_PATTERNS: readonly { readonly pattern: RegExp; readonly key: string }[] = [
  { pattern: /cannot CLOCK_IN while in CLOCKED_IN/i, key: "dashboard.errorAlreadyClockedIn" },
  { pattern: /cannot CLOCK_OUT while in IDLE/i, key: "dashboard.errorAlreadyIdle" },
  { pattern: /is locked/i, key: "dashboard.errorLocked" },
  { pattern: /Invalid transition|not available/i, key: "dashboard.errorInvalidTransition" },
];

/**
 * Map a raw backend clock-action error to a user-friendly translated message.
 * Requires a `t` function for i18n interpolation (countdown seconds).
 */
export const formatClockError = (
  error: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string => {
  const msg = error instanceof Error ? error.message : String(error);

  // "Please wait...|42" → extract remaining seconds
  const tooFastMatch = TOO_FAST_PATTERN.exec(msg);
  if (tooFastMatch) {
    const seconds = parseInt(tooFastMatch[1]!, 10);
    return t("dashboard.errorTooFast", { seconds });
  }

  const match = ERROR_PATTERNS.find((p) => p.pattern.test(msg));
  return t(match?.key ?? "dashboard.errorGeneric");
};
