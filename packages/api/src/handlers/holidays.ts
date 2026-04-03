import type { RouteDefinition } from "./router.js";
import type { AppDeps } from "../composition.js";
import { parseAuthContext, buildResponse, handleError } from "../middleware/index.js";
import { hasPermission } from "@hr-attendance-app/core";
import { ErrorCodes, ErrorMessages, Permissions, API_HOLIDAYS, API_HOLIDAY_DELETE, currentYear, yearFromDate } from "@hr-attendance-app/types";
import type { Region, HolidaysQueryParams, CreateHolidayBody } from "@hr-attendance-app/types";

export function holidayRoutes(deps: AppDeps): RouteDefinition[] {
  return [
    {
      method: "GET",
      path: API_HOLIDAYS,
      handler: async ({ claims, queryParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        const query = queryParams as unknown as HolidaysQueryParams;
        const region = (query.region ?? "JP") as Region;
        const year = Number(query.year ?? currentYear());
        const holidays = await deps.services.holiday.getHolidays(region, year);
        return buildResponse(200, holidays);
      },
    },
    {
      method: "POST",
      path: API_HOLIDAYS,
      handler: async ({ claims, body }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasPermission(auth.data, Permissions.HOLIDAY_MANAGE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        const input = body as CreateHolidayBody | null;
        if (!input?.date || !input.name || !input.region) {
          return handleError(ErrorCodes.VALIDATION, "date, name, region required");
        }
        const region = input.region as Region;
        const holiday = await deps.services.holiday.addHoliday({
          id: `HOL#${region}#${input.date}`,
          date: input.date,
          name: input.name,
          nameJa: input.nameJa,
          region,
          year: yearFromDate(input.date),
          isSubstitute: input.isSubstitute ?? false,
        });
        return buildResponse(201, holiday);
      },
    },
    {
      method: "DELETE",
      path: API_HOLIDAY_DELETE,
      handler: async ({ claims, pathParams }) => {
        const auth = parseAuthContext(claims);
        if (!auth.success) return handleError(ErrorCodes.UNAUTHORIZED, auth.error);
        if (!hasPermission(auth.data, Permissions.HOLIDAY_MANAGE)) {
          return handleError(ErrorCodes.FORBIDDEN, ErrorMessages.INSUFFICIENT_PERMISSIONS);
        }
        await deps.services.holiday.removeHoliday(
          (pathParams["region"] ?? "JP") as Region,
          pathParams["date"] ?? "",
        );
        return buildResponse(200, { deleted: true });
      },
    },
  ];
}
