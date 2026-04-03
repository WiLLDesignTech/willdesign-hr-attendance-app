import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import {
  ErrorCodes, ErrorMessages, Permissions,
  API_EMPLOYEES_ME, API_EMPLOYEES_BY_ID, API_EMPLOYEES,
} from "@hr-attendance-app/types";
import type { EmployeesQueryParams } from "@hr-attendance-app/types";

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

        if (hasPermission(auth.data, Permissions.EMPLOYEE_UPDATE)) {
          const all = await deps.services.employee.findAll({ status: query.status });
          return buildResponse(200, all);
        }
        if (hasPermission(auth.data, Permissions.EMPLOYEE_LIST_ALL)) {
          const reports = await deps.services.employee.findByManagerId(auth.data.actorId);
          return buildResponse(200, reports);
        }
        return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
      },
    },
    {
      method: "PATCH",
      path: API_EMPLOYEES_BY_ID,
      handler: async ({ claims, pathParams, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasPermission(auth.data, Permissions.EMPLOYEE_UPDATE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
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
