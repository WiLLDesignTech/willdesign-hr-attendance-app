import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, requireCrossUserAccess } from "../middleware/index.js";
import { API_QUOTAS, HOURS, currentYear } from "@hr-attendance-app/types";

export const quotaRoutes = (getDeps: DepsResolver): RouteDefinition[] => [
  {
    method: "GET",
    path: API_QUOTAS,
    handler: withAuth(getDeps, async ({ auth, pathParams }) => {
      const employeeId = pathParams["employeeId"] ?? auth.actorId;
      const denied = requireCrossUserAccess(auth, employeeId);
      if (denied) return denied;

      // Stub: return default quota (160h/month × 12 months)
      const months = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        requiredHours: HOURS.MONTHLY_FULL_TIME,
      }));

      return buildResponse(200, {
        employeeId,
        year: currentYear(),
        standardMonthlyHours: HOURS.MONTHLY_FULL_TIME,
        months,
        redistributions: [],
      });
    }),
  },
];
