import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_PAYROLL, apiPath } from "@hr-attendance-app/types";
import type { PayrollBreakdown } from "@hr-attendance-app/types";

export function usePayroll(yearMonth: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.payroll.month(yearMonth),
    queryFn: () => api.get<PayrollBreakdown>(apiPath(API_PAYROLL, { yearMonth })),
    enabled: !!yearMonth,
  });
}
