import type { AuditEntry } from "@hr-attendance-app/types";
import type { AuditRepository } from "../repositories/audit.js";

export interface AuditServiceDeps {
  readonly auditRepo: AuditRepository;
}

export class AuditService {
  private readonly deps: AuditServiceDeps;

  constructor(deps: AuditServiceDeps) {
    this.deps = deps;
  }

  async findByTarget(targetId: string): Promise<readonly AuditEntry[]> {
    return this.deps.auditRepo.findByTarget(targetId);
  }
}
