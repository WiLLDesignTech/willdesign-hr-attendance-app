import type { TerminationType, LegalObligation } from "@hr-attendance-app/types";
import {
  EmployeeStatuses, TerminationTypes, AuditActions, AuditTargetTypes, AuditSources, AuditActorIds,
  LegalObligationTypes, PAYMENT, LEGAL_OBLIGATIONS, KeyPatterns,
  nowIso, timestampId, dateToDateStr, dateToIso, isoToYearMonth, formatYearMonth, daysInMonth, addDays, addMonths, addYears,
} from "@hr-attendance-app/types";
import type { EmployeeRepository } from "../repositories/employee.js";
import type { SalaryRepository } from "../repositories/salary.js";
import type { AuthProviderAdapter } from "../repositories/auth-provider-adapter.js";
import type { AuditRepository } from "../repositories/audit.js";

export interface OffboardingDeps {
  readonly employeeRepo: EmployeeRepository;
  readonly salaryRepo: SalaryRepository;
  readonly authProvider: AuthProviderAdapter;
  readonly auditRepo: AuditRepository;
}

export interface SettlementPreview {
  readonly proRataSalary: number;
  readonly buyoutAmount: number;
  readonly settlementDeadline: string;
}

export interface OffboardingInput {
  readonly employeeId: string;
  readonly terminationType: TerminationType;
  readonly terminationDate: string;
  readonly noticePeriodBuyout: boolean;
  readonly exitNotes: string | null;
}

export interface OffboardingResult {
  readonly success: boolean;
  readonly legalObligations?: readonly LegalObligation[];
  readonly curePeriodExpiry?: string | null;
  readonly error?: string;
}

export class OffboardingService {
  private readonly deps: OffboardingDeps;

  constructor(deps: OffboardingDeps) {
    this.deps = deps;
  }

  async getSettlementPreview(employeeId: string, terminationDate: string): Promise<SettlementPreview> {
    const termDate = new Date(terminationDate);
    const yearMonth = formatYearMonth(termDate.getFullYear(), termDate.getMonth() + 1);
    const salary = await this.deps.salaryRepo.getEffective(employeeId, yearMonth);
    const monthlySalary = salary?.amount ?? 0;

    const monthDays = daysInMonth(termDate.getFullYear(), termDate.getMonth() + 1);
    const workedDays = termDate.getDate();
    const proRataSalary = Math.round((monthlySalary / monthDays) * workedDays);

    const settlementDate = addMonths(termDate, 1);
    const settlementYm = isoToYearMonth(dateToIso(settlementDate));
    const settlementDeadline = `${settlementYm}-${String(PAYMENT.SETTLEMENT_DEADLINE_DAY).padStart(2, "0")}`;

    return {
      proRataSalary,
      buyoutAmount: monthlySalary,
      settlementDeadline,
    };
  }

  async offboard(input: OffboardingInput): Promise<OffboardingResult> {
    try {
      const employee = await this.deps.employeeRepo.findById(input.employeeId);
      if (!employee) {
        return { success: false, error: "Employee not found" };
      }

      await this.deps.employeeRepo.update(input.employeeId, {
        status: EmployeeStatuses.INACTIVE,
        terminationDate: input.terminationDate,
      });

      await this.deps.authProvider.disableUser(input.employeeId);

      const termDate = new Date(input.terminationDate);
      const legalObligations = this.buildLegalObligations(termDate);

      const curePeriodExpiry = input.terminationType === TerminationTypes.FOR_CAUSE
        ? dateToDateStr(addDays(termDate, LEGAL_OBLIGATIONS.CURE_PERIOD_DAYS))
        : null;

      await this.deps.auditRepo.append({
        id: KeyPatterns.audit(timestampId()),
        targetId: input.employeeId,
        targetType: AuditTargetTypes.EMPLOYEE,
        actorId: AuditActorIds.SYSTEM,
        source: AuditSources.ADMIN,
        action: AuditActions.UPDATE,
        before: { status: employee.status },
        after: {
          status: EmployeeStatuses.INACTIVE,
          terminationType: input.terminationType,
          terminationDate: input.terminationDate,
          exitNotes: input.exitNotes,
        },
        timestamp: nowIso(),
      });

      return { success: true, legalObligations, curePeriodExpiry };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  private buildLegalObligations(terminationDate: Date): LegalObligation[] {
    const confExpiry = addYears(terminationDate, LEGAL_OBLIGATIONS.CONFIDENTIALITY_YEARS);
    const nonCompeteExpiry = addMonths(terminationDate, LEGAL_OBLIGATIONS.NON_COMPETE_MONTHS);

    return [
      {
        type: LegalObligationTypes.CONFIDENTIALITY,
        description: `Confidentiality obligation (${LEGAL_OBLIGATIONS.CONFIDENTIALITY_YEARS} years)`,
        expiresAt: dateToDateStr(confExpiry),
      },
      {
        type: LegalObligationTypes.NON_COMPETE,
        description: `Non-compete obligation (${LEGAL_OBLIGATIONS.NON_COMPETE_MONTHS} months)`,
        expiresAt: dateToDateStr(nonCompeteExpiry),
      },
    ];
  }

}
