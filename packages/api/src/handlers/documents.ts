import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError, requireCrossUserAccess } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import {
  ErrorCodes, ErrorMessages, Permissions,
  API_DOCUMENTS, API_DOCUMENT_BY_ID, API_DOCUMENT_UPLOAD_URL,
} from "@hr-attendance-app/types";
import type { DocumentsQueryParams, CreateDocumentBody, DocumentVerifyBody } from "@hr-attendance-app/types";

export const documentRoutes = (getDeps: DepsResolver): RouteDefinition[] => [
  {
    method: "GET",
    path: API_DOCUMENTS,
    handler: withAuth(getDeps, async ({ auth, deps, queryParams }) => {
      const query = queryParams as unknown as DocumentsQueryParams;
      const employeeId = query.employeeId ?? auth.actorId;
      const denied = requireCrossUserAccess(auth, employeeId);
      if (denied) return denied;
      const docs = await deps.services.document.findByEmployee(employeeId);
      return buildResponse(200, docs);
    }),
  },
  {
    method: "POST",
    path: API_DOCUMENT_UPLOAD_URL,
    handler: withAuth(getDeps, async ({ auth, deps, body }) => {
      const input = body as CreateDocumentBody | null;
      if (!input?.fileName || !input.fileType) {
        return handleError(ErrorCodes.VALIDATION, "fileName and fileType are required");
      }
      const employeeId = input.employeeId ?? auth.actorId;
      const denied = requireCrossUserAccess(auth, employeeId);
      if (denied) return denied;
      const url = await deps.services.document.getUploadUrl(employeeId, input.fileName);
      return buildResponse(200, { uploadUrl: url });
    }),
  },
  {
    method: "PATCH",
    path: API_DOCUMENT_BY_ID,
    handler: withAuth(getDeps, async ({ auth, pathParams, body }) => {
      if (!hasPermission(auth, Permissions.EMPLOYEE_UPDATE)) {
        return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
      }
      const input = body as DocumentVerifyBody | null;
      if (!input?.status) {
        return handleError(ErrorCodes.VALIDATION, "status is required");
      }
      return buildResponse(200, { id: pathParams["id"], status: input.status });
    }),
  },
];
