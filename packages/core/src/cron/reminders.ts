import { CRON } from "@willdesign-hr/types";
import type { EmployeeRepository } from "../repositories/employee.js";
import type { LeaveRepository } from "../repositories/leave.js";
import type { BankRepository } from "../repositories/bank.js";

export interface ReminderDeps {
  readonly employeeRepo: EmployeeRepository;
  readonly leaveRepo: LeaveRepository;
  readonly bankRepo: BankRepository;
}

export interface LeaveReminder {
  readonly leaveRequestId: string;
  readonly employeeId: string;
  readonly managerId: string;
}

export interface SurplusExpiryWarning {
  readonly employeeId: string;
  readonly bankEntryId: string;
  readonly expiresAt: string;
  readonly remainingHours: number;
}

export interface ProbationAlert {
  readonly employeeId: string;
  readonly managerId: string;
  readonly probationEndDate: string;
}

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

export class ReminderService {
  private readonly deps: ReminderDeps;

  constructor(deps: ReminderDeps) {
    this.deps = deps;
  }

  async checkPendingLeaveReminders(now: Date): Promise<readonly LeaveReminder[]> {
    const pending = await this.deps.leaveRepo.findPending();
    const thresholdMs = CRON.LEAVE_REMINDER_THRESHOLD_HOURS * MS_PER_HOUR;
    const reminders: LeaveReminder[] = [];

    for (const req of pending) {
      const ageMs = now.getTime() - new Date(req.createdAt).getTime();
      if (ageMs < thresholdMs) continue;

      const employee = await this.deps.employeeRepo.findById(req.employeeId);
      if (!employee?.managerId) continue;

      reminders.push({
        leaveRequestId: req.id,
        employeeId: req.employeeId,
        managerId: employee.managerId,
      });
    }

    return reminders;
  }

  async checkSurplusExpiryWarnings(now: Date): Promise<readonly SurplusExpiryWarning[]> {
    const employees = await this.deps.employeeRepo.findAll({ status: "ACTIVE" });
    const warningThresholdMs = CRON.SURPLUS_EXPIRY_WARNING_DAYS * MS_PER_DAY;
    const warnings: SurplusExpiryWarning[] = [];

    for (const emp of employees) {
      const active = await this.deps.bankRepo.findActive(emp.id);

      for (const entry of active) {
        const msUntilExpiry = new Date(entry.expiresAt).getTime() - now.getTime();
        if (msUntilExpiry > 0 && msUntilExpiry <= warningThresholdMs) {
          warnings.push({
            employeeId: emp.id,
            bankEntryId: entry.id,
            expiresAt: entry.expiresAt,
            remainingHours: entry.remainingHours,
          });
        }
      }
    }

    return warnings;
  }

  async checkProbationAlerts(now: Date): Promise<readonly ProbationAlert[]> {
    const employees = await this.deps.employeeRepo.findAll({ status: "ACTIVE" });
    const alertThresholdMs = CRON.PROBATION_ALERT_DAYS * MS_PER_DAY;
    const alerts: ProbationAlert[] = [];

    for (const emp of employees) {
      if (!emp.probationEndDate || !emp.managerId) continue;

      const msUntilEnd = new Date(emp.probationEndDate).getTime() - now.getTime();
      if (msUntilEnd > 0 && msUntilEnd <= alertThresholdMs) {
        alerts.push({
          employeeId: emp.id,
          managerId: emp.managerId,
          probationEndDate: emp.probationEndDate,
        });
      }
    }

    return alerts;
  }
}
