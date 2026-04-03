import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_BANK, API_BANK_APPROVE } from "@hr-attendance-app/types";
import type { BankApproveBody, BankQueryParams } from "@hr-attendance-app/types";

export function bankRoutes(deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_BANK,
      handler: async ({ claims, queryParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const query = queryParams as unknown as BankQueryParams;
        const employeeId = query.employeeId ?? auth.data.actorId;
        const entries = await deps.services.bank.findByEmployee(employeeId);
        return buildResponse(200, entries);
      },
    },
    {
      method: "POST",
      path: API_BANK_APPROVE,
      handler: async ({ claims, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasPermission(auth.data, Permissions.BANK_APPROVE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const input = body as BankApproveBody | null;
        if (!input?.entryId) return handleError(ErrorCodes.VALIDATION, "entryId required");
        const updated = await deps.services.bank.approve(input.entryId);
        return buildResponse(200, updated);
      },
    },
  ];
}
