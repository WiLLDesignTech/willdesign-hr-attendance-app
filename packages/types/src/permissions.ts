export type Role =
  | "EMPLOYEE"
  | "MANAGER"
  | "HR_MANAGER"
  | "ADMIN"
  | "SUPER_ADMIN"
  | (string & {});

export type SensitivityLevel = "PUBLIC" | "INTERNAL" | "SENSITIVE" | "CONFIDENTIAL";

export interface AuthContext {
  readonly actorId: string;
  readonly actorRole: Role;
  readonly actorCustomPermissions: readonly string[];
}

export interface ResourceContext {
  readonly resourceType: string;
  readonly resourceOwnerId: string;
  readonly ownerManagerId: string;
  readonly sensitivityLevel: SensitivityLevel;
}

export interface AuthorizationResult {
  readonly allowed: boolean;
  readonly reason: string;
}

export interface RoleDefinition {
  readonly name: string;
  readonly level: number;
  readonly permissions: readonly string[];
  readonly isCustom: boolean;
}
