/**
 * Role and permission-based access hooks for conditional UI rendering.
 * Uses permission constants from @hr-attendance-app/types.
 */
import { useAuth } from "./useAuth";
import { Roles, Permissions } from "@hr-attendance-app/types";
import type { Permission } from "@hr-attendance-app/types";

export const ROLE_LEVELS: Record<string, number> = {
  [Roles.EMPLOYEE]: 0,
  [Roles.MANAGER]: 1,
  [Roles.HR_MANAGER]: 2,
  [Roles.ADMIN]: 3,
  [Roles.SUPER_ADMIN]: 4,
};

function getRoleLevel(role: string | null): number {
  return ROLE_LEVELS[role ?? Roles.EMPLOYEE] ?? 0;
}

/** Returns the current user's numeric role level. */
export function useRoleLevel(): number {
  const { role } = useAuth();
  return getRoleLevel(role);
}

/** Returns true if the current user's role is at least the given minimum. */
export function useHasMinimumRole(minimumRole: string): boolean {
  const level = useRoleLevel();
  return level >= getRoleLevel(minimumRole);
}

/** Returns true if the current user has the specified permission. */
export function useHasPermission(permission: Permission): boolean {
  const { permissions } = useAuth();
  return permissions.includes(permission);
}

/** Returns true if user has manager-level permissions. */
export function useIsManager(): boolean {
  return useHasPermission(Permissions.LEAVE_APPROVE);
}

/** Returns true if user has admin-level permissions. */
export function useIsAdmin(): boolean {
  return useHasPermission(Permissions.ONBOARD);
}
