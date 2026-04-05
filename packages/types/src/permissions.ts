import { Roles } from "./constants.js";

export type Role =
  | "EMPLOYEE"
  | "MANAGER"
  | "HR_MANAGER"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "AI_AGENT"
  | (string & {});

export type SensitivityLevel = "PUBLIC" | "INTERNAL" | "SENSITIVE" | "CONFIDENTIAL";

export interface AuthContext {
  readonly tenantId: string;
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

// ─── Permission Constants ───
export const Permissions = {
  EMPLOYEE_LIST_ALL: "employee:list_all",
  EMPLOYEE_UPDATE: "employee:update",
  LEAVE_APPROVE: "leave:approve",
  FLAG_RESOLVE: "flag:resolve",
  BANK_APPROVE: "bank:approve",
  ATTENDANCE_LOCK: "attendance:lock",
  ONBOARD: "admin:onboard",
  OFFBOARD: "admin:offboard",
  AUDIT_VIEW: "admin:audit_view",
  POLICY_UPDATE: "admin:policy_update",
  HOLIDAY_MANAGE: "holiday:manage",
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

// ─── Role-to-Permission Mapping ───
const EMPLOYEE_PERMISSIONS: readonly Permission[] = [];

const MANAGER_PERMISSIONS: readonly Permission[] = [
  ...EMPLOYEE_PERMISSIONS,
  Permissions.EMPLOYEE_LIST_ALL,
  Permissions.LEAVE_APPROVE,
  Permissions.FLAG_RESOLVE,
  Permissions.BANK_APPROVE,
];

const HR_MANAGER_PERMISSIONS: readonly Permission[] = [
  ...MANAGER_PERMISSIONS,
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...HR_MANAGER_PERMISSIONS,
  Permissions.EMPLOYEE_UPDATE,
  Permissions.ONBOARD,
  Permissions.OFFBOARD,
  Permissions.AUDIT_VIEW,
  Permissions.POLICY_UPDATE,
  Permissions.HOLIDAY_MANAGE,
  Permissions.ATTENDANCE_LOCK,
];

const ALL_PERMISSIONS: readonly Permission[] = Object.values(Permissions);

const AI_AGENT_PERMISSIONS: readonly Permission[] = [
  Permissions.EMPLOYEE_LIST_ALL,
  Permissions.EMPLOYEE_UPDATE,
];

export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  [Roles.EMPLOYEE]: EMPLOYEE_PERMISSIONS,
  [Roles.MANAGER]: MANAGER_PERMISSIONS,
  [Roles.HR_MANAGER]: HR_MANAGER_PERMISSIONS,
  [Roles.ADMIN]: ADMIN_PERMISSIONS,
  [Roles.SUPER_ADMIN]: ALL_PERMISSIONS,
  [Roles.AI_AGENT]: AI_AGENT_PERMISSIONS,
};
