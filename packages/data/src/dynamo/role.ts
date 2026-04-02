import { GetCommand, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { RoleDefinition } from "@willdesign-hr/types";
import type { RoleRepository } from "@willdesign-hr/core";
import { KEYS } from "./keys.js";

export class DynamoRoleRepository implements RoleRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}

  async findByName(name: string): Promise<RoleDefinition | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: KEYS.ROLE(name), SK: KEYS.DEFINITION },
    }));
    return (result.Item as RoleDefinition) ?? null;
  }

  async findAll(): Promise<readonly RoleDefinition[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName, IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      ExpressionAttributeValues: { ":pk": KEYS.GSI2.ORG_ROLE },
    }));
    return (result.Items as RoleDefinition[]) ?? [];
  }

  async save(role: RoleDefinition): Promise<RoleDefinition> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.ROLE(role.name), SK: KEYS.DEFINITION,
        GSI2PK: KEYS.GSI2.ORG_ROLE, GSI2SK: role.name,
        ...role,
      },
    }));
    return role;
  }

  async delete(name: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: KEYS.ROLE(name), SK: KEYS.DEFINITION },
    }));
  }
}
