import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import {
  API_PAYROLL, API_PAYROLL_REPORT, API_ADMIN_SALARY,
  apiPath,
} from "@hr-attendance-app/types";
import type { PayrollBreakdown, SalaryRecord, MonthlyPayrollReport, CreateSalaryEntryBody } from "@hr-attendance-app/types";

export const usePayroll = (yearMonth: string) => {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.payroll.month(yearMonth),
    queryFn: () => api.get<PayrollBreakdown>(apiPath(API_PAYROLL, { yearMonth })),
    enabled: !!yearMonth,
  });
};

export const usePayrollReport = (yearMonth: string) => {
  const api = useApiClient();
  return useQuery({
    queryKey: [...queryKeys.payroll.month(yearMonth), "report"],
    queryFn: () => api.get<MonthlyPayrollReport>(apiPath(API_PAYROLL_REPORT, { yearMonth })),
    enabled: !!yearMonth,
  });
};

export const useSalaryHistory = (employeeId: string) => {
  const api = useApiClient();
  return useQuery({
    queryKey: [...queryKeys.payroll.all, "salary", employeeId],
    queryFn: () => api.get<SalaryRecord[]>(apiPath(API_ADMIN_SALARY, { employeeId })),
    enabled: !!employeeId,
  });
};

export const useAddSalaryEntry = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, ...body }: CreateSalaryEntryBody & { employeeId: string }) =>
      api.post<SalaryRecord>(apiPath(API_ADMIN_SALARY, { employeeId }), body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all });
    },
  });
};
