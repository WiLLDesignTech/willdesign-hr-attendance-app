import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { Holiday, Region } from "@hr-attendance-app/types";
import type { HolidayRepository } from "@hr-attendance-app/core";
import { KEYS } from "./keys.js";

export class DynamoHolidayRepository implements HolidayRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}

  async findByRegionAndYear(region: Region, year: number): Promise<readonly Holiday[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": KEYS.REGION(region), ":prefix": `HOL#${year}` },
    }));
    return (result.Items as Holiday[]) ?? [];
  }

  async save(holiday: Holiday): Promise<Holiday> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.REGION(holiday.region), SK: KEYS.HOL(holiday.date),
        GSI2PK: KEYS.GSI2.ORG_HOLIDAY, GSI2SK: `${holiday.year}#${holiday.region}`,
        ...holiday,
      },
    }));
    return holiday;
  }

  async delete(region: Region, date: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: KEYS.REGION(region), SK: KEYS.HOL(date) },
    }));
  }
}
