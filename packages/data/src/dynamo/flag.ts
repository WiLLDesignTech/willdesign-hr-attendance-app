import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { Flag } from "@hr-attendance-app/types";
import type { FlagRepository, FlagQueryOptions } from "@hr-attendance-app/core";
import { createTenantKeys } from "./keys.js";

export class DynamoFlagRepository implements FlagRepository {
  private readonly keys;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    tenantId: string,
  ) {
    this.keys = createTenantKeys(tenantId);
  }

  async save(flag: Flag): Promise<Flag> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: this.keys.EMP(flag.employeeId), SK: this.keys.FLAG(flag.level, flag.period),
        GSI1PK: this.keys.GSI1.FLAG_STATUS(flag.status), GSI1SK: `${flag.period}#${this.keys.EMP(flag.employeeId)}`,
        ...flag,
      },
    }));
    return flag;
  }

  async findByEmployee(employeeId: string, _options?: FlagQueryOptions): Promise<readonly Flag[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": this.keys.EMP(employeeId), ":prefix": this.keys.FLAG_PREFIX },
    }));
    return (result.Items as Flag[]) ?? [];
  }

  async findPending(): Promise<readonly Flag[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName, IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": this.keys.GSI1.FLAG_STATUS("PENDING") },
    }));
    return (result.Items as Flag[]) ?? [];
  }

  async update(id: string, updates: Partial<Flag>): Promise<Flag> {
    void id; void updates;
    throw new Error("Flag update requires employee context — use save() with full flag object");
  }
}
