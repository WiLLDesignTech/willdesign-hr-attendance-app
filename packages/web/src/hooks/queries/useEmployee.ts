import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_EMPLOYEES_ME, API_EMPLOYEES } from "@willdesign-hr/types";
import type { Employee } from "@willdesign-hr/types";

export function useCurrentUser() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.employee.me(),
    queryFn: () => api.get<Employee>(API_EMPLOYEES_ME),
  });
}

export function useEmployees() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.employee.all,
    queryFn: () => api.get<Employee[]>(API_EMPLOYEES),
  });
}
