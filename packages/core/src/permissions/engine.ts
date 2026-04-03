import type { AuthContext, AuthorizationResult, Permission, ResourceContext, Role } from "@hr-attendance-app/types";
import { Roles, SensitivityLevels, ROLE_PERMISSIONS } from "@hr-attendance-app/types";

export const ROLE_HIERARCHY: readonly Role[] = [
  Roles.EMPLOYEE,
  Roles.MANAGER,
  Roles.HR_MANAGER,
  Roles.ADMIN,
  Roles.SUPER_ADMIN,
] as const;

function isSuperAdmin(role: Role): boolean {
  return role === Roles.SUPER_ADMIN;
}

export function getRoleLevel(role: Role): number {
  const index = ROLE_HIERARCHY.indexOf(role);
  return index === -1 ? -1 : index;
}

export function hasMinimumRole(actorRole: Role, minimumRole: Role): boolean {
  if (isSuperAdmin(actorRole)) return true;
  const actorLevel = getRoleLevel(actorRole);
  const requiredLevel = getRoleLevel(minimumRole);
  if (actorLevel === -1 || requiredLevel === -1) return false;
  return actorLevel >= requiredLevel;
}

export function hasPermission(actor: AuthContext, permission: Permission): boolean {
  if (isSuperAdmin(actor.actorRole)) return true;
  if (actor.actorCustomPermissions.includes(permission)) return true;
  const rolePerms = ROLE_PERMISSIONS[actor.actorRole];
  return rolePerms?.includes(permission) ?? false;
}

// Action-specific authorization (read vs write/delete) deferred to handler middleware
export function authorize(
  actor: AuthContext,
  _action: string,
  resource: ResourceContext,
): AuthorizationResult {
  if (isSuperAdmin(actor.actorRole)) {
    return { allowed: true, reason: "super_admin bypass" };
  }

  if (hasMinimumRole(actor.actorRole, Roles.ADMIN)) {
    return { allowed: true, reason: "admin role grants full access" };
  }

  if (actor.actorId === resource.resourceOwnerId) {
    return { allowed: true, reason: "own resource access" };
  }

  if (resource.sensitivityLevel === SensitivityLevels.PUBLIC) {
    return { allowed: true, reason: "public data" };
  }

  if (
    actor.actorRole === Roles.MANAGER ||
    actor.actorRole === Roles.HR_MANAGER
  ) {
    if (resource.ownerManagerId === actor.actorId) {
      return { allowed: true, reason: "manager of resource owner" };
    }
  }

  if (
    resource.sensitivityLevel === SensitivityLevels.CONFIDENTIAL ||
    resource.sensitivityLevel === SensitivityLevels.SENSITIVE
  ) {
    return {
      allowed: false,
      reason: `${resource.sensitivityLevel} data requires manager relationship or admin role`,
    };
  }

  return {
    allowed: false,
    reason: "insufficient access: not owner, not manager of owner, not admin",
  };
}
