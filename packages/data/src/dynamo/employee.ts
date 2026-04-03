import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { Employee, EmployeeStatus } from "@hr-attendance-app/types";
import { nowIso, timestampId } from "@hr-attendance-app/types";
import type { EmployeeRepository, CreateEmployeeInput, UpdateEmployeeInput } from "@hr-attendance-app/core";
import { KEYS } from "./keys.js";

export class DynamoEmployeeRepository implements EmployeeRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async findById(id: string): Promise<Employee | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: KEYS.EMP(id), SK: KEYS.PROFILE },
    }));
    return (result.Item as Employee) ?? null;
  }

  async findBySlackId(slackId: string): Promise<Employee | null> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": KEYS.GSI1.SLACK(slackId) },
      Limit: 1,
    }));
    return (result.Items?.[0] as Employee) ?? null;
  }

  async findByManagerId(managerId: string): Promise<readonly Employee[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": KEYS.GSI1.MGR(managerId) },
    }));
    return (result.Items as Employee[]) ?? [];
  }

  async findAll(options?: { status?: EmployeeStatus }): Promise<readonly Employee[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      ExpressionAttributeValues: { ":pk": KEYS.GSI2.ORG_EMP },
    }));
    const items = (result.Items as Employee[]) ?? [];
    if (options?.status) {
      return items.filter((e) => e.status === options.status);
    }
    return items;
  }

  async create(input: CreateEmployeeInput): Promise<Employee> {
    const now = nowIso();
    const id = timestampId();
    const employee: Employee = {
      id,
      ...input,
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
    };

    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.EMP(id),
        SK: KEYS.PROFILE,
        GSI1PK: KEYS.GSI1.SLACK(input.slackId),
        GSI1SK: KEYS.EMP(id),
        GSI2PK: KEYS.GSI2.ORG_EMP,
        GSI2SK: KEYS.EMP(id),
        ...employee,
      },
    }));

    return employee;
  }

  async update(id: string, updates: UpdateEmployeeInput): Promise<Employee> {
    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const attrName = `#${key}`;
        const attrValue = `:${key}`;
        expressions.push(`${attrName} = ${attrValue}`);
        names[attrName] = key;
        values[attrValue] = value;
      }
    }

    expressions.push("#updatedAt = :updatedAt");
    names["#updatedAt"] = "updatedAt";
    values[":updatedAt"] = nowIso();

    const result = await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { PK: KEYS.EMP(id), SK: KEYS.PROFILE },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }));

    return result.Attributes as Employee;
  }
}
