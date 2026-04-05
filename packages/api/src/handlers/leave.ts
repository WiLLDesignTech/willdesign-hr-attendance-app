import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError, requireCrossUserAccess } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import {
  ErrorCodes, ErrorMessages, Permissions,
  API_LEAVE_REQUESTS, API_LEAVE_REQUEST_BY_ID, API_LEAVE_BALANCE,
} from "@hr-attendance-app/types";
import type {
  LeaveType, CreateLeaveBody, LeaveActionBody,
  LeaveRequestsQueryParams, LeaveBalanceQueryParams,
} from "@hr-attendance-app/types";

export function leaveRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "POST",
      path: API_LEAVE_REQUESTS,
      handler: withAuth(getDeps, async ({ auth, deps, body }) => {
        const input = body as CreateLeaveBody | null;
        if (!input?.leaveType || !input.startDate || !input.endDate) {
          return handleError(ErrorCodes.VALIDATION, "leaveType, startDate, endDate are required");
        }
        const result = await deps.services.leave.createRequest({
          employeeId: auth.actorId,
          leaveType: input.leaveType as LeaveType,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason ?? "",
        });
        if (!result.success) return handleError(ErrorCodes.CONFLICT, result.error);
        return buildResponse(201, result.data);
      }),
    },
    {
      method: "GET",
      path: API_LEAVE_REQUESTS,
      handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
        const query = queryParams as unknown as LeaveRequestsQueryParams;
        const employeeId = query.employeeId ?? auth.actorId;
        const denied = requireCrossUserAccess(auth, employeeId);
        if (denied) return denied;

        if (query.pending === "true" && hasPermission(auth, Permissions.LEAVE_APPROVE)) {
          const pending = await deps.services.leave.findPending();
          return buildResponse(200, pending);
        }

        const requests = await deps.services.leave.findRequests(employeeId, {
          status: query.status,
        });
        return buildResponse(200, requests);
      }),
    },
    {
      method: "PATCH",
      path: API_LEAVE_REQUEST_BY_ID,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams, body }) => {
        if (!hasPermission(auth, Permissions.LEAVE_APPROVE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const input = body as LeaveActionBody | null;
        const requestId = pathParams["id"] ?? "";

        if (input?.action === "approve") {
          const result = await deps.services.leave.approveRequest(requestId, auth.actorId);
          if (!result.success) return handleError(ErrorCodes.NOT_FOUND, result.error);
          return buildResponse(200, result.data);
        }
        if (input?.action === "reject") {
          const result = await deps.services.leave.rejectRequest(
            requestId, auth.actorId, input.reason ?? "Rejected",
          );
          if (!result.success) return handleError(ErrorCodes.NOT_FOUND, result.error);
          return buildResponse(200, result.data);
        }
        return handleError(ErrorCodes.VALIDATION, "action must be 'approve' or 'reject'");
      }),
    },
    {
      method: "GET",
      path: API_LEAVE_BALANCE,
      handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
        const query = queryParams as unknown as LeaveBalanceQueryParams;
        const employeeId = query.employeeId ?? auth.actorId;
        const denied = requireCrossUserAccess(auth, employeeId);
        if (denied) return denied;
        const balance = await deps.services.leave.getLeaveBalance(employeeId);
        return buildResponse(200, balance);
      }),
    },
  ];
}
