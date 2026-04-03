/**
 * Dev-only authentication endpoints.
 * Returns mock tokens for local development — NOT for production.
 */
import type { RouteDefinition } from "./handlers/router.js";
import { buildResponse, handleError } from "./middleware/index.js";
import type { AppDeps } from "./composition.js";
import {
  COGNITO, ErrorCodes,
  API_DEV_AUTH_EMPLOYEES, API_DEV_AUTH_LOGIN,
} from "@willdesign-hr/types";

export function devAuthRoutes(deps: AppDeps): RouteDefinition[] {
  if (process.env["NODE_ENV"] === "production") return [];

  return [
    {
      method: "GET",
      path: API_DEV_AUTH_EMPLOYEES,
      handler: async () => {
        const employees = await deps.services.employee.findAll({ status: "ACTIVE" });
        const list = employees.map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          role: (e as unknown as Record<string, unknown>)["role"] ?? "EMPLOYEE",
          region: e.region,
        }));
        return buildResponse(200, list);
      },
    },
    {
      method: "POST",
      path: API_DEV_AUTH_LOGIN,
      handler: async ({ body }) => {
        const input = body as { employeeId?: string } | null;
        if (!input?.employeeId) {
          return handleError(ErrorCodes.VALIDATION, "employeeId is required");
        }
        const employee = await deps.services.employee.findById(input.employeeId);
        if (!employee) {
          return handleError(ErrorCodes.NOT_FOUND, "Employee not found");
        }

        const role = (employee as unknown as Record<string, unknown>)["role"] as string ?? "EMPLOYEE";

        const claims = {
          [COGNITO.ATTR_EMPLOYEE_ID]: employee.id,
          "cognito:groups": role,
          email: employee.email,
          name: employee.name,
        };
        const token = Buffer.from(JSON.stringify(claims)).toString("base64");

        return buildResponse(200, {
          token,
          employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role,
            region: employee.region,
            languagePreference: employee.languagePreference,
          },
        });
      },
    },
  ];
}

/**
 * Parse a dev token from Authorization header and return claims.
 */
export function parseDevToken(authHeader: string | undefined): Record<string, unknown> {
  if (!authHeader?.startsWith("Bearer ")) return {};
  const token = authHeader.slice(7);
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}
