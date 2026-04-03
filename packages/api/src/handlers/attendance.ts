import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import {
  AttendanceActions, AuditSources, ErrorCodes,
  API_ATTENDANCE_STATE, API_ATTENDANCE_EVENTS,
  todayDate, nowMs,
} from "@hr-attendance-app/types";
import type { ClockActionBody, AttendanceEventsQueryParams } from "@hr-attendance-app/types";

export function attendanceRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_ATTENDANCE_STATE,
      handler: withAuth(getDeps, async ({ auth, deps }) => {
        const state = await deps.services.attendance.getState(auth.actorId);
        return buildResponse(200, state);
      }),
    },
    {
      method: "GET",
      path: API_ATTENDANCE_EVENTS,
      handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
        const query = queryParams as unknown as AttendanceEventsQueryParams;
        const employeeId = query.employeeId ?? auth.actorId;

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
      }),
    },
    {
      method: "POST",
      path: API_ATTENDANCE_EVENTS,
      handler: withAuth(getDeps, async ({ auth, deps, body }) => {
        const input = body as ClockActionBody | null;
        if (!input?.action) return handleError(ErrorCodes.VALIDATION, "action is required");

        const action = input.action as keyof typeof AttendanceActions;
        const result = await deps.services.attendance.processEvent({
          employeeId: auth.actorId,
          action: action,
          timestamp: new Date(nowMs()),
          source: AuditSources.WEB,
          actorId: auth.actorId,
          workLocation: input.workLocation,
          isEmergency: input.isEmergency,
        });

        if (!result.success) return handleError(ErrorCodes.CONFLICT, result.error);
        return buildResponse(201, result.data);
      }),
    },
  ];
}
