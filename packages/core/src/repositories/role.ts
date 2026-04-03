import type { RoleDefinition } from "@hr-attendance-app/types";

export interface RoleRepository {
  findByName(name: string): Promise<RoleDefinition | null>;
  findAll(): Promise<readonly RoleDefinition[]>;
  save(role: RoleDefinition): Promise<RoleDefinition>;
  delete(name: string): Promise<void>;
}
