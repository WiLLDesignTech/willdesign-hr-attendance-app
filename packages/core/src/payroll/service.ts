import type { PayrollBreakdown, SalaryRecord } from "@hr-attendance-app/types";
import { daysInMonth } from "@hr-attendance-app/types";
import type { SalaryRepository } from "../repositories/salary.js";
import type { PolicyService } from "../policies/service.js";
import { getEffectiveSalary, calculatePayrollBreakdown } from "./calculator.js";

export interface PayrollServiceDeps {
  readonly salaryRepo: SalaryRepository;
  readonly policyService?: PolicyService;
}

export class PayrollService {
  private readonly deps: PayrollServiceDeps;

  constructor(deps: PayrollServiceDeps) {
    this.deps = deps;
  }

  async getSalaryHistory(employeeId: string): Promise<readonly SalaryRecord[]> {
    return this.deps.salaryRepo.getHistory(employeeId);
  }

  async addSalaryEntry(entry: SalaryRecord): Promise<SalaryRecord> {
    return this.deps.salaryRepo.addEntry(entry);
  }

  async getBreakdown(employeeId: string, yearMonth: string): Promise<PayrollBreakdown | null> {
    const history = await this.deps.salaryRepo.getHistory(employeeId);
    const effective = getEffectiveSalary(history as SalaryRecord[], yearMonth);
    if (!effective) return null;

    let monthlyMinimum = 160;
    let overtimeRate = 1.25;

    if (this.deps.policyService) {
      const policy = await this.deps.policyService.resolveForEmployee(employeeId).catch(() => null);
      if (policy) {
        monthlyMinimum = policy.hours.monthlyMinimum;
        overtimeRate = policy.overtime.rates.standard;
      }
    }

    const [year, month] = yearMonth.split("-").map(Number);
    const totalDays = daysInMonth(year!, month ?? 1);
    const hourlyRate = Math.round(effective.amount / monthlyMinimum);

    return calculatePayrollBreakdown({
      employeeId,
      yearMonth,
      baseSalary: effective.amount,
      currency: effective.currency as PayrollBreakdown["currency"],
      overtimeHours: 0,
      overtimeRate,
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
