import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_FLAGS, API_FLAG_BY_ID, apiPath } from "@hr-attendance-app/types";
import type { Flag, ResolveFlagBody } from "@hr-attendance-app/types";

export function useFlags() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.flags.list(),
    queryFn: () => api.get<Flag[]>(API_FLAGS),
  });
}

export function useResolveFlag() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ResolveFlagBody) =>
      api.patch(apiPath(API_FLAG_BY_ID, { id: input.flagId }), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flags.all });
    },
  });
}
