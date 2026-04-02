import { describe, it, expect } from "vitest";
import {
  ROLE_HIERARCHY,
  getRoleLevel,
  hasMinimumRole,
  hasPermission,
  authorize,
} from "../src/permissions/engine.js";
import type { AuthContext, ResourceContext } from "@willdesign-hr/types";
import { Roles, SensitivityLevels } from "@willdesign-hr/types";

describe("RBAC — Role hierarchy", () => {
  it("defines 5 default roles in order", () => {
    expect(ROLE_HIERARCHY).toEqual([
      Roles.EMPLOYEE,
      Roles.MANAGER,
      Roles.HR_MANAGER,
      Roles.ADMIN,
      Roles.SUPER_ADMIN,
    ]);
  });

  it("returns correct level for each role", () => {
    expect(getRoleLevel(Roles.EMPLOYEE)).toBe(0);
    expect(getRoleLevel(Roles.MANAGER)).toBe(1);
    expect(getRoleLevel(Roles.HR_MANAGER)).toBe(2);
    expect(getRoleLevel(Roles.ADMIN)).toBe(3);
    expect(getRoleLevel(Roles.SUPER_ADMIN)).toBe(4);
  });

  it("returns -1 for unknown/custom roles", () => {
    expect(getRoleLevel("CUSTOM_ROLE")).toBe(-1);
  });

  it("checks minimum role correctly", () => {
    expect(hasMinimumRole(Roles.ADMIN, Roles.MANAGER)).toBe(true);
    expect(hasMinimumRole(Roles.EMPLOYEE, Roles.MANAGER)).toBe(false);
    expect(hasMinimumRole(Roles.MANAGER, Roles.MANAGER)).toBe(true);
    expect(hasMinimumRole(Roles.SUPER_ADMIN, Roles.EMPLOYEE)).toBe(true);
  });

  it("Super Admin always meets minimum role", () => {
    expect(hasMinimumRole(Roles.SUPER_ADMIN, Roles.SUPER_ADMIN)).toBe(true);
  });
});

describe("RBAC — Permission checks", () => {
  it("allows action when actor has explicit permission", () => {
    const actor: AuthContext = {
      actorId: "EMP#001",
      actorRole: Roles.EMPLOYEE,
      actorCustomPermissions: ["leave:approve", "holiday:manage"],
    };
    expect(hasPermission(actor, "leave:approve")).toBe(true);
  });

  it("denies action when actor lacks permission", () => {
    const actor: AuthContext = {
      actorId: "EMP#001",
      actorRole: Roles.EMPLOYEE,
      actorCustomPermissions: [],
    };
    expect(hasPermission(actor, "leave:approve")).toBe(false);
  });

  it("Super Admin bypasses all permission checks", () => {
    const actor: AuthContext = {
      actorId: "EMP#000",
      actorRole: Roles.SUPER_ADMIN,
      actorCustomPermissions: [],
    };
    expect(hasPermission(actor, "anything:at-all")).toBe(true);
  });
});

describe("ABAC — authorize", () => {
  const managerCtx: AuthContext = {
    actorId: "EMP#001",
    actorRole: Roles.MANAGER,
    actorCustomPermissions: [],
  };

  const employeeCtx: AuthContext = {
    actorId: "EMP#002",
    actorRole: Roles.EMPLOYEE,
    actorCustomPermissions: [],
  };

  const superAdminCtx: AuthContext = {
    actorId: "EMP#000",
    actorRole: Roles.SUPER_ADMIN,
    actorCustomPermissions: [],
  };

  const adminCtx: AuthContext = {
    actorId: "EMP#003",
    actorRole: Roles.ADMIN,
    actorCustomPermissions: [],
  };

  it("allows employee to access own data", () => {
    const resource: ResourceContext = {
      resourceType: "ATTENDANCE",
      resourceOwnerId: "EMP#002",
      ownerManagerId: "EMP#001",
      sensitivityLevel: SensitivityLevels.INTERNAL,
    };
    const result = authorize(employeeCtx, "read", resource);
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("own");
  });

  it("allows manager to access direct report data", () => {
    const resource: ResourceContext = {
      resourceType: "ATTENDANCE",
      resourceOwnerId: "EMP#002",
      ownerManagerId: "EMP#001",
      sensitivityLevel: SensitivityLevels.INTERNAL,
    };
    const result = authorize(managerCtx, "read", resource);
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("manager");
  });

  it("denies manager accessing non-report employee", () => {
    const resource: ResourceContext = {
      resourceType: "ATTENDANCE",
      resourceOwnerId: "EMP#099",
      ownerManagerId: "EMP#050",
      sensitivityLevel: SensitivityLevels.INTERNAL,
    };
    const result = authorize(managerCtx, "read", resource);
    expect(result.allowed).toBe(false);
  });

  it("denies employee accessing other employee salary", () => {
    const resource: ResourceContext = {
      resourceType: "SALARY",
      resourceOwnerId: "EMP#003",
      ownerManagerId: "EMP#001",
      sensitivityLevel: SensitivityLevels.CONFIDENTIAL,
    };
    const result = authorize(employeeCtx, "read", resource);
    expect(result.allowed).toBe(false);
  });

  it("allows manager to access direct report CONFIDENTIAL data", () => {
    const resource: ResourceContext = {
      resourceType: "SALARY",
      resourceOwnerId: "EMP#002",
      ownerManagerId: "EMP#001",
      sensitivityLevel: SensitivityLevels.CONFIDENTIAL,
    };
    const result = authorize(managerCtx, "read", resource);
    expect(result.allowed).toBe(true);
  });

  it("allows admin to access any data", () => {
    const resource: ResourceContext = {
      resourceType: "SALARY",
      resourceOwnerId: "EMP#099",
      ownerManagerId: "EMP#050",
      sensitivityLevel: SensitivityLevels.CONFIDENTIAL,
    };
    const result = authorize(adminCtx, "read", resource);
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("admin");
  });

  it("Super Admin bypasses everything", () => {
    const resource: ResourceContext = {
      resourceType: "SALARY",
      resourceOwnerId: "EMP#099",
      ownerManagerId: "EMP#050",
      sensitivityLevel: SensitivityLevels.CONFIDENTIAL,
    };
    const result = authorize(superAdminCtx, "read", resource);
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("super_admin");
  });

  it("allows PUBLIC data access to any authenticated user", () => {
    const resource: ResourceContext = {
      resourceType: "LEAVE_CALENDAR",
      resourceOwnerId: "EMP#099",
      ownerManagerId: "EMP#050",
      sensitivityLevel: SensitivityLevels.PUBLIC,
    };
    const result = authorize(employeeCtx, "read", resource);
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("public");
  });

  it("allows employee to access own CONFIDENTIAL data", () => {
    const resource: ResourceContext = {
      resourceType: "SALARY",
      resourceOwnerId: "EMP#002",
      ownerManagerId: "EMP#001",
      sensitivityLevel: SensitivityLevels.CONFIDENTIAL,
    };
    const result = authorize(employeeCtx, "read", resource);
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("own");
  });

  it("denies employee accessing other SENSITIVE data", () => {
    const resource: ResourceContext = {
      resourceType: "LEAVE_REQUEST",
      resourceOwnerId: "EMP#003",
      ownerManagerId: "EMP#001",
      sensitivityLevel: SensitivityLevels.SENSITIVE,
    };
    const result = authorize(employeeCtx, "read", resource);
    expect(result.allowed).toBe(false);
  });
});
