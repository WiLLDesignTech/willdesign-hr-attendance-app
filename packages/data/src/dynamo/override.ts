import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { Override, OverridePeriod } from "@hr-attendance-app/types";
import type { OverrideRepository } from "@hr-attendance-app/core";
import { KEYS } from "./keys.js";

export class DynamoOverrideRepository implements OverrideRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}

  async findByEmployee(employeeId: string, period: OverridePeriod, periodValue: string): Promise<Override | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: KEYS.EMP(employeeId), SK: KEYS.OVR(period, periodValue) },
    }));
    return (result.Item as Override) ?? null;
  }

  async save(override: Override): Promise<Override> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: KEYS.EMP(override.employeeId), SK: KEYS.OVR(override.period, override.yearMonth), ...override },
    }));
    return override;
  }
}
