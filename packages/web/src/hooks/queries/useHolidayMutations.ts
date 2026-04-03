import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_HOLIDAYS, API_HOLIDAY_DELETE, apiPath } from "@hr-attendance-app/types";
import type { CreateHolidayBody } from "@hr-attendance-app/types";

export function useCreateHoliday() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHolidayBody) => api.post(API_HOLIDAYS, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays.all });
    },
  });
}

export function useDeleteHoliday() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { region: string; date: string }) =>
      api.delete(apiPath(API_HOLIDAY_DELETE, { region: params.region, date: params.date })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays.all });
    },
  });
}
