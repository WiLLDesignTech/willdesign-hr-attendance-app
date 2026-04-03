import type { RawPolicy } from "@hr-attendance-app/types";
import { HOURS, SalaryTypes } from "@hr-attendance-app/types";

/** パートタイム — JP part-time. Pro-rata hours, salary type hourly. */
export const jpParttimePolicy: RawPolicy = {
  hours: {
    monthlyMinimum: HOURS.MONTHLY_PART_TIME,
  },
  compensation: {
    salaryType: SalaryTypes.HOURLY,
    bonusSchedule: [],
    commissionTracking: false,
  },
  overtime: {
    deemedHours: 0,
  },
};
