import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { ErrorCodes, API_REPORTS, todayDate } from "@willdesign-hr/types";
import type { CreateReportBody, ReportsQueryParams } from "@willdesign-hr/types";

export function reportRoutes(deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_REPORTS,
      handler: async ({ claims, queryParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const query = queryParams as unknown as ReportsQueryParams;
        const employeeId = query.employeeId ?? auth.data.actorId;
        const date = query.date ?? todayDate();
        const reports = await deps.services.report.findByDate(employeeId, date);
        return buildResponse(200, reports);
      },
    },
    {
      method: "POST",
      path: API_REPORTS,
      handler: async ({ claims, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const input = body as CreateReportBody | null;
        if (!input?.text) return handleError(ErrorCodes.VALIDATION, "text is required");
        const saved = await deps.services.report.create(auth.data.actorId, input.text, input.date);
        return buildResponse(201, saved);
      },
    },
  ];
}
