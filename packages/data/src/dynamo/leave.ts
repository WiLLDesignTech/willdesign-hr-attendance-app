import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { LeaveRequest } from "@hr-attendance-app/types";
import type { LeaveRepository, LeaveQueryOptions } from "@hr-attendance-app/core";
import { createTenantKeys } from "./keys.js";

export class DynamoLeaveRepository implements LeaveRepository {
  private readonly keys;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    tenantId: string,
  ) {
    this.keys = createTenantKeys(tenantId);
  }

  async create(request: LeaveRequest): Promise<LeaveRequest> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: this.keys.EMP(request.employeeId), SK: this.keys.LEAVE(request.id),
        GSI1PK: this.keys.GSI1.LEAVE_STATUS(request.status), GSI1SK: `${request.startDate}#${request.id}`,
        GSI2PK: this.keys.GSI2.ORG_LEAVE, GSI2SK: `DATE#${request.startDate}#${request.id}`,
        ...request,
      },
    }));
    return request;
  }

  async findById(id: string): Promise<LeaveRequest | null> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName, IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      FilterExpression: "id = :id",
      ExpressionAttributeValues: { ":pk": this.keys.GSI2.ORG_LEAVE, ":id": id },
      Limit: 1,
    }));
    return (result.Items?.[0] as LeaveRequest) ?? null;
  }

  async findByEmployee(employeeId: string, _options?: LeaveQueryOptions): Promise<readonly LeaveRequest[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": this.keys.EMP(employeeId), ":prefix": this.keys.LEAVE_PREFIX },
    }));
    return (result.Items as LeaveRequest[]) ?? [];
  }

  async findPending(): Promise<readonly LeaveRequest[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName, IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": this.keys.GSI1.LEAVE_STATUS("PENDING") },
    }));
    return (result.Items as LeaveRequest[]) ?? [];
  }

  async update(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> {
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
      Key: { PK: this.keys.EMP(existing.employeeId), SK: this.keys.LEAVE(id) },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }));
    return result.Attributes as LeaveRequest;
  }
}
