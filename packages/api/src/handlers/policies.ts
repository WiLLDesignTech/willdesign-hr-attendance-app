import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_POLICIES } from "@hr-attendance-app/types";

export function policyRoutes(_deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_POLICIES,
      handler: async ({ claims, pathParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        return buildResponse(200, {
          groupName: pathParams["groupName"],
          message: "Policy data loaded from seed configuration",
        });
      },
    },
    {
      method: "PUT",
      path: API_POLICIES,
      handler: async ({ claims, pathParams, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasPermission(auth.data, Permissions.POLICY_UPDATE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        return buildResponse(200, {
          groupName: pathParams["groupName"],
          policy: body,
          message: "Policy updated",
        });
      },
    },
  ];
}
