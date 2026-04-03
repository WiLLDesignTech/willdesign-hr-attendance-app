import { describe, it, expect } from "vitest";
import {
  classifyChannel,
  buildAttendanceReply,
  buildErrorReply,
  buildGuidebookMessage,
  CHANNEL_PURPOSES,
} from "../src/events/handlers.js";
import { AttendanceActions, AttendanceStates } from "@hr-attendance-app/types";

describe("Channel Classification (14.1)", () => {
  it("classifies attendance channel", () => {
    expect(classifyChannel("attendance")).toBe(CHANNEL_PURPOSES.ATTENDANCE);
  });

  it("classifies reporting channel", () => {
    expect(classifyChannel("reporting")).toBe(CHANNEL_PURPOSES.REPORTING);
  });

  it("classifies both channel", () => {
    expect(classifyChannel("both")).toBe(CHANNEL_PURPOSES.BOTH);
  });

  it("returns null for unknown purpose", () => {
    expect(classifyChannel("random")).toBeNull();
  });
});

describe("Attendance Reply Builder (14.2)", () => {
  it("builds EN clock-in reply", () => {
    const reply = buildAttendanceReply({
      action: AttendanceActions.CLOCK_IN,
      employeeName: "Taro",
      timestamp: "2024-01-15T09:00:00Z",
      language: "en",
    });
    expect(reply).toContain("Taro");
    expect(reply).toContain("clocked in");
    expect(reply).not.toContain("hours"); // no personal data in public channel
  });

  it("builds JA clock-in reply", () => {
    const reply = buildAttendanceReply({
      action: AttendanceActions.CLOCK_IN,
      employeeName: "太郎",
      timestamp: "2024-01-15T09:00:00Z",
      language: "ja",
    });
    expect(reply).toContain("太郎");
    expect(reply).toContain("出勤");
  });

  it("builds EN clock-out reply", () => {
    const reply = buildAttendanceReply({
      action: AttendanceActions.CLOCK_OUT,
      employeeName: "Taro",
      timestamp: "2024-01-15T18:00:00Z",
      language: "en",
    });
    expect(reply).toContain("clocked out");
  });

  it("builds EN break reply", () => {
    const reply = buildAttendanceReply({
      action: AttendanceActions.BREAK_START,
      employeeName: "Taro",
      timestamp: "2024-01-15T12:00:00Z",
      language: "en",
    });
    expect(reply).toContain("break");
  });
});

describe("Error Reply Builder (14.2)", () => {
  it("builds EN error message", () => {
    const reply = buildErrorReply({
      currentState: AttendanceStates.IDLE,
      attemptedAction: AttendanceActions.CLOCK_OUT,
      lastTimestamp: "2024-01-15T09:00:00Z",
      language: "en",
    });
    expect(reply).toContain(AttendanceStates.IDLE);
    expect(reply).toContain("Cannot");
  });

  it("builds JA error message", () => {
    const reply = buildErrorReply({
      currentState: AttendanceStates.IDLE,
      attemptedAction: AttendanceActions.CLOCK_OUT,
      lastTimestamp: "2024-01-15T09:00:00Z",
      language: "ja",
    });
    expect(reply).toContain("できません");
  });
});

describe("Guidebook (14.3)", () => {
  it("builds EN guidebook", () => {
    const msg = buildGuidebookMessage("en");
    expect(msg).toContain("hello");
    expect(msg).toContain("bye");
    expect(msg).toContain("lang");
    expect(msg).toContain("help");
  });

  it("builds JA guidebook", () => {
    const msg = buildGuidebookMessage("ja");
    expect(msg).toContain("おはよう");
    expect(msg).toContain("おつかれ");
    expect(msg).toContain("言語");
    expect(msg).toContain("ヘルプ");
  });
});
