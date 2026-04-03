import type { Flag, FlagStatus } from "@willdesign-hr/types";
import type { FlagRepository } from "../repositories/flag.js";

export interface FlagQueryServiceDeps {
  readonly flagRepo: FlagRepository;
}

export class FlagQueryService {
  private readonly deps: FlagQueryServiceDeps;

  constructor(deps: FlagQueryServiceDeps) {
    this.deps = deps;
  }

  async findPending(): Promise<readonly Flag[]> {
    return this.deps.flagRepo.findPending();
  }

  async findByEmployee(employeeId: string, options?: { status?: FlagStatus }): Promise<readonly Flag[]> {
    return this.deps.flagRepo.findByEmployee(employeeId, options);
  }
}
