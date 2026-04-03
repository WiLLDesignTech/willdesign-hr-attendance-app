import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import {
  API_LEAVE_REQUESTS, API_LEAVE_BALANCE, apiPath, API_LEAVE_REQUEST_BY_ID,
} from "@hr-attendance-app/types";
import type { LeaveRequest, LeaveBalance, CreateLeaveBody } from "@hr-attendance-app/types";

export function useLeaveRequests() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.leave.requests(),
    queryFn: () => api.get<LeaveRequest[]>(API_LEAVE_REQUESTS),
  });
}

export function usePendingLeaveRequests(options?: { enabled?: boolean }) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.leave.pending(),
    queryFn: () => api.get<LeaveRequest[]>(`${API_LEAVE_REQUESTS}?pending=true`),
    enabled: options?.enabled ?? true,
  });
}

export function useLeaveBalance() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.leave.balance(),
    queryFn: () => api.get<LeaveBalance>(API_LEAVE_BALANCE),
  });
}

export function useCreateLeave() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeaveBody) =>
      api.post<LeaveRequest>(API_LEAVE_REQUESTS, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
    },
  });
}

export function useApproveLeave() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      api.patch<LeaveRequest>(apiPath(API_LEAVE_REQUEST_BY_ID, { id: requestId }), { action: "approve" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
    },
  });
}
