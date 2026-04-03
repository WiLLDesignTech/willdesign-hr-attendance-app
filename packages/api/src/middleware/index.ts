import type { AuthContext, Result } from "@hr-attendance-app/types";
import { Roles, ErrorCodes, COGNITO } from "@hr-attendance-app/types";

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

  return {
    success: true,
    data: {
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
