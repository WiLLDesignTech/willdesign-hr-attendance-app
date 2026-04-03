import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { BankEntry } from "@hr-attendance-app/types";
import { todayDate } from "@hr-attendance-app/types";
import type { BankRepository, BankQueryOptions } from "@hr-attendance-app/core";
import { KEYS } from "./keys.js";

export class DynamoBankRepository implements BankRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}

  async save(entry: BankEntry): Promise<BankEntry> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: KEYS.EMP(entry.employeeId), SK: KEYS.BANK(entry.yearMonth), ...entry },
    }));
    return entry;
  }

  async findByEmployee(employeeId: string, _options?: BankQueryOptions): Promise<readonly BankEntry[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": KEYS.EMP(employeeId), ":prefix": KEYS.BANK_PREFIX },
    }));
    return (result.Items as BankEntry[]) ?? [];
  }

  async findActive(employeeId: string): Promise<readonly BankEntry[]> {
    const all = await this.findByEmployee(employeeId);
    const now = todayDate();
    return all.filter((e) => e.expiresAt >= now && e.remainingHours > 0);
  }

  async update(id: string, updates: Partial<BankEntry>): Promise<BankEntry> {
    void id; void updates;
    throw new Error("Bank update requires employee context — use save() with full entry");
  }
}
