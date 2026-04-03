import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import {
  API_DOCUMENTS, API_DOCUMENT_BY_ID, API_DOCUMENT_UPLOAD_URL,
  withQuery, apiPath,
} from "@hr-attendance-app/types";
import type { Document, CreateDocumentBody, DocumentVerifyBody } from "@hr-attendance-app/types";

export function useDocuments(employeeId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.documents.byEmployee(employeeId),
    queryFn: () =>
      api.get<Document[]>(withQuery(API_DOCUMENTS, { employeeId })),
    enabled: !!employeeId,
  });
}

export function useUploadDocument() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDocumentBody) => {
      const { uploadUrl } = await api.post<{ uploadUrl: string }>(
        API_DOCUMENT_UPLOAD_URL,
        input,
      );
      return uploadUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
}

export function useVerifyDocument() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; body: DocumentVerifyBody }) =>
      api.patch(apiPath(API_DOCUMENT_BY_ID, { id: input.id }), input.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
}
