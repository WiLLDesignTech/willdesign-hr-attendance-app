import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import {
  AttendanceActions, ErrorCodes,
  API_ATTENDANCE_STATE, API_ATTENDANCE_EVENTS,
  todayDate, nowMs,
} from "@hr-attendance-app/types";
import type { ClockActionBody, AttendanceEventsQueryParams } from "@hr-attendance-app/types";

export function attendanceRoutes(deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_ATTENDANCE_STATE,
      handler: async ({ claims }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const state = await deps.services.attendance.getState(auth.data.actorId);
        return buildResponse(200, state);
      },
    },
    {
      method: "GET",
      path: API_ATTENDANCE_EVENTS,
      handler: async ({ claims, queryParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const query = queryParams as unknown as AttendanceEventsQueryParams;
        const employeeId = query.employeeId ?? auth.data.actorId;

        if (query.month) {
          const events = await deps.services.attendance.getEventsForMonth(employeeId, query.month);
          return buildResponse(200, events);
        }
        if (query.date) {
          const events = await deps.services.attendance.getEventsForDate(employeeId, query.date);
          return buildResponse(200, events);
        }
        const today = todayDate();
        const events = await deps.services.attendance.getEventsForDate(employeeId, today);
        return buildResponse(200, events);
      },
    },
    {
      method: "POST",
      path: API_ATTENDANCE_EVENTS,
      handler: async ({ claims, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const input = body as ClockActionBody | null;
        if (!input?.action) return handleError(ErrorCodes.VALIDATION, "action is required");

        const action = input.action as keyof typeof AttendanceActions;
        const result = await deps.services.attendance.processEvent({
          employeeId: auth.data.actorId,
          action: action,
          timestamp: new Date(nowMs()),
          source: "web",
          actorId: auth.data.actorId,
          workLocation: input.workLocation,
          isEmergency: input.isEmergency,
        });

        if (!result.success) return handleError(ErrorCodes.CONFLICT, result.error);
        return buildResponse(201, result.data);
      },
    },
  ];
}
