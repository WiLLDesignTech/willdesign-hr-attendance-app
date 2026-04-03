import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_REPORTS, withQuery } from "@willdesign-hr/types";
import type { DailyReport, CreateReportBody } from "@willdesign-hr/types";

export function useReports(date: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.reports.byDate(date),
    queryFn: () => api.get<DailyReport[]>(withQuery(API_REPORTS, { date })),
    enabled: !!date,
  });
}

export function useSubmitReport() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportBody) =>
      api.post<DailyReport>(API_REPORTS, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
