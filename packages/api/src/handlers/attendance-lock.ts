import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import {
  ErrorCodes, ErrorMessages, Permissions,
  AttendanceLockScopes, YEAR_MONTH_PATTERN,
  API_ATTENDANCE_LOCK,
} from "@hr-attendance-app/types";
import type { AttendanceLockScope, CreateAttendanceLockBody, AttendanceLockQueryParams } from "@hr-attendance-app/types";

function isValidScope(scope: string): scope is AttendanceLockScope {
  return Object.values(AttendanceLockScopes).includes(scope as AttendanceLockScope);
}

export function attendanceLockRoutes(deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_ATTENDANCE_LOCK,
      handler: async ({ claims, queryParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasPermission(auth.data, Permissions.ATTENDANCE_LOCK)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const query = queryParams as unknown as AttendanceLockQueryParams;
        if (!query.yearMonth || !YEAR_MONTH_PATTERN.test(query.yearMonth)) {
          return handleError(ErrorCodes.VALIDATION, ErrorMessages.YEAR_MONTH_QUERY_REQUIRED);
        }
        const locks = await deps.services.attendance.getLocksForMonth(query.yearMonth);
        return buildResponse(200, locks);
      },
    },
    {
      method: "POST",
      path: API_ATTENDANCE_LOCK,
      handler: async ({ claims, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasPermission(auth.data, Permissions.ATTENDANCE_LOCK)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const input = body as CreateAttendanceLockBody | null;
        if (!input?.yearMonth || !YEAR_MONTH_PATTERN.test(input.yearMonth)) {
          return handleError(ErrorCodes.VALIDATION, ErrorMessages.YEAR_MONTH_REQUIRED);
        }
        if (!input.scope || !isValidScope(input.scope)) {
          return handleError(ErrorCodes.VALIDATION, ErrorMessages.INVALID_SCOPE);
        }
        if (input.scope === AttendanceLockScopes.GROUP && !input.groupId) {
          return handleError(ErrorCodes.VALIDATION, ErrorMessages.GROUP_ID_REQUIRED);
        }
        if (input.scope === AttendanceLockScopes.EMPLOYEE && !input.employeeId) {
          return handleError(ErrorCodes.VALIDATION, ErrorMessages.EMPLOYEE_ID_REQUIRED);
        }
        const result = await deps.services.attendance.createLock({
          scope: input.scope,
          yearMonth: input.yearMonth,
          groupId: input.groupId,
          employeeId: input.employeeId,
          lockedBy: auth.data.actorId,
        });
        if (!result.success) {
          return handleError(ErrorCodes.CONFLICT, result.error);
        }
        return buildResponse(201, result.data);
      },
    },
    {
      method: "DELETE",
      path: API_ATTENDANCE_LOCK,
      handler: async ({ claims, queryParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasPermission(auth.data, Permissions.ATTENDANCE_LOCK)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const { yearMonth, scope, groupId, employeeId } = queryParams as Record<string, string>;
        if (!yearMonth || !YEAR_MONTH_PATTERN.test(yearMonth)) {
          return handleError(ErrorCodes.VALIDATION, ErrorMessages.YEAR_MONTH_REQUIRED);
        }
        if (!scope || !isValidScope(scope)) {
          return handleError(ErrorCodes.VALIDATION, ErrorMessages.INVALID_SCOPE);
        }
        const targetId = scope === AttendanceLockScopes.GROUP ? groupId
          : scope === AttendanceLockScopes.EMPLOYEE ? employeeId
          : undefined;
        await deps.services.attendance.removeLock(yearMonth, scope, targetId);
        return buildResponse(200, { deleted: true });
      },
    },
  ];
}
