import type { TerminationType, LegalObligation } from "@willdesign-hr/types";
import { EmployeeStatuses, TerminationTypes, AuditActions, PAYMENT, LEGAL_OBLIGATIONS } from "@willdesign-hr/types";
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
    const yearMonth = `${termDate.getFullYear()}-${String(termDate.getMonth() + 1).padStart(2, "0")}`;
    const salary = await this.deps.salaryRepo.getEffective(employeeId, yearMonth);
    const monthlySalary = salary?.amount ?? 0;

    const daysInMonth = new Date(termDate.getFullYear(), termDate.getMonth() + 1, 0).getDate();
    const workedDays = termDate.getDate();
    const proRataSalary = Math.round((monthlySalary / daysInMonth) * workedDays);

    const settlementMonth = termDate.getMonth() + 2;
    const settlementYear = settlementMonth > 12 ? termDate.getFullYear() + 1 : termDate.getFullYear();
    const settlementDeadline = `${settlementYear}-${String(settlementMonth > 12 ? 1 : settlementMonth).padStart(2, "0")}-${String(PAYMENT.SETTLEMENT_DEADLINE_DAY).padStart(2, "0")}`;

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
        ? this.addDays(termDate, LEGAL_OBLIGATIONS.CURE_PERIOD_DAYS).toISOString().split("T")[0]
        : null;

      await this.deps.auditRepo.append({
        id: `AUDIT#${Date.now()}`,
        targetId: input.employeeId,
        targetType: "EMPLOYEE",
        actorId: "SYSTEM",
        source: "admin",
        action: AuditActions.UPDATE,
        before: { status: employee.status },
        after: {
          status: EmployeeStatuses.INACTIVE,
          terminationType: input.terminationType,
          terminationDate: input.terminationDate,
          exitNotes: input.exitNotes,
        },
        timestamp: new Date().toISOString(),
      });

      return { success: true, legalObligations, curePeriodExpiry };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  private buildLegalObligations(terminationDate: Date): LegalObligation[] {
    const confExpiry = new Date(terminationDate);
    confExpiry.setFullYear(confExpiry.getFullYear() + LEGAL_OBLIGATIONS.CONFIDENTIALITY_YEARS);

    const nonCompeteExpiry = new Date(terminationDate);
    nonCompeteExpiry.setMonth(nonCompeteExpiry.getMonth() + LEGAL_OBLIGATIONS.NON_COMPETE_MONTHS);

    return [
      {
        type: "CONFIDENTIALITY",
        description: `Confidentiality obligation (${LEGAL_OBLIGATIONS.CONFIDENTIALITY_YEARS} years)`,
        expiresAt: confExpiry.toISOString().split("T")[0],
      },
      {
        type: "NON_COMPETE",
        description: `Non-compete obligation (${LEGAL_OBLIGATIONS.NON_COMPETE_MONTHS} months)`,
        expiresAt: nonCompeteExpiry.toISOString().split("T")[0],
      },
    ];
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
