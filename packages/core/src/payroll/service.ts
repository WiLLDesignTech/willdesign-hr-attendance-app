import type { PayrollBreakdown, SalaryRecord } from "@hr-attendance-app/types";
import type { SalaryRepository } from "../repositories/salary.js";
import { getEffectiveSalary, calculatePayrollBreakdown } from "./calculator.js";

export interface PayrollServiceDeps {
  readonly salaryRepo: SalaryRepository;
}

export class PayrollService {
  private readonly deps: PayrollServiceDeps;

  constructor(deps: PayrollServiceDeps) {
    this.deps = deps;
  }

  async getBreakdown(employeeId: string, yearMonth: string): Promise<PayrollBreakdown | null> {
    const history = await this.deps.salaryRepo.getHistory(employeeId);
    const effective = getEffectiveSalary(history as SalaryRecord[], yearMonth);
    if (!effective) return null;

    const [year, month] = yearMonth.split("-").map(Number);
    const totalDays = new Date(year!, (month ?? 1), 0).getDate();
    const hourlyRate = Math.round(effective.amount / 160);

    return calculatePayrollBreakdown({
      employeeId,
      yearMonth,
      baseSalary: effective.amount,
      currency: effective.currency as PayrollBreakdown["currency"],
      overtimeHours: 0,
      overtimeRate: 1.25,
      hourlyRateForOvertime: hourlyRate,
      allowances: [],
      bonus: 0,
      commission: 0,
      deficitHours: 0,
      monthlyHourlyRate: hourlyRate,
      proRataDays: null,
      totalDays,
      exchangeRate: null,
      exchangeRateDate: null,
      transferFees: 0,
    });
  }
}
