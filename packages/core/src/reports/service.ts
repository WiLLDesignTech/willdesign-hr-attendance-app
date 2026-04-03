import type { DailyReport } from "@willdesign-hr/types";
import { KeyPatterns, todayDate, nowIso } from "@willdesign-hr/types";
import type { ReportRepository } from "../repositories/report.js";
import { parseReport } from "./parser.js";

export interface ReportServiceDeps {
  readonly reportRepo: ReportRepository;
}

export class ReportService {
  private readonly deps: ReportServiceDeps;

  constructor(deps: ReportServiceDeps) {
    this.deps = deps;
  }

  async findByDate(employeeId: string, date: string): Promise<readonly DailyReport[]> {
    return this.deps.reportRepo.findByEmployeeAndDate(employeeId, date);
  }

  async create(employeeId: string, text: string, date?: string): Promise<DailyReport> {
    const reportDate = date ?? todayDate();
    const parsed = parseReport(text);
    const version = 1;
    const now = nowIso();

    const report: DailyReport = {
      id: `${KeyPatterns.employee(employeeId)}#${KeyPatterns.report(reportDate, version)}`,
      employeeId,
      date: reportDate,
      yesterday: parsed.yesterday,
      today: parsed.today,
      blockers: parsed.blockers,
      references: parsed.references,
      version,
      slackMessageTs: "",
      createdAt: now,
      updatedAt: now,
    };

    return this.deps.reportRepo.save(report);
  }
}
