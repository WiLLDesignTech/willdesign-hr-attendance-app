import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError, requireCrossUserAccess } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_REPORTS, todayDate } from "@hr-attendance-app/types";
import type { CreateReportBody, ReportsQueryParams } from "@hr-attendance-app/types";

export function reportRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_REPORTS,
      handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
        const query = queryParams as unknown as ReportsQueryParams & { team?: string };
        const date = query.date ?? todayDate();

        if (query.team === "true") {
          if (!hasPermission(auth, Permissions.EMPLOYEE_LIST_ALL)) {
            return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
          }
          const reports = await deps.services.report.findAllByDate(date);
          return buildResponse(200, reports);
        }

        const employeeId = query.employeeId ?? auth.actorId;
        const denied = requireCrossUserAccess(auth, employeeId);
        if (denied) return denied;
        const reports = await deps.services.report.findByDate(employeeId, date);
        return buildResponse(200, reports);
      }),
    },
    {
      method: "POST",
      path: API_REPORTS,
      handler: withAuth(getDeps, async ({ auth, deps, body }) => {
        const input = body as CreateReportBody | null;
        if (!input?.text) return handleError(ErrorCodes.VALIDATION, "text is required");
        const saved = await deps.services.report.create(auth.actorId, input.text, input.date);
        return buildResponse(201, saved);
      }),
    },
  ];
}
