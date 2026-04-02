import type { RawPolicy } from "@willdesign-hr/types";
import { HOURS, SalaryTypes } from "@willdesign-hr/types";

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
