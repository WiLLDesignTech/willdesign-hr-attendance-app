import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { MonthlySummary } from "@hr-attendance-app/types";
import type { MonthlySummaryRepository } from "@hr-attendance-app/core";
import { createTenantKeys } from "./keys.js";

export class DynamoMonthlySummaryRepository implements MonthlySummaryRepository {
  private readonly keys;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    tenantId: string,
  ) {
    this.keys = createTenantKeys(tenantId);
  }

  async findByEmployeeAndMonth(employeeId: string, yearMonth: string): Promise<MonthlySummary | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: this.keys.EMP(employeeId), SK: this.keys.MONTH(yearMonth) },
    }));
    return (result.Item as MonthlySummary) ?? null;
  }

  async save(summary: MonthlySummary): Promise<MonthlySummary> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: this.keys.EMP(summary.employeeId), SK: this.keys.MONTH(summary.yearMonth), ...summary },
    }));
    return summary;
  }
}
