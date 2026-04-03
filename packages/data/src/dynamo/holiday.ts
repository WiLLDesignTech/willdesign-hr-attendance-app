import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { Holiday, Region } from "@hr-attendance-app/types";
import type { HolidayRepository } from "@hr-attendance-app/core";
import { createTenantKeys } from "./keys.js";

export class DynamoHolidayRepository implements HolidayRepository {
  private readonly keys;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    tenantId: string,
  ) {
    this.keys = createTenantKeys(tenantId);
  }

  async findByRegionAndYear(region: Region, year: number): Promise<readonly Holiday[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": this.keys.REGION(region), ":prefix": `${this.keys.HOL_PREFIX}${year}` },
    }));
    return (result.Items as Holiday[]) ?? [];
  }

  async save(holiday: Holiday): Promise<Holiday> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: this.keys.REGION(holiday.region), SK: this.keys.HOL(holiday.date),
        GSI2PK: this.keys.GSI2.ORG_HOLIDAY, GSI2SK: `${holiday.year}#${holiday.region}`,
        ...holiday,
      },
    }));
    return holiday;
  }

  async delete(region: Region, date: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: this.keys.REGION(region), SK: this.keys.HOL(date) },
    }));
  }
}
