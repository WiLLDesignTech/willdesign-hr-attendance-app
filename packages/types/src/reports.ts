export type ReferenceType = "JIRA" | "GITHUB_PR" | "GITHUB_ISSUE" | "OTHER";

export interface ReportReference {
  readonly type: ReferenceType;
  readonly id: string;
}

export interface DailyReport {
  readonly id: string;
  readonly employeeId: string;
  readonly date: string;
  readonly yesterday: string;
  readonly today: string;
  readonly blockers: string;
  readonly references: readonly ReportReference[];
  readonly version: number;
  readonly slackMessageTs: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
