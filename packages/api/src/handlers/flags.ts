import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission, resolveFlag } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_FLAGS, API_FLAG_BY_ID } from "@hr-attendance-app/types";
import type { FlagResolution, FlagsQueryParams, ResolveFlagBody } from "@hr-attendance-app/types";

export function flagRoutes(deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_FLAGS,
      handler: async ({ claims, queryParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);

        if (hasPermission(auth.data, Permissions.FLAG_RESOLVE)) {
          const pending = await deps.services.flagQuery.findPending();
          return buildResponse(200, pending);
        }

        const query = queryParams as unknown as FlagsQueryParams;
        const flags = await deps.services.flagQuery.findByEmployee(auth.data.actorId, {
          status: query.status,
        });
        return buildResponse(200, flags);
      },
    },
    {
      method: "PATCH",
      path: API_FLAG_BY_ID,
      handler: async ({ claims, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasPermission(auth.data, Permissions.FLAG_RESOLVE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }

        const input = body as ResolveFlagBody | null;
        if (!input?.flagId || !input.resolution) {
          return handleError(ErrorCodes.VALIDATION, "flagId and resolution required");
        }

        const resolved = resolveFlag({
          flagId: input.flagId,
          resolution: input.resolution as FlagResolution,
          managerId: auth.data.actorId,
          deficitHours: input.deficitHours ?? 0,
          bankOffsetHours: input.bankOffsetHours ?? 0,
        });

        return buildResponse(200, resolved);
      },
    },
  ];
}
