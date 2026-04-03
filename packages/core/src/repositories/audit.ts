import type { AuditAction, AuditEntry } from "@hr-attendance-app/types";

export interface AuditQueryOptions {
  readonly from?: string;
  readonly to?: string;
  readonly action?: AuditAction;
}

export interface AuditRepository {
  append(entry: AuditEntry): Promise<void>;
  findByTarget(targetId: string, options?: AuditQueryOptions): Promise<readonly AuditEntry[]>;
  findByActor(actorId: string, options?: AuditQueryOptions): Promise<readonly AuditEntry[]>;
}
