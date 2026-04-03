import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission, resolveFlag } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_FLAGS, API_FLAG_BY_ID } from "@hr-attendance-app/types";
import type { FlagResolution, FlagsQueryParams, ResolveFlagBody } from "@hr-attendance-app/types";

export function flagRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_FLAGS,
      handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
        if (hasPermission(auth, Permissions.FLAG_RESOLVE)) {
          const pending = await deps.services.flagQuery.findPending();
          return buildResponse(200, pending);
        }
        const query = queryParams as unknown as FlagsQueryParams;
        const flags = await deps.services.flagQuery.findByEmployee(auth.actorId, { status: query.status });
        return buildResponse(200, flags);
      }),
    },
    {
      method: "PATCH",
      path: API_FLAG_BY_ID,
      handler: withAuth(getDeps, async ({ auth, body }) => {
        if (!hasPermission(auth, Permissions.FLAG_RESOLVE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const input = body as ResolveFlagBody | null;
        if (!input?.flagId || !input.resolution) {
          return handleError(ErrorCodes.VALIDATION, "flagId and resolution required");
        }
        const resolved = resolveFlag({
          flagId: input.flagId,
          resolution: input.resolution as FlagResolution,
          managerId: auth.actorId,
          deficitHours: input.deficitHours ?? 0,
          bankOffsetHours: input.bankOffsetHours ?? 0,
        });
        return buildResponse(200, resolved);
      }),
    },
  ];
}
