import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import {
  ErrorCodes, ErrorMessages, Permissions,
  API_EMPLOYEES_ME, API_EMPLOYEES_BY_ID, API_EMPLOYEES,
} from "@hr-attendance-app/types";
import type { EmployeesQueryParams } from "@hr-attendance-app/types";

export function employeeRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_EMPLOYEES_ME,
      handler: withAuth(getDeps, async ({ auth, deps }) => {
        const emp = await deps.services.employee.findById(auth.actorId);
        if (!emp) return handleError(ErrorCodes.NOT_FOUND, "Employee not found");
        return buildResponse(200, emp);
      }),
    },
    {
      method: "GET",
      path: API_EMPLOYEES_BY_ID,
      handler: withAuth(getDeps, async ({ auth: _auth, deps, pathParams }) => {
        const emp = await deps.services.employee.findById(pathParams["id"] ?? "");
        if (!emp) return handleError(ErrorCodes.NOT_FOUND, "Employee not found");
        return buildResponse(200, emp);
      }),
    },
    {
      method: "GET",
      path: API_EMPLOYEES,
      handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
        const query = queryParams as unknown as EmployeesQueryParams;

        if (hasPermission(auth, Permissions.EMPLOYEE_UPDATE)) {
          const all = await deps.services.employee.findAll({ status: query.status });
          return buildResponse(200, all);
        }
        if (hasPermission(auth, Permissions.EMPLOYEE_LIST_ALL)) {
          const reports = await deps.services.employee.findByManagerId(auth.actorId);
          return buildResponse(200, reports);
        }
        return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
      }),
    },
    {
      method: "PATCH",
      path: API_EMPLOYEES_BY_ID,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams, body }) => {
        if (!hasPermission(auth, Permissions.EMPLOYEE_UPDATE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const updated = await deps.services.employee.update(
          pathParams["id"] ?? "",
          body as Record<string, unknown>,
        );
        return buildResponse(200, updated);
      }),
    },
  ];
}
