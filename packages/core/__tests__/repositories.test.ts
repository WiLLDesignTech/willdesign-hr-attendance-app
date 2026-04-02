import { describe, it, expect } from "vitest";
import { AttendanceStates } from "@willdesign-hr/types";
import type {
  EmployeeRepository,
  AttendanceRepository,
  LeaveRepository,
  SalaryRepository,
  ReportRepository,
  FlagRepository,
  BankRepository,
  AuditRepository,
  HolidayRepository,
  OverrideRepository,
  PolicyRepository,
  RoleRepository,
  MonthlySummaryRepository,
  DocumentRepository,
  EmailAdapter,
  AuthProviderAdapter,
} from "../src/repositories/index.js";

describe("Repository interfaces (ports)", () => {
  it("EmployeeRepository has required methods", () => {
    const mock: EmployeeRepository = {
      findById: async () => null,
      findBySlackId: async () => null,
      findByManagerId: async () => [],
      findAll: async () => [],
      create: async (input) => ({ ...input, id: "EMP#1", createdAt: "", updatedAt: "" }) as never,
      update: async () => ({}) as never,
    };
    expect(mock.findById).toBeDefined();
    expect(mock.findBySlackId).toBeDefined();
    expect(mock.findByManagerId).toBeDefined();
    expect(mock.findAll).toBeDefined();
    expect(mock.create).toBeDefined();
    expect(mock.update).toBeDefined();
  });

  it("AttendanceRepository has required methods", () => {
    const mock: AttendanceRepository = {
      getState: async () => ({ employeeId: "", state: AttendanceStates.IDLE, lastEventId: null, lastEventTimestamp: null }),
      saveState: async () => {},
      saveEvent: async () => {},
      getEventsForDate: async () => [],
      getEventsForMonth: async () => [],
      getUnclosedSessions: async () => [],
    };
    expect(mock.getState).toBeDefined();
    expect(mock.saveState).toBeDefined();
    expect(mock.saveEvent).toBeDefined();
    expect(mock.getEventsForDate).toBeDefined();
    expect(mock.getEventsForMonth).toBeDefined();
    expect(mock.getUnclosedSessions).toBeDefined();
  });

  it("LeaveRepository has required methods", () => {
    const mock: LeaveRepository = {
      create: async () => ({}) as never,
      findById: async () => null,
      findByEmployee: async () => [],
      findPending: async () => [],
      update: async () => ({}) as never,
    };
    expect(mock.create).toBeDefined();
    expect(mock.findById).toBeDefined();
    expect(mock.findByEmployee).toBeDefined();
    expect(mock.findPending).toBeDefined();
    expect(mock.update).toBeDefined();
  });

  it("SalaryRepository has required methods", () => {
    const mock: SalaryRepository = {
      getHistory: async () => [],
      getEffective: async () => null,
      addEntry: async () => ({}) as never,
    };
    expect(mock.getHistory).toBeDefined();
    expect(mock.getEffective).toBeDefined();
    expect(mock.addEntry).toBeDefined();
  });

  it("ReportRepository has required methods", () => {
    const mock: ReportRepository = {
      save: async () => ({}) as never,
      findByEmployeeAndDate: async () => [],
      findLatestVersion: async () => null,
    };
    expect(mock.save).toBeDefined();
    expect(mock.findByEmployeeAndDate).toBeDefined();
    expect(mock.findLatestVersion).toBeDefined();
  });

  it("FlagRepository has required methods", () => {
    const mock: FlagRepository = {
      save: async () => ({}) as never,
      findByEmployee: async () => [],
      findPending: async () => [],
      update: async () => ({}) as never,
    };
    expect(mock.save).toBeDefined();
    expect(mock.findByEmployee).toBeDefined();
    expect(mock.findPending).toBeDefined();
    expect(mock.update).toBeDefined();
  });

  it("BankRepository has required methods", () => {
    const mock: BankRepository = {
      save: async () => ({}) as never,
      findByEmployee: async () => [],
      findActive: async () => [],
      update: async () => ({}) as never,
    };
    expect(mock.save).toBeDefined();
    expect(mock.findByEmployee).toBeDefined();
    expect(mock.findActive).toBeDefined();
    expect(mock.update).toBeDefined();
  });

  it("AuditRepository has required methods", () => {
    const mock: AuditRepository = {
      append: async () => {},
      findByTarget: async () => [],
      findByActor: async () => [],
    };
    expect(mock.append).toBeDefined();
    expect(mock.findByTarget).toBeDefined();
    expect(mock.findByActor).toBeDefined();
  });

  it("HolidayRepository has required methods", () => {
    const mock: HolidayRepository = {
      findByRegionAndYear: async () => [],
      save: async () => ({}) as never,
      delete: async () => {},
    };
    expect(mock.findByRegionAndYear).toBeDefined();
    expect(mock.save).toBeDefined();
    expect(mock.delete).toBeDefined();
  });

  it("OverrideRepository has required methods", () => {
    const mock: OverrideRepository = {
      findByEmployee: async () => null,
      save: async () => ({}) as never,
    };
    expect(mock.findByEmployee).toBeDefined();
    expect(mock.save).toBeDefined();
  });

  it("PolicyRepository has required methods", () => {
    const mock: PolicyRepository = {
      getCompanyPolicy: async () => ({}),
      getGroupPolicy: async () => null,
      getUserPolicy: async () => null,
      saveGroupPolicy: async () => {},
      saveUserPolicy: async () => {},
    };
    expect(mock.getCompanyPolicy).toBeDefined();
    expect(mock.getGroupPolicy).toBeDefined();
    expect(mock.getUserPolicy).toBeDefined();
    expect(mock.saveGroupPolicy).toBeDefined();
    expect(mock.saveUserPolicy).toBeDefined();
  });

  it("RoleRepository has required methods", () => {
    const mock: RoleRepository = {
      findByName: async () => null,
      findAll: async () => [],
      save: async () => ({}) as never,
      delete: async () => {},
    };
    expect(mock.findByName).toBeDefined();
    expect(mock.findAll).toBeDefined();
    expect(mock.save).toBeDefined();
    expect(mock.delete).toBeDefined();
  });

  it("MonthlySummaryRepository has required methods", () => {
    const mock: MonthlySummaryRepository = {
      findByEmployeeAndMonth: async () => null,
      save: async () => ({}) as never,
    };
    expect(mock.findByEmployeeAndMonth).toBeDefined();
    expect(mock.save).toBeDefined();
  });

  it("DocumentRepository has required methods", () => {
    const mock: DocumentRepository = {
      save: async () => ({}) as never,
      findByEmployee: async () => [],
      getUploadUrl: async () => "https://s3.example.com/upload",
      getDownloadUrl: async () => "https://s3.example.com/download",
    };
    expect(mock.save).toBeDefined();
    expect(mock.findByEmployee).toBeDefined();
    expect(mock.getUploadUrl).toBeDefined();
    expect(mock.getDownloadUrl).toBeDefined();
  });

  it("EmailAdapter has required methods", () => {
    const mock: EmailAdapter = {
      sendEmail: async () => {},
    };
    expect(mock.sendEmail).toBeDefined();
  });

  it("AuthProviderAdapter has required methods", () => {
    const mock: AuthProviderAdapter = {
      createUser: async () => ({ authUserId: "auth-1" }),
      disableUser: async () => {},
      deleteUser: async () => {},
      setTemporaryPassword: async () => {},
      updateAttributes: async () => {},
    };
    expect(mock.createUser).toBeDefined();
    expect(mock.disableUser).toBeDefined();
    expect(mock.deleteUser).toBeDefined();
    expect(mock.setTemporaryPassword).toBeDefined();
    expect(mock.updateAttributes).toBeDefined();
  });
});
