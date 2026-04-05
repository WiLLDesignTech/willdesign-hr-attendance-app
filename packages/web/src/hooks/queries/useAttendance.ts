import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import {
  API_ATTENDANCE_STATE, API_ATTENDANCE_EVENTS, API_ATTENDANCE_SUMMARY,
  API_ATTENDANCE_EVENT_BY_ID, API_ATTENDANCE_TEAM_STATES,
  apiPath, withQuery,
} from "@hr-attendance-app/types";
import type {
  AttendanceStateRecord, AttendanceEvent, AttendanceAction,
  AttendanceSummaryResponse, EditAttendanceEventBody,
} from "@hr-attendance-app/types";

export const useAttendanceState = () => {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.attendance.state(),
    queryFn: () => api.get<AttendanceStateRecord>(API_ATTENDANCE_STATE),
    refetchInterval: 60_000,
  });
};

export const useAttendanceEvents = (date: string) => {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.attendance.events(date),
    queryFn: () => api.get<AttendanceEvent[]>(withQuery(API_ATTENDANCE_EVENTS, { date })),
    enabled: !!date,
  });
};

export const useEmployeeAttendanceEvents = (employeeId: string, date: string, enabled: boolean) => {
  const api = useApiClient();
  return useQuery({
    queryKey: [...queryKeys.attendance.events(date), employeeId],
    queryFn: () => api.get<AttendanceEvent[]>(withQuery(API_ATTENDANCE_EVENTS, { employeeId, date })),
    enabled: enabled && !!employeeId && !!date,
  });
};

export const useAttendanceSummary = () => {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.attendance.summary(),
    queryFn: () => api.get<AttendanceSummaryResponse>(API_ATTENDANCE_SUMMARY),
    refetchInterval: 60_000,
  });
};

export const useClockAction = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: AttendanceAction) =>
      api.post<AttendanceEvent>(API_ATTENDANCE_EVENTS, { action }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.attendance.state() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.attendance.summary() });
      void queryClient.invalidateQueries({ queryKey: [API_ATTENDANCE_EVENTS] });
    },
  });
};

export const useEditAttendanceEvent = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ...body }: EditAttendanceEventBody & { eventId: string }) =>
      api.patch<AttendanceEvent>(apiPath(API_ATTENDANCE_EVENT_BY_ID, { id: eventId }), body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.attendance.summary() });
    },
  });
};

export const useTeamAttendanceStates = (employeeIds: readonly string[]) => {
  const api = useApiClient();
  const idsStr = employeeIds.join(",");
  return useQuery({
    queryKey: queryKeys.attendance.teamStates(idsStr),
    queryFn: () => api.get<AttendanceStateRecord[]>(
      withQuery(API_ATTENDANCE_TEAM_STATES, { employeeIds: idsStr }),
    ),
    enabled: employeeIds.length > 0,
    refetchInterval: 60_000,
  });
};
