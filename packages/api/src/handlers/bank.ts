import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasMinimumRole } from "@willdesign-hr/core";
import { ErrorCodes, Roles, API_BANK, API_BANK_APPROVE } from "@willdesign-hr/types";
import type { BankApproveBody, BankQueryParams } from "@willdesign-hr/types";

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
        if (!hasMinimumRole(auth.data.actorRole, Roles.MANAGER)) {
          return handleError(ErrorCodes.FORBIDDEN, "Manager required");
        }
        const input = body as BankApproveBody | null;
        if (!input?.entryId) return handleError(ErrorCodes.VALIDATION, "entryId required");
        const updated = await deps.services.bank.approve(input.entryId);
        return buildResponse(200, updated);
      },
    },
  ];
}
