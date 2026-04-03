import { describe, it, expect } from "vitest";
import { matchKeyword, matchCommand, DEFAULT_KEYWORD_CONFIGS } from "../src/attendance/keyword-matcher.js";
import { AttendanceActions } from "@hr-attendance-app/types";

describe("Keyword Matcher", () => {
  describe("English keywords", () => {
    it("matches clock-in keywords", () => {
      const result = matchKeyword("hello everyone", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.CLOCK_IN);
    });

    it("matches hi as clock-in", () => {
      const result = matchKeyword("hi team", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.CLOCK_IN);
    });

    it("matches break keyword", () => {
      const result = matchKeyword("going on break", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.BREAK_START);
    });

    it("matches back keyword", () => {
      const result = matchKeyword("back from lunch", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.BREAK_END);
    });

    it("matches clock-out keywords", () => {
      const result = matchKeyword("bye all", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.CLOCK_OUT);
    });
  });

  describe("Japanese keywords", () => {
    it("matches おはよう as clock-in", () => {
      const result = matchKeyword("おはようございます", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.CLOCK_IN);
    });

    it("matches 休憩 as break", () => {
      const result = matchKeyword("休憩します", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.BREAK_START);
    });

    it("matches 戻り as back", () => {
      const result = matchKeyword("戻りました", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.BREAK_END);
    });

    it("matches おつかれ as clock-out", () => {
      const result = matchKeyword("おつかれさまです", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.CLOCK_OUT);
    });
  });

  describe("case insensitivity", () => {
    it("matches HELLO as clock-in", () => {
      const result = matchKeyword("HELLO", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.CLOCK_IN);
    });

    it("matches BYE as clock-out", () => {
      const result = matchKeyword("BYE", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(true);
      if (result.matched) expect(result.action).toBe(AttendanceActions.CLOCK_OUT);
    });
  });

  describe("no match", () => {
    it("returns no match for unrelated messages", () => {
      const result = matchKeyword("I finished the PR review", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(false);
    });

    it("returns no match for empty string", () => {
      const result = matchKeyword("", DEFAULT_KEYWORD_CONFIGS);
      expect(result.matched).toBe(false);
    });

    it("does not match keyword fragment inside longer word", () => {
      expect(matchKeyword("this is shipping feedback", DEFAULT_KEYWORD_CONFIGS).matched).toBe(false);
    });

    it("does not match 'hi' inside 'this'", () => {
      expect(matchKeyword("this is fine", DEFAULT_KEYWORD_CONFIGS).matched).toBe(false);
    });
  });
});

describe("Command Matcher", () => {
  it("matches lang en command", () => {
    const result = matchCommand("lang en");
    expect(result).toEqual({ type: "LANGUAGE", language: "en" });
  });

  it("matches lang ja command", () => {
    const result = matchCommand("lang ja");
    expect(result).toEqual({ type: "LANGUAGE", language: "ja" });
  });

  it("matches 言語 en command", () => {
    const result = matchCommand("言語 en");
    expect(result).toEqual({ type: "LANGUAGE", language: "en" });
  });

  it("matches help command", () => {
    const result = matchCommand("help");
    expect(result).toEqual({ type: "HELP" });
  });

  it("matches ヘルプ command", () => {
    const result = matchCommand("ヘルプ");
    expect(result).toEqual({ type: "HELP" });
  });

  it("returns null for non-command", () => {
    const result = matchCommand("hello everyone");
    expect(result).toBeNull();
  });
});
