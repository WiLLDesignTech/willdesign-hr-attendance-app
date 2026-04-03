import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { Override, OverridePeriod } from "@hr-attendance-app/types";
import type { OverrideRepository } from "@hr-attendance-app/core";
import { createTenantKeys } from "./keys.js";

export class DynamoOverrideRepository implements OverrideRepository {
  private readonly keys;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    tenantId: string,
  ) {
    this.keys = createTenantKeys(tenantId);
  }

  async findByEmployee(employeeId: string, period: OverridePeriod, periodValue: string): Promise<Override | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: this.keys.EMP(employeeId), SK: this.keys.OVR(period, periodValue) },
    }));
    return (result.Item as Override) ?? null;
  }

  async save(override: Override): Promise<Override> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: this.keys.EMP(override.employeeId), SK: this.keys.OVR(override.period, override.yearMonth), ...override },
    }));
    return override;
  }
}
