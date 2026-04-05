import type {
  MonthlyPayrollReport,
  MonthlyPayrollReportEntry,
  MonthlyPayrollReportTotals,
  SalaryRecord,
} from "@hr-attendance-app/types";
import { EmployeeStatuses, LeaveRequestStatuses, nowIso, isoToDateStr, daysInMonth } from "@hr-attendance-app/types";
import type { EmployeeRepository } from "../repositories/employee.js";
import type { AttendanceRepository } from "../repositories/attendance.js";
import type { SalaryRepository } from "../repositories/salary.js";
import type { LeaveRepository } from "../repositories/leave.js";
import type { PolicyService } from "../policies/service.js";
import { calculateDailyHours } from "../attendance/hours-calculator.js";
import { calculateBlendedSalary, calculatePayrollBreakdown } from "./calculator.js";
import { calculateOvertimeHours } from "../overtime/calculator.js";

export interface MonthlyPayrollReportDeps {
  readonly employeeRepo: EmployeeRepository;
  readonly attendanceRepo: AttendanceRepository;
  readonly salaryRepo: SalaryRepository;
  readonly leaveRepo: LeaveRepository;
  readonly policyService: PolicyService;
}

export class MonthlyPayrollReportService {
  private readonly deps: MonthlyPayrollReportDeps;

  constructor(deps: MonthlyPayrollReportDeps) {
    this.deps = deps;
  }

  async generate(yearMonth: string): Promise<MonthlyPayrollReport> {
    const employees = await this.deps.employeeRepo.findAll({ status: EmployeeStatuses.ACTIVE });
    const results = await Promise.all(
      employees.map((e) => this.buildEntry(e.id, e.name, e.employmentType, e.region, yearMonth)),
    );
    const entries = results.filter((e): e is MonthlyPayrollReportEntry => e !== null);

    const totals = this.calculateTotals(entries);

    return {
      yearMonth,
      generatedAt: nowIso(),
      entries,
      totals,
    };
  }

  private async buildEntry(
    employeeId: string,
    employeeName: string,
    employmentType: string,
    region: string,
    yearMonth: string,
  ): Promise<MonthlyPayrollReportEntry | null> {
    const policy = await this.deps.policyService.resolveForEmployee(employeeId);
    const requiredHours = policy.hours.monthlyMinimum;

    // Get attendance events and calculate worked hours
    const events = await this.deps.attendanceRepo.getEventsForMonth(employeeId, yearMonth);

    // Group events by date and sum daily hours
    const eventsByDate = new Map<string, typeof events>();
    for (const event of events) {
      const date = isoToDateStr(event.timestamp);
      const existing = eventsByDate.get(date) ?? [];
      eventsByDate.set(date, [...existing, event]);
    }

    let workedHours = 0;
    for (const dayEvents of eventsByDate.values()) {
      const daily = calculateDailyHours(dayEvents, 0);
      workedHours += daily.workedHours;
    }

    // Get approved leave credits for the month
    const [y, m] = yearMonth.split("-").map(Number);
    const lastDay = daysInMonth(y!, m!);
    const allLeave = await this.deps.leaveRepo.findByEmployee(employeeId);
    const leaveRequests = allLeave.filter(
      (r) => r.status === LeaveRequestStatuses.APPROVED &&
             r.startDate >= `${yearMonth}-01` &&
             r.startDate <= `${yearMonth}-${String(lastDay).padStart(2, "0")}`,
    );
    const leaveCredits = leaveRequests.length * policy.hours.dailyMinimum;

    const totalHours = workedHours + leaveCredits;
    const overtimeHours = calculateOvertimeHours(totalHours, requiredHours);
    const deficitHours = Math.max(0, requiredHours - totalHours);
    const surplusHours = Math.max(0, totalHours - requiredHours);

    // Get salary and calculate payroll
    const salaryHistory = await this.deps.salaryRepo.getHistory(employeeId);
    const blendResult = calculateBlendedSalary(salaryHistory as SalaryRecord[], yearMonth);
    const baseSalary = blendResult.blendedAmount;

    if (baseSalary === 0) return null;

    const totalDays = daysInMonth(y!, m!);
    const hourlyRate = Math.round(baseSalary / requiredHours);

    const payroll = calculatePayrollBreakdown({
      employeeId,
      yearMonth,
      baseSalary,
      currency: (salaryHistory[0]?.currency ?? "JPY") as "JPY" | "NPR",
      overtimeHours,
      overtimeRate: policy.overtime.rates.standard,
      hourlyRateForOvertime: hourlyRate,
      allowances: [],
      bonus: 0,
      commission: 0,
      deficitHours,
      monthlyHourlyRate: hourlyRate,
      proRataDays: null,
      totalDays,
      exchangeRate: null,
      exchangeRateDate: null,
      transferFees: 0,
    });

    return {
      employeeId,
      employeeName,
      employmentType,
      region,
      workedHours,
      requiredHours,
      leaveCredits,
      deficitHours,
      surplusHours,
      overtimeHours,
      payroll,
    };
  }

  private calculateTotals(entries: readonly MonthlyPayrollReportEntry[]): MonthlyPayrollReportTotals {
    let totalWorked = 0;
    let totalRequired = 0;
    let totalNet = 0;
    let totalOvertime = 0;
    let totalDeficit = 0;
    let totalSurplus = 0;

    for (const entry of entries) {
      totalWorked += entry.workedHours;
      totalRequired += entry.requiredHours;
      totalNet += entry.payroll.netAmount;
      totalOvertime += entry.overtimeHours;
      totalDeficit += entry.deficitHours;
      totalSurplus += entry.surplusHours;
    }

    return { totalWorked, totalRequired, totalNet, totalOvertime, totalDeficit, totalSurplus };
  }
}
