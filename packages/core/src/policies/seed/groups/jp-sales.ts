import type { RawPolicy } from "@hr-attendance-app/types";
import { JP_LABOR } from "@hr-attendance-app/types";

/** JP sales — deemed overtime 45h, commission tracking enabled. */
export const jpSalesPolicy: RawPolicy = {
  overtime: {
    deemedHours: JP_LABOR.DEEMED_OVERTIME_HOURS,
  },
  compensation: {
    commissionTracking: true,
  },
};
