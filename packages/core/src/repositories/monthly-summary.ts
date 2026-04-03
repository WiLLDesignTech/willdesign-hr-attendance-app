import type { MonthlySummary } from "@hr-attendance-app/types";

export interface MonthlySummaryRepository {
  findByEmployeeAndMonth(employeeId: string, yearMonth: string): Promise<MonthlySummary | null>;
  save(summary: MonthlySummary): Promise<MonthlySummary>;
}
