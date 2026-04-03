import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_ONBOARD, API_OFFBOARD, apiPath } from "@hr-attendance-app/types";

export function useOnboard() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      api.post(API_ONBOARD, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employee.all });
    },
  });
}

export function useOffboard() {
  const api = useApiClient();
  return useMutation({
    mutationFn: (input: { employeeId: string; [key: string]: unknown }) =>
      api.post(apiPath(API_OFFBOARD, { id: input.employeeId }), input),
  });
}
