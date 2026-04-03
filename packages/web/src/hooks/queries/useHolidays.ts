import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_HOLIDAYS, withQuery } from "@hr-attendance-app/types";
import type { Holiday } from "@hr-attendance-app/types";

export function useHolidays(region: string, year: number) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.holidays.byRegion(region, year),
    queryFn: () => api.get<Holiday[]>(withQuery(API_HOLIDAYS, { region, year })),
  });
}
