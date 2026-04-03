import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasMinimumRole, resolveFlag } from "@willdesign-hr/core";
import { ErrorCodes, Roles, API_FLAGS, API_FLAG_BY_ID } from "@willdesign-hr/types";
import type { FlagResolution, FlagsQueryParams, ResolveFlagBody } from "@willdesign-hr/types";

export function flagRoutes(deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_FLAGS,
      handler: async ({ claims, queryParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);

        if (hasMinimumRole(auth.data.actorRole, Roles.MANAGER)) {
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
        if (!hasMinimumRole(auth.data.actorRole, Roles.MANAGER)) {
          return handleError(ErrorCodes.FORBIDDEN, "Manager required");
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
