import type { AuthContext, Result } from "@hr-attendance-app/types";
import { Roles, ErrorCodes, COGNITO, DEFAULT_TENANT_ID } from "@hr-attendance-app/types";
import type { AppDeps, DepsResolver } from "../composition.js";
import type { RouteHandler } from "../handlers/router.js";

const DEPLOYMENT_MODE = process.env["DEPLOYMENT_MODE"] ?? "single";

export { ErrorCodes };

export interface ApiResponse {
  readonly statusCode: number;
  readonly body: string;
  readonly headers?: Record<string, string>;
}

const ERROR_STATUS_MAP: Record<string, number> = {
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.VALIDATION]: 400,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.UNPROCESSABLE]: 422,
  [ErrorCodes.UNAUTHORIZED]: 401,
};

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
} as const;

/**
 * Extract AuthContext from Cognito JWT claims.
 * In single-tenant mode (DEPLOYMENT_MODE=single or unset), tenantId defaults to "default".
 * In multi-tenant mode (DEPLOYMENT_MODE=multi), tenantId is read from custom:tenant_id claim.
 */
export function parseAuthContext(
  claims: Record<string, unknown>,
): Result<AuthContext, string> {
  const employeeId = claims[COGNITO.ATTR_EMPLOYEE_ID] as string | undefined;
  if (!employeeId) {
    return { success: false, error: "Missing employee_id claim" };
  }

  const groups = claims["cognito:groups"] as string | undefined;
  const role = groups ?? Roles.EMPLOYEE;

  let tenantId: string;
  if (DEPLOYMENT_MODE === "multi") {
    const tid = claims["custom:tenant_id"] as string | undefined;
    if (!tid) {
      return { success: false, error: "Missing tenant_id claim" };
    }
    tenantId = tid;
  } else {
    tenantId = DEFAULT_TENANT_ID;
  }

  return {
    success: true,
    data: {
      tenantId,
      actorId: employeeId,
      actorRole: role,
      actorCustomPermissions: [],
    },
  };
}

/**
 * Validate request body against a schema (Zod-compatible parse interface).
 */
export function validateBody<T>(
  schema: { parse: (v: unknown) => T },
  body: unknown,
): Result<T, string> {
  try {
    const parsed = schema.parse(body);
    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return { success: false, error: message };
  }
}

/**
 * Map error codes to HTTP responses.
 */
export function handleError(
  errorCode: string,
  message?: string,
): ApiResponse {
  const statusCode = ERROR_STATUS_MAP[errorCode] ?? 500;
  return buildResponse(statusCode, { error: message ?? errorCode });
}

/**
 * Build a standard API response with CORS headers.
 */
export function buildResponse(statusCode: number, body: unknown): ApiResponse {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { ...CORS_HEADERS },
  };
}

export interface AuthenticatedParams {
  readonly auth: AuthContext;
  readonly deps: AppDeps;
  readonly pathParams: Record<string, string>;
  readonly queryParams: Record<string, string>;
  readonly body: unknown;
}

/**
 * Wraps a handler with auth parsing and tenant-scoped deps resolution.
 * Eliminates the repeated parseAuthContext + getDeps boilerplate from every handler.
 */
export function withAuth(
  getDeps: DepsResolver,
  handler: (params: AuthenticatedParams) => Promise<ApiResponse>,
): RouteHandler {
  return async ({ claims, pathParams, queryParams, body }) => {
    const auth = parseAuthContext(claims);
    if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
    const deps = getDeps(auth.data.tenantId);
    return handler({ auth: auth.data, deps, pathParams, queryParams, body });
  };
}
