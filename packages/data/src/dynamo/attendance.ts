import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { AttendanceEvent, AttendanceStateRecord } from "@willdesign-hr/types";
import { AttendanceStates } from "@willdesign-hr/types";
import type { AttendanceRepository } from "@willdesign-hr/core";
import { KEYS } from "./keys.js";

export class DynamoAttendanceRepository implements AttendanceRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async getState(employeeId: string): Promise<AttendanceStateRecord> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: KEYS.EMP(employeeId), SK: KEYS.ATT_STATE },
    }));
    return (result.Item as AttendanceStateRecord) ?? {
      employeeId,
      state: AttendanceStates.IDLE,
      lastEventId: null,
      lastEventTimestamp: null,
    };
  }

  async saveState(employeeId: string, state: AttendanceStateRecord): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.EMP(employeeId),
        SK: KEYS.ATT_STATE,
        ...state,
      },
    }));
  }

  async saveEvent(event: AttendanceEvent): Promise<void> {
    const date = event.timestamp.split("T")[0]!;
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: KEYS.EMP(event.employeeId),
        SK: KEYS.ATT(date, event.timestamp),
        GSI2PK: KEYS.GSI2.ORG_ATT(date),
        GSI2SK: `${KEYS.EMP(event.employeeId)}#${event.timestamp}`,
        ...event,
      },
    }));
  }

  async getEventsForDate(employeeId: string, date: string): Promise<readonly AttendanceEvent[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": KEYS.EMP(employeeId),
        ":prefix": KEYS.ATT_PREFIX(date),
      },
    }));
    return (result.Items as AttendanceEvent[]) ?? [];
  }

  async getEventsForMonth(employeeId: string, yearMonth: string): Promise<readonly AttendanceEvent[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": KEYS.EMP(employeeId),
        ":prefix": `ATT#${yearMonth}`,
      },
    }));
    return (result.Items as AttendanceEvent[]) ?? [];
  }

  async getUnclosedSessions(date: string): Promise<readonly AttendanceStateRecord[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      ExpressionAttributeValues: { ":pk": KEYS.GSI2.ORG_ATT(date) },
    }));
    return ((result.Items as AttendanceStateRecord[]) ?? []).filter(
      (s) => s.state !== AttendanceStates.IDLE,
    );
  }
}
