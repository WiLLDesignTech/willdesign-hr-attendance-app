import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { AttendanceEvent, AttendanceStateRecord } from "@hr-attendance-app/types";
import { AttendanceStates, isoToDateStr } from "@hr-attendance-app/types";
import type { AttendanceRepository } from "@hr-attendance-app/core";
import { createTenantKeys } from "./keys.js";

export class DynamoAttendanceRepository implements AttendanceRepository {
  private readonly keys;

  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    tenantId: string,
  ) {
    this.keys = createTenantKeys(tenantId);
  }

  async getState(employeeId: string): Promise<AttendanceStateRecord> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: this.keys.EMP(employeeId), SK: this.keys.ATT_STATE },
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
        PK: this.keys.EMP(employeeId),
        SK: this.keys.ATT_STATE,
        ...state,
      },
    }));
  }

  async saveEvent(event: AttendanceEvent): Promise<void> {
    const date = isoToDateStr(event.timestamp);
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: this.keys.EMP(event.employeeId),
        SK: this.keys.ATT(date, event.timestamp),
        GSI2PK: this.keys.GSI2.ORG_ATT(date),
        GSI2SK: `${this.keys.EMP(event.employeeId)}#${event.timestamp}`,
        ...event,
      },
    }));
  }

  async getEventsForDate(employeeId: string, date: string): Promise<readonly AttendanceEvent[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": this.keys.EMP(employeeId),
        ":prefix": this.keys.ATT_PREFIX(date),
      },
    }));
    return (result.Items as AttendanceEvent[]) ?? [];
  }

  async getEventsForMonth(employeeId: string, yearMonth: string): Promise<readonly AttendanceEvent[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": this.keys.EMP(employeeId),
        ":prefix": this.keys.ATT_PREFIX(yearMonth),
      },
    }));
    return (result.Items as AttendanceEvent[]) ?? [];
  }

  async getUnclosedSessions(date: string): Promise<readonly AttendanceStateRecord[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      ExpressionAttributeValues: { ":pk": this.keys.GSI2.ORG_ATT(date) },
    }));
    return ((result.Items as AttendanceStateRecord[]) ?? []).filter(
      (s) => s.state !== AttendanceStates.IDLE,
    );
  }
}
