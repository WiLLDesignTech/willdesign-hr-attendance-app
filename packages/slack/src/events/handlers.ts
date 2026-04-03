import type { AttendanceAction, AttendanceState } from "@hr-attendance-app/types";
import { AppBranding, AttendanceActions } from "@hr-attendance-app/types";

export const CHANNEL_PURPOSES = {
  ATTENDANCE: "attendance",
  REPORTING: "reporting",
  BOTH: "both",
} as const;

export type ChannelPurpose = typeof CHANNEL_PURPOSES[keyof typeof CHANNEL_PURPOSES];

/**
 * Classify a channel's purpose from config.
 */
export function classifyChannel(purpose: string): ChannelPurpose | null {
  if (purpose === CHANNEL_PURPOSES.ATTENDANCE) return CHANNEL_PURPOSES.ATTENDANCE;
  if (purpose === CHANNEL_PURPOSES.REPORTING) return CHANNEL_PURPOSES.REPORTING;
  if (purpose === CHANNEL_PURPOSES.BOTH) return CHANNEL_PURPOSES.BOTH;
  return null;
}

// ─── Reply Templates ───

interface AttendanceReplyInput {
  readonly action: AttendanceAction;
  readonly employeeName: string;
  readonly timestamp: string;
  readonly language: string;
}

const ACTION_LABELS_EN: Record<AttendanceAction, string> = {
  [AttendanceActions.CLOCK_IN]: "clocked in",
  [AttendanceActions.CLOCK_OUT]: "clocked out",
  [AttendanceActions.BREAK_START]: "started break",
  [AttendanceActions.BREAK_END]: "returned from break",
};

const ACTION_LABELS_JA: Record<AttendanceAction, string> = {
  [AttendanceActions.CLOCK_IN]: "出勤しました",
  [AttendanceActions.CLOCK_OUT]: "退勤しました",
  [AttendanceActions.BREAK_START]: "休憩を開始しました",
  [AttendanceActions.BREAK_END]: "休憩から戻りました",
};

/**
 * Build public-safe attendance reply (no personal data).
 */
export function buildAttendanceReply(input: AttendanceReplyInput): string {
  const time = input.timestamp.split("T")[1]?.split(".")[0] ?? input.timestamp;

  if (input.language === "ja") {
    const label = ACTION_LABELS_JA[input.action];
    return `${input.employeeName}さんが${label} (${time})`;
  }

  const label = ACTION_LABELS_EN[input.action];
  return `${input.employeeName} ${label} at ${time}`;
}

interface ErrorReplyInput {
  readonly currentState: AttendanceState;
  readonly attemptedAction: AttendanceAction;
  readonly lastTimestamp: string;
  readonly language: string;
}

/**
 * Build error reply for invalid transition.
 */
export function buildErrorReply(input: ErrorReplyInput): string {
  if (input.language === "ja") {
    return `現在の状態は ${input.currentState} のため、${input.attemptedAction} はできません（最後のイベント: ${input.lastTimestamp}）`;
  }

  return `Cannot ${input.attemptedAction} while in ${input.currentState} state (last event: ${input.lastTimestamp})`;
}

/**
 * Build guidebook ephemeral message.
 */
export function buildGuidebookMessage(language: string): string {
  if (language === "ja") {
    return [
      `📖 *${AppBranding.appName} ガイドブック*`,
      "",
      "*出退勤キーワード:*",
      "• 出勤: `おはよう`, `出勤`",
      "• 休憩: `休憩`",
      "• 戻り: `戻り`, `戻りました`",
      "• 退勤: `おつかれ`, `退勤`",
      "",
      "*コマンド:*",
      "• 言語変更: `言語 en` / `lang ja`",
      "• ヘルプ: `ヘルプ` / `help`",
      "",
      "*日報:*",
      "レポートチャンネルにメッセージを投稿してください。",
      "JIRA/GitHubの参照があれば自動抽出されます。",
    ].join("\n");
  }

  return [
    `📖 *${AppBranding.appName} Guidebook*`,
    "",
    "*Attendance Keywords:*",
    "• Clock in: `hello`, `hi`, `good morning`",
    "• Break: `break`, `brb`",
    "• Back: `back`, `i'm back`",
    "• Clock out: `bye`, `goodbye`, `good night`",
    "",
    "*Commands:*",
    "• Change language: `lang en` / `lang ja`",
    "• Help: `help` / `ヘルプ`",
    "",
    "*Daily Reports:*",
    "Post your report in the reporting channel.",
    "JIRA/GitHub references are extracted automatically.",
  ].join("\n");
}
