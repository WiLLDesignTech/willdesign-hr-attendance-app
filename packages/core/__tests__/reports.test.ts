import { describe, it, expect } from "vitest";
import {
  extractReferences,
  parseReport,
  createNewVersion,
  hasMissingReferences,
} from "../src/reports/parser.js";
import { ReferenceTypes } from "@willdesign-hr/types";

describe("Reference Extraction", () => {
  it("extracts JIRA ticket IDs", () => {
    const refs = extractReferences("Fixed HR-123 and PROJ-456 today");
    expect(refs).toContainEqual({ type: ReferenceTypes.JIRA, id: "HR-123" });
    expect(refs).toContainEqual({ type: ReferenceTypes.JIRA, id: "PROJ-456" });
  });

  it("extracts GitHub PR references", () => {
    const refs = extractReferences("Reviewed willdesign/hr#45 and core#12");
    expect(refs).toContainEqual({ type: ReferenceTypes.GITHUB_PR, id: "willdesign/hr#45" });
    expect(refs).toContainEqual({ type: ReferenceTypes.GITHUB_PR, id: "core#12" });
  });

  it("extracts both JIRA and GitHub from same text", () => {
    const refs = extractReferences("Working on HR-99, PR at repo#10");
    expect(refs).toHaveLength(2);
  });

  it("matches 2+ char JIRA prefixes like V8-2", () => {
    const refs = extractReferences("Using V8-2 engine");
    expect(refs).toContainEqual({ type: ReferenceTypes.JIRA, id: "V8-2" });
  });

  it("returns empty array for no references", () => {
    const refs = extractReferences("Had a meeting, no code work today");
    expect(refs).toHaveLength(0);
  });

  it("deduplicates references", () => {
    const refs = extractReferences("HR-123 is related to HR-123");
    expect(refs).toHaveLength(1);
  });
});

describe("Report Parsing", () => {
  it("parses a report with all sections", () => {
    const text = `Yesterday: Fixed HR-123 bug
Today: Working on PROJ-456
Blockers: None`;
    const result = parseReport(text);
    expect(result.yesterday).toContain("Fixed HR-123");
    expect(result.today).toContain("PROJ-456");
    expect(result.blockers).toContain("None");
    expect(result.references).toHaveLength(2);
  });

  it("parses report without explicit sections (treats as freeform)", () => {
    const text = "Worked on HR-123 all day, will continue tomorrow";
    const result = parseReport(text);
    expect(result.yesterday).toBe(text);
    expect(result.references).toHaveLength(1);
  });
});

describe("Missing References Warning", () => {
  it("returns true when no references found", () => {
    expect(hasMissingReferences([])).toBe(true);
  });

  it("returns false when references exist", () => {
    expect(hasMissingReferences([{ type: ReferenceTypes.JIRA, id: "HR-1" }])).toBe(false);
  });
});

describe("Versioned Edits", () => {
  it("creates a new version with incremented version number", () => {
    const original = {
      id: "REPORT#001",
      employeeId: "EMP#001",
      date: "2024-01-15",
      yesterday: "Old text",
      today: "Old plan",
      blockers: "None",
      references: [],
      version: 1,
      slackMessageTs: "1705312000.000100",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    };
    const newVersion = createNewVersion(original, "Updated: Fixed HR-456\nToday: Deploy\nBlockers: CI failing");
    expect(newVersion.version).toBe(2);
    expect(newVersion.yesterday).toContain("HR-456");
    expect(newVersion.references).toHaveLength(1);
    expect(newVersion.id).toBe(original.id);
  });
});
