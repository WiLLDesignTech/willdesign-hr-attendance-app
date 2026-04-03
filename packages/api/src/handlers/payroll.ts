import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { ErrorCodes, API_PAYROLL } from "@willdesign-hr/types";

export function payrollRoutes(deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_PAYROLL,
      handler: async ({ claims, pathParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const yearMonth = pathParams["yearMonth"] ?? "";
        const breakdown = await deps.services.payroll.getBreakdown(auth.data.actorId, yearMonth);
        if (!breakdown) {
          return buildResponse(200, { employeeId: auth.data.actorId, yearMonth, message: "No salary record found" });
        }
        return buildResponse(200, breakdown);
      },
    },
  ];
}
