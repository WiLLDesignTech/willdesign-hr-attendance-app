import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { execSync } from "node:child_process";
import path from "node:path";

const ENDPOINT = "http://localhost:8000";
const TABLE_NAME = "hr-attendance-app-dev-table";
const REGION = "ap-northeast-1";
const TENANT_ID = "default";

const rawClient = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

const client = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

const T = `T#${TENANT_ID}`;

// ─── Key Helpers ───

const empPK = (id: string) => `${T}#EMP#${id}`;
const regionPK = (region: string) => `${T}#REGION#${region}`;
const rolePK = (name: string) => `${T}#ROLE#${name}`;
const lockPK = (yearMonth: string) => `${T}#LOCK#${yearMonth}`;

// ─── Get Helpers ───

const getItem = async (pk: string, sk: string) => {
  const result = await client.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk, SK: sk } }),
  );
  return result.Item ?? null;
};

const queryItems = async (pk: string, skPrefix: string) => {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": pk, ":sk": skPrefix },
    }),
  );
  return result.Items ?? [];
};

const queryGSI2 = async (gsi2pk: string) => {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      ExpressionAttributeValues: { ":pk": gsi2pk },
    }),
  );
  return result.Items ?? [];
};

// ─── Public API ───

export const getEmployee = async (id: string) => {
  return getItem(empPK(id), "PROFILE");
};

export const getAttendanceState = async (id: string) => {
  return getItem(empPK(id), "ATT_STATE");
};

export const getAttendanceEvents = async (id: string, date: string) => {
  return queryItems(empPK(id), `ATT#${date}`);
};

export const getLeaveRequests = async (id: string) => {
  return queryItems(empPK(id), "LEAVE#");
};

export const getLeaveBalance = async (id: string) => {
  return getItem(empPK(id), "LEAVE_BALANCE");
};

export const getFlags = async (id: string) => {
  return queryItems(empPK(id), "FLAG#");
};

export const getBankEntries = async (id: string) => {
  return queryItems(empPK(id), "BANK#");
};

export const getReports = async (id: string, date: string) => {
  return queryItems(empPK(id), `REPORT#${date}`);
};

export const getSalary = async (id: string) => {
  return queryItems(empPK(id), "SALARY#");
};

export const getHolidays = async (region: string) => {
  return queryItems(regionPK(region), "HOL#");
};

export const getRoleDefinition = async (name: string) => {
  return getItem(rolePK(name), "DEFINITION");
};

export const getAttendanceLocks = async (yearMonth: string) => {
  const pk = lockPK(yearMonth);
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": pk },
    }),
  );
  return result.Items ?? [];
};

export const countEmployees = async () => {
  const items = await queryGSI2(`${T}#ORG#EMP`);
  return items.length;
};

export const resetSeedData = () => {
  const projectRoot = path.resolve(import.meta.dirname, "../../../../");
  execSync("npx tsx scripts/seed-data.ts", {
    cwd: projectRoot,
    stdio: "pipe",
    timeout: 30_000,
  });
};
