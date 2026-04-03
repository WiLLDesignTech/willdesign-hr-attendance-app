import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_EMPLOYEES } from "@willdesign-hr/types";
import type { Employee } from "@willdesign-hr/types";

export function useTeamMembers() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.team.members(),
    queryFn: () => api.get<Employee[]>(API_EMPLOYEES),
  });
}
