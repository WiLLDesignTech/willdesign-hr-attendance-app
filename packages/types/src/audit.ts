export type AuditSource = "slack" | "web" | "system" | "admin" | "cron";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "RESOLVE";

export interface AuditEntry {
  readonly id: string;
  readonly targetId: string;
  readonly targetType: string;
  readonly action: string;
  readonly actorId: string;
  readonly source: AuditSource;
  readonly before: Record<string, unknown> | null;
  readonly after: Record<string, unknown> | null;
  readonly timestamp: string;
}
