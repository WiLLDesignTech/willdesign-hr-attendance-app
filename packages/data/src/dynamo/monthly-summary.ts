import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { MonthlySummary } from "@hr-attendance-app/types";
import type { MonthlySummaryRepository } from "@hr-attendance-app/core";
import { KEYS } from "./keys.js";

export class DynamoMonthlySummaryRepository implements MonthlySummaryRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}

  async findByEmployeeAndMonth(employeeId: string, yearMonth: string): Promise<MonthlySummary | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: KEYS.EMP(employeeId), SK: KEYS.MONTH(yearMonth) },
    }));
    return (result.Item as MonthlySummary) ?? null;
  }

  async save(summary: MonthlySummary): Promise<MonthlySummary> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: KEYS.EMP(summary.employeeId), SK: KEYS.MONTH(summary.yearMonth), ...summary },
    }));
    return summary;
  }
}
