import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { DailyReport } from "@hr-attendance-app/types";
import type { ReportRepository } from "@hr-attendance-app/core";
import { KEYS } from "./keys.js";

export class DynamoReportRepository implements ReportRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}

  async save(report: DailyReport): Promise<DailyReport> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.EMP(report.employeeId), SK: KEYS.REPORT(report.date, report.version),
        GSI2PK: KEYS.GSI2.ORG_REPORT(report.date), GSI2SK: KEYS.EMP(report.employeeId),
        ...report,
      },
    }));
    return report;
  }

  async findByEmployeeAndDate(employeeId: string, date: string): Promise<readonly DailyReport[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": KEYS.EMP(employeeId), ":prefix": KEYS.REPORT_PREFIX(date) },
    }));
    return (result.Items as DailyReport[]) ?? [];
  }

  async findLatestVersion(employeeId: string, date: string): Promise<DailyReport | null> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": KEYS.EMP(employeeId), ":prefix": KEYS.REPORT_PREFIX(date) },
      ScanIndexForward: false,
      Limit: 1,
    }));
    return (result.Items?.[0] as DailyReport) ?? null;
  }
}
