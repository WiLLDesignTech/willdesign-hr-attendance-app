import type { Flag, AttendanceEvent } from "@willdesign-hr/types";
import { FlagLevels, FlagStatuses, AttendanceStates, AttendanceActions, CRON } from "@willdesign-hr/types";
import type { EmployeeRepository } from "../repositories/employee.js";
import type { AttendanceRepository } from "../repositories/attendance.js";
import type { FlagRepository } from "../repositories/flag.js";
import type { BankRepository } from "../repositories/bank.js";
import type { AuditRepository } from "../repositories/audit.js";

export interface CronDeps {
  readonly employeeRepo: EmployeeRepository;
  readonly attendanceRepo: AttendanceRepository;
  readonly flagRepo: FlagRepository;
  readonly bankRepo: BankRepository;
  readonly auditRepo: AuditRepository;
}

export interface DailyCheckResult {
  readonly unclosedCount: number;
  readonly openBreakCount: number;
  readonly shortSessionCount: number;
  readonly shortfallCount: number;
}

export interface WeeklyCheckResult {
  readonly weeklyFlagCount: number;
}

export interface MonthlyCheckResult {
  readonly surplusExpiredCount: number;
  readonly monthlyFlagCount: number;
}

export class CronService {
  private readonly deps: CronDeps;

  constructor(deps: CronDeps) {
    this.deps = deps;
  }

  async runDailyChecks(date: string): Promise<DailyCheckResult> {
    let unclosedCount = 0;
    let openBreakCount = 0;
    let shortSessionCount = 0;
    let shortfallCount = 0;

    const unclosed = await this.deps.attendanceRepo.getUnclosedSessions(date);

    for (const session of unclosed) {
      if (session.state === AttendanceStates.ON_BREAK) {
        openBreakCount++;
      } else {
        unclosedCount++;
      }

      await this.deps.flagRepo.save(this.buildFlag(
        session.employeeId,
        FlagLevels.DAILY,
        date,
        0,
      ));
    }

    const employees = await this.deps.employeeRepo.findAll({ status: "ACTIVE" });

    for (const emp of employees) {
      const events = await this.deps.attendanceRepo.getEventsForDate(emp.id, date);
      if (events.length === 0) continue;

      const sessionMinutes = this.calculateSessionMinutes(events);
      if (sessionMinutes > 0 && sessionMinutes < CRON.MIN_SESSION_MINUTES) {
        shortSessionCount++;
        await this.deps.flagRepo.save(this.buildFlag(
          emp.id,
          FlagLevels.DAILY,
          date,
          0,
        ));
      }
    }

    return { unclosedCount, openBreakCount, shortSessionCount, shortfallCount };
  }

  async runWeeklyChecks(_weekEndDate: string, _totalHours?: number): Promise<WeeklyCheckResult> {
    const weeklyFlagCount = 0;
    return { weeklyFlagCount };
  }

  async runMonthlyChecks(yearMonth: string): Promise<MonthlyCheckResult> {
    let surplusExpiredCount = 0;
    let monthlyFlagCount = 0;

    const employees = await this.deps.employeeRepo.findAll({ status: "ACTIVE" });

    for (const emp of employees) {
      const activeEntries = await this.deps.bankRepo.findActive(emp.id);
      const now = new Date();

      for (const entry of activeEntries) {
        if (new Date(entry.expiresAt) <= now) {
          surplusExpiredCount++;
          await this.deps.bankRepo.update(entry.id, { remainingHours: 0 });
        }
      }
    }

    return { surplusExpiredCount, monthlyFlagCount };
  }

  private calculateSessionMinutes(events: readonly AttendanceEvent[]): number {
    const clockIn = events.find(e => e.action === AttendanceActions.CLOCK_IN);
    const clockOut = events.find(e => e.action === AttendanceActions.CLOCK_OUT);

    if (!clockIn || !clockOut) return 0;

    const diffMs = new Date(clockOut.timestamp).getTime() - new Date(clockIn.timestamp).getTime();
    return diffMs / 60_000;
  }

  private buildFlag(employeeId: string, level: Flag["level"], period: string, deficitHours: number): Flag {
    return {
      id: `FLAG#${employeeId}#${period}#${Date.now()}`,
      employeeId,
      level,
      period,
      deficitHours,
      status: FlagStatuses.PENDING,
      createdAt: new Date().toISOString(),
    };
  }
}
