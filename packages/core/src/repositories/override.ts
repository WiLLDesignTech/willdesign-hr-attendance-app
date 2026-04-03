import type { Override, OverridePeriod } from "@hr-attendance-app/types";

export interface OverrideRepository {
  findByEmployee(employeeId: string, period: OverridePeriod, periodValue: string): Promise<Override | null>;
  save(override: Override): Promise<Override>;
}
