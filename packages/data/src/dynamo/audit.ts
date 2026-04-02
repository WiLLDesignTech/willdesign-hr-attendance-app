import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { AuditEntry } from "@willdesign-hr/types";
import type { AuditRepository, AuditQueryOptions } from "@willdesign-hr/core";
import { KEYS } from "./keys.js";

export class DynamoAuditRepository implements AuditRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async append(entry: AuditEntry): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.AUDIT(entry.targetId),
        SK: `${entry.timestamp}#${entry.id}`,
        GSI1PK: KEYS.GSI1.AUDIT_ACTOR(entry.actorId),
        GSI1SK: entry.timestamp,
        ...entry,
      },
    }));
  }

  async findByTarget(targetId: string, options?: AuditQueryOptions): Promise<readonly AuditEntry[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: this.buildTargetKeyCondition(options),
      ExpressionAttributeValues: this.buildTargetValues(targetId, options),
      ScanIndexForward: false,
    }));
    return (result.Items as AuditEntry[]) ?? [];
  }

  async findByActor(actorId: string, options?: AuditQueryOptions): Promise<readonly AuditEntry[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: this.buildActorKeyCondition(options),
      ExpressionAttributeValues: this.buildActorValues(actorId, options),
      ScanIndexForward: false,
    }));
    return (result.Items as AuditEntry[]) ?? [];
  }

  private buildTargetKeyCondition(options?: AuditQueryOptions): string {
    let expr = "PK = :pk";
    if (options?.from && options?.to) {
      expr += " AND SK BETWEEN :from AND :to";
    } else if (options?.from) {
      expr += " AND SK >= :from";
    }
    return expr;
  }

  private buildTargetValues(targetId: string, options?: AuditQueryOptions): Record<string, unknown> {
    const values: Record<string, unknown> = { ":pk": KEYS.AUDIT(targetId) };
    if (options?.from) values[":from"] = options.from;
    if (options?.to) values[":to"] = options.to;
    return values;
  }

  private buildActorKeyCondition(options?: AuditQueryOptions): string {
    let expr = "GSI1PK = :pk";
    if (options?.from && options?.to) {
      expr += " AND GSI1SK BETWEEN :from AND :to";
    } else if (options?.from) {
      expr += " AND GSI1SK >= :from";
    }
    return expr;
  }

  private buildActorValues(actorId: string, options?: AuditQueryOptions): Record<string, unknown> {
    const values: Record<string, unknown> = { ":pk": KEYS.GSI1.AUDIT_ACTOR(actorId) };
    if (options?.from) values[":from"] = options.from;
    if (options?.to) values[":to"] = options.to;
    return values;
  }
}
