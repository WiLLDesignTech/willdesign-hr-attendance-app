import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { AttendanceLock, AttendanceLockScope } from "@hr-attendance-app/types";
import { AttendanceLockScopes } from "@hr-attendance-app/types";
import type { AttendanceLockRepository } from "@hr-attendance-app/core";
import { createTenantKeys } from "./keys.js";

export class DynamoAttendanceLockRepository implements AttendanceLockRepository {
  private readonly keys;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    tenantId: string,
  ) {
    this.keys = createTenantKeys(tenantId);
  }

  async findByYearMonth(yearMonth: string, scope?: AttendanceLockScope): Promise<readonly AttendanceLock[]> {
    const expressionValues: Record<string, string> = { ":pk": this.keys.LOCK(yearMonth) };
    let keyCondition = "PK = :pk";

    if (scope) {
      keyCondition += " AND begins_with(SK, :skPrefix)";
      expressionValues[":skPrefix"] = this.buildSk(scope);
    }

    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionValues,
    }));

    return (result.Items as AttendanceLock[]) ?? [];
  }

  async save(lock: AttendanceLock): Promise<AttendanceLock> {
    const sk = this.buildSk(lock.scope, lock.groupId ?? lock.employeeId);
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: this.keys.LOCK(lock.yearMonth), SK: sk, ...lock },
      ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
    }));
    return lock;
  }

  async delete(yearMonth: string, scope: AttendanceLockScope, targetId?: string): Promise<void> {
    const sk = this.buildSk(scope, targetId);
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: this.keys.LOCK(yearMonth), SK: sk },
    }));
  }

  private buildSk(scope: AttendanceLockScope, targetId?: string): string {
    if (scope === AttendanceLockScopes.COMPANY) return this.keys.LOCK_SK_COMPANY;
    if (scope === AttendanceLockScopes.GROUP) return this.keys.LOCK_SK_GROUP(targetId!);
    return this.keys.LOCK_SK_EMP(targetId!);
  }
}
