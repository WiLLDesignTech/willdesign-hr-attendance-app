import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { Flag } from "@willdesign-hr/types";
import type { FlagRepository, FlagQueryOptions } from "@willdesign-hr/core";
import { KEYS } from "./keys.js";

export class DynamoFlagRepository implements FlagRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}

  async save(flag: Flag): Promise<Flag> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.EMP(flag.employeeId), SK: KEYS.FLAG(flag.level, flag.period),
        GSI1PK: KEYS.GSI1.FLAG_STATUS(flag.status), GSI1SK: `${flag.period}#${KEYS.EMP(flag.employeeId)}`,
        ...flag,
      },
    }));
    return flag;
  }

  async findByEmployee(employeeId: string, _options?: FlagQueryOptions): Promise<readonly Flag[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": KEYS.EMP(employeeId), ":prefix": KEYS.FLAG_PREFIX },
    }));
    return (result.Items as Flag[]) ?? [];
  }

  async findPending(): Promise<readonly Flag[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName, IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": KEYS.GSI1.FLAG_STATUS("PENDING") },
    }));
    return (result.Items as Flag[]) ?? [];
  }

  async update(id: string, updates: Partial<Flag>): Promise<Flag> {
    // Flags are keyed by employee+level+period, not by id — would need lookup
    // For now, this is a simplified implementation
    void id; void updates;
    throw new Error("Flag update requires employee context — use save() with full flag object");
  }
}
