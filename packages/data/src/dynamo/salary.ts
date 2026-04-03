import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { SalaryRecord } from "@hr-attendance-app/types";
import type { SalaryRepository } from "@hr-attendance-app/core";
import { KEYS } from "./keys.js";

export class DynamoSalaryRepository implements SalaryRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}

  async getHistory(employeeId: string): Promise<readonly SalaryRecord[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": KEYS.EMP(employeeId), ":prefix": KEYS.SALARY_PREFIX },
    }));
    return (result.Items as SalaryRecord[]) ?? [];
  }

  async getEffective(employeeId: string, yearMonth: string): Promise<SalaryRecord | null> {
    const history = await this.getHistory(employeeId);
    const lastDayOfMonth = `${yearMonth}-31`;
    const applicable = history
      .filter((s) => s.effectiveFrom <= lastDayOfMonth)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    return applicable[0] ?? null;
  }

  async addEntry(entry: SalaryRecord): Promise<SalaryRecord> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.EMP(entry.employeeId),
        SK: KEYS.SALARY(entry.effectiveFrom),
        ...entry,
      },
    }));
    return entry;
  }
}
