import type { ReportReference, DailyReport } from "@willdesign-hr/types";
import { ReferenceTypes, nowIso } from "@willdesign-hr/types";

const JIRA_PATTERN = /\b([A-Z][A-Z0-9]{1,9}-\d+)\b/g;
const GITHUB_PATTERN = /\b([\w.-]+(?:\/[\w.-]+)?#\d+)\b/g;

/**
 * Extract JIRA and GitHub references from text.
 */
export function extractReferences(text: string): ReportReference[] {
  const refs = new Map<string, ReportReference>();

  for (const match of text.matchAll(JIRA_PATTERN)) {
    const id = match[1]!;
    refs.set(id, { type: ReferenceTypes.JIRA, id });
  }

  for (const match of text.matchAll(GITHUB_PATTERN)) {
    const id = match[1]!;
    if (!refs.has(id)) {
      refs.set(id, { type: ReferenceTypes.GITHUB_PR, id });
    }
  }

  return [...refs.values()];
}

const SECTION_PATTERN = /(?:^|\n)\s*(?:yesterday|昨日)\s*[:\uff1a]\s*([\s\S]*?)(?=\n\s*(?:today|本日|blockers?|ブロッカー)\s*[:\uff1a]|$)/i;
const TODAY_PATTERN = /(?:^|\n)\s*(?:today|本日)\s*[:\uff1a]\s*([\s\S]*?)(?=\n\s*(?:blockers?|ブロッカー)\s*[:\uff1a]|$)/i;
const BLOCKERS_PATTERN = /(?:^|\n)\s*(?:blockers?|ブロッカー)\s*[:\uff1a]\s*([\s\S]*?)$/i;

export interface ParsedReport {
  readonly yesterday: string;
  readonly today: string;
  readonly blockers: string;
  readonly references: readonly ReportReference[];
}

/**
 * Parse a report message into structured sections.
 * Falls back to freeform (entire text as yesterday) if sections not found.
 */
export function parseReport(text: string): ParsedReport {
  const yesterdayMatch = text.match(SECTION_PATTERN);
  const todayMatch = text.match(TODAY_PATTERN);
  const blockersMatch = text.match(BLOCKERS_PATTERN);

  const yesterday = yesterdayMatch?.[1]?.trim() ?? text.trim();
  const today = todayMatch?.[1]?.trim() ?? "";
  const blockers = blockersMatch?.[1]?.trim() ?? "";

  return {
    yesterday,
    today,
    blockers,
    references: extractReferences(text),
  };
}

/**
 * Check if a report has no JIRA/GitHub references.
 */
export function hasMissingReferences(references: readonly ReportReference[]): boolean {
  return references.length === 0;
}

/**
 * Create a new version of an existing report from edited message text.
 */
export function createNewVersion(
  original: DailyReport,
  newText: string,
): DailyReport {
  const parsed = parseReport(newText);
  return {
    ...original,
    yesterday: parsed.yesterday,
    today: parsed.today,
    blockers: parsed.blockers,
    references: parsed.references,
    version: original.version + 1,
    updatedAt: nowIso(),
  };
}
