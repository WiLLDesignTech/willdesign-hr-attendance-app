import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_ONBOARD, API_OFFBOARD, API_AUDIT } from "@hr-attendance-app/types";
import type { OnboardingInput, OffboardingInput } from "@hr-attendance-app/core";

export function adminRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "POST",
      path: API_ONBOARD,
      handler: withAuth(getDeps, async ({ auth, deps, body }) => {
        if (!hasPermission(auth, Permissions.ONBOARD)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const input = body as OnboardingInput | null;
        if (!input) return handleError(ErrorCodes.VALIDATION, "Request body required");
        const result = await deps.services.onboarding.onboard(input);
        if (!result.success) return handleError(ErrorCodes.CONFLICT, result.error ?? "Onboarding failed");
        return buildResponse(201, result);
      }),
    },
    {
      method: "POST",
      path: API_OFFBOARD,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams, body }) => {
        if (!hasPermission(auth, Permissions.OFFBOARD)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
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
      }),
    },
    {
      method: "GET",
      path: API_AUDIT,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams }) => {
        if (!hasPermission(auth, Permissions.AUDIT_VIEW)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const entries = await deps.services.audit.findByTarget(pathParams["targetId"] ?? "");
        return buildResponse(200, entries);
      }),
    },
  ];
}
