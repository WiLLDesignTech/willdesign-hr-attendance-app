import { GetCommand, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { RoleDefinition } from "@hr-attendance-app/types";
import type { RoleRepository } from "@hr-attendance-app/core";
import { createTenantKeys } from "./keys.js";

export class DynamoRoleRepository implements RoleRepository {
  private readonly keys;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    tenantId: string,
  ) {
    this.keys = createTenantKeys(tenantId);
  }

  async findByName(name: string): Promise<RoleDefinition | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: this.keys.ROLE(name), SK: this.keys.DEFINITION },
    }));
    return (result.Item as RoleDefinition) ?? null;
  }

  async findAll(): Promise<readonly RoleDefinition[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName, IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      ExpressionAttributeValues: { ":pk": this.keys.GSI2.ORG_ROLE },
    }));
    return (result.Items as RoleDefinition[]) ?? [];
  }

  async save(role: RoleDefinition): Promise<RoleDefinition> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: this.keys.ROLE(role.name), SK: this.keys.DEFINITION,
        GSI2PK: this.keys.GSI2.ORG_ROLE, GSI2SK: role.name,
        ...role,
      },
    }));
    return role;
  }

  async delete(name: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: this.keys.ROLE(name), SK: this.keys.DEFINITION },
    }));
  }
}
