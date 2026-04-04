import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_ATTENDANCE_STATE, API_ATTENDANCE_EVENTS, withQuery } from "@hr-attendance-app/types";
import type { AttendanceStateRecord, AttendanceEvent, AttendanceAction } from "@hr-attendance-app/types";

export function useAttendanceState() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.attendance.state(),
    queryFn: () => api.get<AttendanceStateRecord>(API_ATTENDANCE_STATE),
    refetchInterval: 60_000,
  });
}

export function useAttendanceEvents(date: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.attendance.events(date),
    queryFn: () => api.get<AttendanceEvent[]>(withQuery(API_ATTENDANCE_EVENTS, { date })),
    enabled: !!date,
  });
}

export function useClockAction() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: AttendanceAction) =>
      api.post<AttendanceEvent>(API_ATTENDANCE_EVENTS, { action }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.attendance.state() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });
}
