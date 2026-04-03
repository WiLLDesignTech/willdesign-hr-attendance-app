import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse } from "../middleware/index.js";
import { API_PAYROLL } from "@hr-attendance-app/types";

export function payrollRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_PAYROLL,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams }) => {
        const yearMonth = pathParams["yearMonth"] ?? "";
        const breakdown = await deps.services.payroll.getBreakdown(auth.actorId, yearMonth);
        if (!breakdown) {
          return buildResponse(200, { employeeId: auth.actorId, yearMonth, message: "No salary record found" });
        }
        return buildResponse(200, breakdown);
      }),
    },
  ];
}
