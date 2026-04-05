import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_ROLES, API_ROLE_BY_NAME } from "@hr-attendance-app/types";
import type { RoleBody } from "@hr-attendance-app/types";

export const roleRoutes = (getDeps: DepsResolver): RouteDefinition[] => [
  {
    method: "GET",
    path: API_ROLES,
    handler: withAuth(getDeps, async ({ deps }) => {
      const roles = await deps.services.role.findAll();
      return buildResponse(200, roles);
    }),
  },
  {
    method: "GET",
    path: API_ROLE_BY_NAME,
    handler: withAuth(getDeps, async ({ deps, pathParams }) => {
      const name = pathParams["name"] ?? "";
      const role = await deps.services.role.findByName(name);
      if (!role) return handleError(ErrorCodes.NOT_FOUND, "Role not found");
      return buildResponse(200, role);
    }),
  },
  {
    method: "PUT",
    path: API_ROLE_BY_NAME,
    handler: withAuth(getDeps, async ({ auth, deps, pathParams, body }) => {
      if (!hasPermission(auth, Permissions.POLICY_UPDATE)) {
        return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
      }
      const input = body as RoleBody | null;
      if (!input?.name || !input.permissions) {
        return handleError(ErrorCodes.VALIDATION, "name and permissions are required");
      }
      const saved = await deps.services.role.save({
        name: pathParams["name"] ?? input.name,
        level: 0,
        permissions: [...input.permissions],
        isCustom: true,
      });
      return buildResponse(200, saved);
    }),
  },
];
