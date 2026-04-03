import type { RawPolicy } from "@hr-attendance-app/types";
import { HOURS } from "@hr-attendance-app/types";

/** JP intern — reduced hours, no bonus, no overtime. */
export const jpInternPolicy: RawPolicy = {
  hours: {
    monthlyMinimum: HOURS.MONTHLY_PART_TIME,
  },
  overtime: {
    deemedHours: 0,
    monthlyLimit: 0,
    yearlyLimit: 0,
  },
  compensation: {
    bonusSchedule: [],
    commissionTracking: false,
  },
  leave: {
    mandatoryUsageDays: 0,
  },
};
