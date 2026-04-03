import type { Employee, EmployeeStatus } from "@hr-attendance-app/types";
import type { EmployeeRepository, UpdateEmployeeInput } from "../repositories/employee.js";

export interface EmployeeServiceDeps {
  readonly employeeRepo: EmployeeRepository;
}

export class EmployeeService {
  private readonly deps: EmployeeServiceDeps;

  constructor(deps: EmployeeServiceDeps) {
    this.deps = deps;
  }

  async findById(id: string): Promise<Employee | null> {
    return this.deps.employeeRepo.findById(id);
  }

  async findByManagerId(managerId: string): Promise<readonly Employee[]> {
    return this.deps.employeeRepo.findByManagerId(managerId);
  }

  async findAll(options?: { status?: EmployeeStatus }): Promise<readonly Employee[]> {
    return this.deps.employeeRepo.findAll(options);
  }

  async update(id: string, updates: UpdateEmployeeInput): Promise<Employee> {
    return this.deps.employeeRepo.update(id, updates);
  }
}
