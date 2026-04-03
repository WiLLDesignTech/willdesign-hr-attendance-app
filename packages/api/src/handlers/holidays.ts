import type { RouteDefinition } from "./router.js";
import type { DepsResolver } from "../composition.js";
import { withAuth, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_HOLIDAYS, API_HOLIDAY_DELETE, currentYear, yearFromDate, KeyPatterns } from "@hr-attendance-app/types";
import type { Region, HolidaysQueryParams, CreateHolidayBody } from "@hr-attendance-app/types";

export function holidayRoutes(getDeps: DepsResolver): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_HOLIDAYS,
      handler: withAuth(getDeps, async ({ auth: _auth, deps, queryParams }) => {
        const query = queryParams as unknown as HolidaysQueryParams;
        const region = (query.region ?? "JP") as Region;
        const year = Number(query.year ?? currentYear());
        const holidays = await deps.services.holiday.getHolidays(region, year);
        return buildResponse(200, holidays);
      }),
    },
    {
      method: "POST",
      path: API_HOLIDAYS,
      handler: withAuth(getDeps, async ({ auth, deps, body }) => {
        if (!hasPermission(auth, Permissions.HOLIDAY_MANAGE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const input = body as CreateHolidayBody | null;
        if (!input?.date || !input.name || !input.region) {
          return handleError(ErrorCodes.VALIDATION, "date, name, region required");
        }
        const region = input.region as Region;
        const holiday = await deps.services.holiday.addHoliday({
          id: KeyPatterns.holiday(region, input.date),
          date: input.date,
          name: input.name,
          nameJa: input.nameJa,
          region,
          year: yearFromDate(input.date),
          isSubstitute: input.isSubstitute ?? false,
        });
        return buildResponse(201, holiday);
      }),
    },
    {
      method: "DELETE",
      path: API_HOLIDAY_DELETE,
      handler: withAuth(getDeps, async ({ auth, deps, pathParams }) => {
        if (!hasPermission(auth, Permissions.HOLIDAY_MANAGE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        await deps.services.holiday.removeHoliday(
          (pathParams["region"] ?? "JP") as Region,
          pathParams["date"] ?? "",
        );
        return buildResponse(200, { deleted: true });
      }),
    },
  ];
}
