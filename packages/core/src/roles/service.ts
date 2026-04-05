import type { RoleDefinition } from "@hr-attendance-app/types";
import type { RoleRepository } from "../repositories/role.js";

export interface RoleServiceDeps {
  readonly roleRepo: RoleRepository;
}

export class RoleService {
  private readonly deps: RoleServiceDeps;

  constructor(deps: RoleServiceDeps) {
    this.deps = deps;
  }

  async findAll(): Promise<readonly RoleDefinition[]> {
    return this.deps.roleRepo.findAll();
  }

  async findByName(name: string): Promise<RoleDefinition | null> {
    return this.deps.roleRepo.findByName(name);
  }

  async save(role: RoleDefinition): Promise<RoleDefinition> {
    return this.deps.roleRepo.save(role);
  }
}
