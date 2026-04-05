import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError, requireCrossUserAccess } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_BANK, API_BANK_APPROVE } from "@hr-attendance-app/types";
import type { BankApproveBody, BankQueryParams } from "@hr-attendance-app/types";

export function bankRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_BANK,
      handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
        const query = queryParams as unknown as BankQueryParams;
        const employeeId = query.employeeId ?? auth.actorId;
        const denied = requireCrossUserAccess(auth, employeeId);
        if (denied) return denied;
        const entries = await deps.services.bank.findByEmployee(employeeId);
        return buildResponse(200, entries);
      }),
    },
    {
      method: "POST",
      path: API_BANK_APPROVE,
      handler: withAuth(getDeps, async ({ auth, deps, body }) => {
        if (!hasPermission(auth, Permissions.BANK_APPROVE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const input = body as BankApproveBody | null;
        if (!input?.entryId) return handleError(ErrorCodes.VALIDATION, "entryId required");
        const updated = await deps.services.bank.approve(input.entryId);
        return buildResponse(200, updated);
      }),
    },
  ];
}
