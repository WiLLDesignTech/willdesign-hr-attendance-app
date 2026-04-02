import type { Flag, FlagLevel, FlagStatus } from "@willdesign-hr/types";

export interface FlagQueryOptions {
  readonly level?: FlagLevel;
  readonly status?: FlagStatus;
  readonly period?: string;
}

export interface FlagRepository {
  save(flag: Flag): Promise<Flag>;
  findByEmployee(employeeId: string, options?: FlagQueryOptions): Promise<readonly Flag[]>;
  findPending(): Promise<readonly Flag[]>;
  update(id: string, updates: Partial<Flag>): Promise<Flag>;
}
