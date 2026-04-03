import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { LeaveRequest } from "@hr-attendance-app/types";
import type { LeaveRepository, LeaveQueryOptions } from "@hr-attendance-app/core";
import { KEYS } from "./keys.js";

export class DynamoLeaveRepository implements LeaveRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}

  async create(request: LeaveRequest): Promise<LeaveRequest> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.EMP(request.employeeId), SK: KEYS.LEAVE(request.id),
        GSI1PK: KEYS.GSI1.LEAVE_STATUS(request.status), GSI1SK: `${request.startDate}#${request.id}`,
        GSI2PK: KEYS.GSI2.ORG_LEAVE, GSI2SK: `DATE#${request.startDate}#${request.id}`,
        ...request,
      },
    }));
    return request;
  }

  async findById(id: string): Promise<LeaveRequest | null> {
    // ID contains employeeId — extract or scan GSI
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName, IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      FilterExpression: "id = :id",
      ExpressionAttributeValues: { ":pk": KEYS.GSI2.ORG_LEAVE, ":id": id },
      Limit: 1,
    }));
    return (result.Items?.[0] as LeaveRequest) ?? null;
  }

  async findByEmployee(employeeId: string, _options?: LeaveQueryOptions): Promise<readonly LeaveRequest[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": KEYS.EMP(employeeId), ":prefix": KEYS.LEAVE_PREFIX },
    }));
    return (result.Items as LeaveRequest[]) ?? [];
  }

  async findPending(): Promise<readonly LeaveRequest[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName, IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": KEYS.GSI1.LEAVE_STATUS("PENDING") },
    }));
    return (result.Items as LeaveRequest[]) ?? [];
  }

  async update(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> {
    // Find the item first to get the PK
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Leave request ${id} not found`);

    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        expressions.push(`#${key} = :${key}`);
        names[`#${key}`] = key;
        values[`:${key}`] = value;
      }
    }

    const result = await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { PK: KEYS.EMP(existing.employeeId), SK: KEYS.LEAVE(id) },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }));
    return result.Attributes as LeaveRequest;
  }
}
