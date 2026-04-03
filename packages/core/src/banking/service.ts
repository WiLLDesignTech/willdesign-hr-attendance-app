import type { BankEntry, BankApprovalStatus } from "@willdesign-hr/types";
import type { BankRepository } from "../repositories/bank.js";

export interface BankServiceDeps {
  readonly bankRepo: BankRepository;
}

const APPROVED: BankApprovalStatus = "APPROVED";

export class BankService {
  private readonly deps: BankServiceDeps;

  constructor(deps: BankServiceDeps) {
    this.deps = deps;
  }

  async findByEmployee(employeeId: string): Promise<readonly BankEntry[]> {
    return this.deps.bankRepo.findByEmployee(employeeId);
  }

  async approve(entryId: string): Promise<BankEntry> {
    return this.deps.bankRepo.update(entryId, { approvalStatus: APPROVED });
  }
}
