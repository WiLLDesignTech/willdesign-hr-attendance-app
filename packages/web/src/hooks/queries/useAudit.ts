import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_AUDIT, apiPath } from "@hr-attendance-app/types";
import type { AuditEntry } from "@hr-attendance-app/types";

export function useAudit(targetId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.audit.byTarget(targetId),
    queryFn: () => api.get<AuditEntry[]>(apiPath(API_AUDIT, { targetId })),
    enabled: !!targetId,
  });
}
