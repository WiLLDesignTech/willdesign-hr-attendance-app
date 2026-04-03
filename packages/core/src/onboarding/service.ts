import type { Role, Currency, LanguagePreference, Region, SalaryRecord } from "@willdesign-hr/types";
import { SalaryChangeTypes, SalaryTypes, AuditActions, EmployeeStatuses } from "@willdesign-hr/types";
import type { EmployeeRepository, CreateEmployeeInput } from "../repositories/employee.js";
import type { SalaryRepository } from "../repositories/salary.js";
import type { AuthProviderAdapter } from "../repositories/auth-provider-adapter.js";
import type { AuditRepository } from "../repositories/audit.js";

export interface OnboardingDeps {
  readonly employeeRepo: EmployeeRepository;
  readonly salaryRepo: SalaryRepository;
  readonly authProvider: AuthProviderAdapter;
  readonly auditRepo: AuditRepository;
}

export interface OnboardingInput {
  readonly name: string;
  readonly email: string;
  readonly slackId: string;
  readonly employmentType: CreateEmployeeInput["employmentType"];
  readonly region: Region;
  readonly timezone: string;
  readonly languagePreference: LanguagePreference;
  readonly managerId: string | null;
  readonly joinDate: string;
  readonly probationEndDate: string | null;
  readonly monthlySalary: number;
  readonly currency: Currency;
  readonly role: Role;
}

export interface OnboardingResult {
  readonly success: boolean;
  readonly employeeId?: string;
  readonly error?: string;
}

export class OnboardingService {
  private readonly deps: OnboardingDeps;

  constructor(deps: OnboardingDeps) {
    this.deps = deps;
  }

  async onboard(input: OnboardingInput): Promise<OnboardingResult> {
    let employeeId: string | undefined;

    try {
      const employee = await this.deps.employeeRepo.create({
        name: input.name,
        email: input.email,
        slackId: input.slackId,
        employmentType: input.employmentType,
        region: input.region,
        timezone: input.timezone,
        languagePreference: input.languagePreference,
        managerId: input.managerId,
        joinDate: input.joinDate,
        probationEndDate: input.probationEndDate,
      });

      employeeId = employee.id;

      await this.deps.authProvider.createUser({
        email: input.email,
        employeeId: employee.id,
        role: input.role,
        preferredLanguage: input.languagePreference,
      });

      const salaryEntry: SalaryRecord = {
        id: `SAL#${employee.id}#${Date.now()}`,
        employeeId: employee.id,
        amount: input.monthlySalary,
        currency: input.currency,
        salaryType: SalaryTypes.MONTHLY,
        changeType: SalaryChangeTypes.INITIAL,
        effectiveFrom: input.joinDate,
        createdAt: new Date().toISOString(),
      };

      await this.deps.salaryRepo.addEntry(salaryEntry);

      await this.deps.auditRepo.append({
        id: `AUDIT#${Date.now()}`,
        targetId: employee.id,
        targetType: "EMPLOYEE",
        actorId: "SYSTEM",
        source: "web",
        action: AuditActions.CREATE,
        before: null,
        after: { employeeId: employee.id, name: input.name },
        timestamp: new Date().toISOString(),
      });

      return { success: true, employeeId: employee.id };
    } catch (error) {
      if (employeeId) {
        await this.deps.employeeRepo.update(employeeId, { status: EmployeeStatuses.INACTIVE }).catch(() => {});
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
