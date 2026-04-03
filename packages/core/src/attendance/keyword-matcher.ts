import type { AttendanceAction } from "@hr-attendance-app/types";
import { AttendanceActions } from "@hr-attendance-app/types";

export interface KeywordConfig {
  readonly language: "en" | "ja";
  readonly mappings: Record<AttendanceAction, readonly string[]>;
}

export type MatchResult =
  | { matched: true; action: AttendanceAction; keyword: string }
  | { matched: false };

export type CommandResult =
  | { type: "LANGUAGE"; language: string }
  | { type: "HELP" }
  | null;

export const DEFAULT_KEYWORD_CONFIGS: readonly KeywordConfig[] = [
  {
    language: "en",
    mappings: {
      [AttendanceActions.CLOCK_IN]: ["hello", "hi", "good morning"],
      [AttendanceActions.BREAK_START]: ["break", "brb"],
      [AttendanceActions.BREAK_END]: ["back", "i'm back"],
      [AttendanceActions.CLOCK_OUT]: ["bye", "goodbye", "good night"],
    },
  },
  {
    language: "ja",
    mappings: {
      [AttendanceActions.CLOCK_IN]: ["おはよう", "出勤"],
      [AttendanceActions.BREAK_START]: ["休憩"],
      [AttendanceActions.BREAK_END]: ["戻り", "戻りました"],
      [AttendanceActions.CLOCK_OUT]: ["おつかれ", "退勤"],
    },
  },
];

function wordBoundaryMatch(text: string, keyword: string): boolean {
  // Japanese keywords don't use spaces — use includes for non-ASCII
  const isAscii = /^[\x20-\x7E]+$/.test(keyword);
  if (!isAscii) {
    return text.includes(keyword);
  }
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`, "i").test(text);
}

export function matchKeyword(
  messageText: string,
  configs: readonly KeywordConfig[],
): MatchResult {
  const lower = messageText.toLowerCase();

  for (const config of configs) {
    for (const [action, keywords] of Object.entries(config.mappings)) {
      for (const keyword of keywords) {
        if (wordBoundaryMatch(lower, keyword.toLowerCase())) {
          return { matched: true, action: action as AttendanceAction, keyword };
        }
      }
    }
  }

  return { matched: false };
}

const LANGUAGE_PATTERNS = [
  /^lang\s+(en|ja|ne)$/i,
  /^言語\s+(en|ja|ne)$/i,
];

const HELP_PATTERNS = [/^help$/i, /^ヘルプ$/i];

export function matchCommand(messageText: string): CommandResult {
  const trimmed = messageText.trim();

  for (const pattern of LANGUAGE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return { type: "LANGUAGE", language: match[1].toLowerCase() };
    }
  }

  for (const pattern of HELP_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { type: "HELP" };
    }
  }

  return null;
}
