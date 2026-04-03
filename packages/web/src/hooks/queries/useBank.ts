import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_BANK, API_BANK_APPROVE, withQuery } from "@hr-attendance-app/types";
import type { BankEntry, BankApproveBody } from "@hr-attendance-app/types";

export function useBank(employeeId?: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: employeeId ? queryKeys.bank.byEmployee(employeeId) : queryKeys.bank.list(),
    queryFn: () =>
      api.get<BankEntry[]>(employeeId ? withQuery(API_BANK, { employeeId }) : API_BANK),
  });
}

export function useBankApprove() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BankApproveBody) => api.post(API_BANK_APPROVE, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bank.all });
    },
  });
}
