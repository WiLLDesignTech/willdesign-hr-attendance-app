import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_ATTENDANCE_LOCK, withQuery } from "@hr-attendance-app/types";
import type { AttendanceLock, CreateAttendanceLockBody, DeleteAttendanceLockParams } from "@hr-attendance-app/types";

export function useAttendanceLocks(yearMonth: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.locks.byMonth(yearMonth),
    queryFn: () => api.get<AttendanceLock[]>(withQuery(API_ATTENDANCE_LOCK, { yearMonth })),
  });
}

export function useCreateLock() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAttendanceLockBody) =>
      api.post<AttendanceLock>(API_ATTENDANCE_LOCK, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locks.all });
    },
  });
}

export function useDeleteLock() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: DeleteAttendanceLockParams) =>
      api.delete<{ deleted: boolean }>(withQuery(API_ATTENDANCE_LOCK, {
        scope: params.scope,
        yearMonth: params.yearMonth,
        groupId: params.groupId,
        employeeId: params.employeeId,
      })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locks.all });
    },
  });
}
