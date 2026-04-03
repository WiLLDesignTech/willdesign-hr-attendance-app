import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_ROLES, API_ROLE_BY_NAME, apiPath } from "@hr-attendance-app/types";
import type { RoleBody, RoleDefinition } from "@hr-attendance-app/types";

export function useRoles() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: () => api.get<RoleDefinition[]>(API_ROLES),
  });
}

export function useUpdateRole() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RoleBody) =>
      api.put(apiPath(API_ROLE_BY_NAME, { name: input.name }), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}
