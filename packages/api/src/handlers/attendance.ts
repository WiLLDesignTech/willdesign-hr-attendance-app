import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError, requireCrossUserAccess } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import {
  AttendanceActions, AuditSources, ErrorCodes, ErrorMessages, Permissions,
  API_ATTENDANCE_STATE, API_ATTENDANCE_EVENTS, API_ATTENDANCE_SUMMARY,
  API_ATTENDANCE_EVENT_BY_ID, API_ATTENDANCE_TEAM_STATES,
  todayDate, nowMs,
} from "@hr-attendance-app/types";
import type {
  ClockActionBody, AttendanceEventsQueryParams,
  AttendanceSummaryQueryParams, EditAttendanceEventBody,
} from "@hr-attendance-app/types";

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
        const denied = requireCrossUserAccess(auth, employeeId);
        if (denied) return denied;

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
    {
      method: "GET",
      path: API_ATTENDANCE_SUMMARY,
      handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
        const query = queryParams as unknown as AttendanceSummaryQueryParams;
        const employeeId = query.employeeId ?? auth.actorId;
        const denied = requireCrossUserAccess(auth, employeeId);
        if (denied) return denied;
        const date = query.date ?? todayDate();
        const summary = await deps.services.attendance.getSummary(employeeId, date);
        return buildResponse(200, summary);
      }),
    },
    {
      method: "PATCH",
      path: API_ATTENDANCE_EVENT_BY_ID,
      handler: withAuth(getDeps, async ({ auth, deps, body, pathParams }) => {
        const input = body as EditAttendanceEventBody | null;
        if (!input?.reason) return handleError(ErrorCodes.VALIDATION, "reason is required");

        const eventId = pathParams?.id;
        if (!eventId) return handleError(ErrorCodes.VALIDATION, "event id is required");

        const result = await deps.services.attendance.editEvent(
          eventId,
          auth.actorId,
          { timestamp: input.timestamp, action: input.action, reason: input.reason },
          auth.actorId,
          AuditSources.WEB,
        );

        if (!result.success) return handleError(ErrorCodes.CONFLICT, result.error);
        return buildResponse(200, result.data);
      }),
    },
    {
      method: "GET",
      path: API_ATTENDANCE_TEAM_STATES,
      handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
        if (!hasPermission(auth, Permissions.EMPLOYEE_LIST_ALL)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const employeeIds = (queryParams as Record<string, string>).employeeIds?.split(",") ?? [];
        if (employeeIds.length === 0) return buildResponse(200, []);
        const states = await deps.services.attendance.getTeamStates(employeeIds);
        return buildResponse(200, states);
      }),
    },
  ];
}
