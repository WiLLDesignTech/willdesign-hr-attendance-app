import type { RawPolicy } from "@hr-attendance-app/types";
import { JP_LABOR } from "@hr-attendance-app/types";

/** 正社員 — JP full-time employee. Deemed overtime 45h included. */
export const jpFulltimePolicy: RawPolicy = {
  overtime: {
    deemedHours: JP_LABOR.DEEMED_OVERTIME_HOURS,
  },
};
