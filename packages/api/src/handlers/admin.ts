import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasMinimumRole } from "@willdesign-hr/core";
import { ErrorCodes, Roles, API_ONBOARD, API_OFFBOARD, API_AUDIT } from "@willdesign-hr/types";
import type { OnboardingInput, OffboardingInput } from "@willdesign-hr/core";

export function adminRoutes(deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "POST",
      path: API_ONBOARD,
      handler: async ({ claims, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasMinimumRole(auth.data.actorRole, Roles.ADMIN)) {
          return handleError(ErrorCodes.FORBIDDEN, "Admin required");
        }
        const input = body as OnboardingInput | null;
        if (!input) return handleError(ErrorCodes.VALIDATION, "Request body required");
        const result = await deps.services.onboarding.onboard(input);
        if (!result.success) return handleError(ErrorCodes.CONFLICT, result.error ?? "Onboarding failed");
        return buildResponse(201, result);
      },
    },
    {
      method: "POST",
      path: API_OFFBOARD,
      handler: async ({ claims, pathParams, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasMinimumRole(auth.data.actorRole, Roles.ADMIN)) {
          return handleError(ErrorCodes.FORBIDDEN, "Admin required");
        }
        const input = body as Omit<OffboardingInput, "employeeId"> | null;
        if (!input) return handleError(ErrorCodes.VALIDATION, "Request body required");

        const rawInput = input as unknown as Record<string, unknown>;
        if (rawInput["preview"] === true) {
          const preview = await deps.services.offboarding.getSettlementPreview(
            pathParams["id"] ?? "", (rawInput["terminationDate"] as string) ?? "",
          );
          return buildResponse(200, preview);
        }

        const result = await deps.services.offboarding.offboard({
          employeeId: pathParams["id"] ?? "",
          ...input,
        });
        if (!result.success) return handleError(ErrorCodes.CONFLICT, result.error ?? "Offboarding failed");
        return buildResponse(200, result);
      },
    },
    {
      method: "GET",
      path: API_AUDIT,
      handler: async ({ claims, pathParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasMinimumRole(auth.data.actorRole, Roles.ADMIN)) {
          return handleError(ErrorCodes.FORBIDDEN, "Admin required");
        }
        const entries = await deps.services.audit.findByTarget(pathParams["targetId"] ?? "");
        return buildResponse(200, entries);
      },
    },
  ];
}
