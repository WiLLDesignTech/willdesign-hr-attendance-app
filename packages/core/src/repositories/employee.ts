import type { Employee, EmployeeStatus } from "@hr-attendance-app/types";

export interface CreateEmployeeInput {
  readonly name: string;
  readonly email: string;
  readonly slackId: string;
  readonly employmentType: Employee["employmentType"];
  readonly region: Employee["region"];
  readonly timezone: string;
  readonly languagePreference: Employee["languagePreference"];
  readonly managerId: string | null;
  readonly joinDate: string;
  readonly probationEndDate: string | null;
}

export interface UpdateEmployeeInput {
  readonly name?: string;
  readonly email?: string;
  readonly slackId?: string;
  readonly employmentType?: Employee["employmentType"];
  readonly timezone?: string;
  readonly languagePreference?: Employee["languagePreference"];
  readonly managerId?: string | null;
  readonly status?: EmployeeStatus;
  readonly probationEndDate?: string | null;
  readonly terminationDate?: string | null;
}

export interface EmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findBySlackId(slackId: string): Promise<Employee | null>;
  findByManagerId(managerId: string): Promise<readonly Employee[]>;
  findAll(options?: { status?: EmployeeStatus }): Promise<readonly Employee[]>;
  create(input: CreateEmployeeInput): Promise<Employee>;
  update(id: string, updates: UpdateEmployeeInput): Promise<Employee>;
}
