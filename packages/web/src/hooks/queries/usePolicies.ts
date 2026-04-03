import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_POLICIES, apiPath } from "@hr-attendance-app/types";
import type { EffectivePolicy, RawPolicy } from "@hr-attendance-app/types";

interface PolicyResponse {
  readonly effective: EffectivePolicy;
  readonly raw: RawPolicy;
}

export function usePolicies(groupName: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.policies.byGroup(groupName),
    queryFn: () => api.get<PolicyResponse>(apiPath(API_POLICIES, { groupName })),
    enabled: !!groupName,
  });
}

export function useUpdatePolicy() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { groupName: string; policy: RawPolicy }) =>
      api.put(apiPath(API_POLICIES, { groupName: input.groupName }), input.policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
    },
  });
}
