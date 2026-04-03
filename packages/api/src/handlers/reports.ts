import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import { ErrorCodes, API_REPORTS, todayDate } from "@hr-attendance-app/types";
import type { CreateReportBody, ReportsQueryParams } from "@hr-attendance-app/types";

export function reportRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_REPORTS,
      handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
        const query = queryParams as unknown as ReportsQueryParams;
        const employeeId = query.employeeId ?? auth.actorId;
        const date = query.date ?? todayDate();
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
