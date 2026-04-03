import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasMinimumRole } from "@willdesign-hr/core";
import {
  ErrorCodes, Roles,
  API_EMPLOYEES_ME, API_EMPLOYEES_BY_ID, API_EMPLOYEES,
} from "@willdesign-hr/types";
import type { EmployeesQueryParams } from "@willdesign-hr/types";

export function employeeRoutes(deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_EMPLOYEES_ME,
      handler: async ({ claims }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const emp = await deps.services.employee.findById(auth.data.actorId);
        if (!emp) return handleError(ErrorCodes.NOT_FOUND, "Employee not found");
        return buildResponse(200, emp);
      },
    },
    {
      method: "GET",
      path: API_EMPLOYEES_BY_ID,
      handler: async ({ claims, pathParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const emp = await deps.services.employee.findById(pathParams["id"] ?? "");
        if (!emp) return handleError(ErrorCodes.NOT_FOUND, "Employee not found");
        return buildResponse(200, emp);
      },
    },
    {
      method: "GET",
      path: API_EMPLOYEES,
      handler: async ({ claims, queryParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const query = queryParams as unknown as EmployeesQueryParams;

        if (hasMinimumRole(auth.data.actorRole, Roles.ADMIN)) {
          const all = await deps.services.employee.findAll({ status: query.status });
          return buildResponse(200, all);
        }
        if (hasMinimumRole(auth.data.actorRole, Roles.MANAGER)) {
          const reports = await deps.services.employee.findByManagerId(auth.data.actorId);
          return buildResponse(200, reports);
        }
        return handleError(ErrorCodes.FORBIDDEN, "Insufficient permissions");
      },
    },
    {
      method: "PATCH",
      path: API_EMPLOYEES_BY_ID,
      handler: async ({ claims, pathParams, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasMinimumRole(auth.data.actorRole, Roles.ADMIN)) {
          return handleError(ErrorCodes.FORBIDDEN, "Admin required");
        }
        const updated = await deps.services.employee.update(
          pathParams["id"] ?? "",
          body as Record<string, unknown>,
        );
        return buildResponse(200, updated);
      },
    },
  ];
}
