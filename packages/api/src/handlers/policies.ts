import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasMinimumRole } from "@willdesign-hr/core";
import { ErrorCodes, Roles, API_POLICIES } from "@willdesign-hr/types";

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
        if (!hasMinimumRole(auth.data.actorRole, Roles.ADMIN)) {
          return handleError(ErrorCodes.FORBIDDEN, "Admin required");
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
