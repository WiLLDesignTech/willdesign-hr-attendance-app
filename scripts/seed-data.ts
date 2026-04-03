/**
 * Seeds local DynamoDB with test data for development.
 * Run: npx tsx scripts/seed-data.ts
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ENDPOINT = process.env["DYNAMODB_ENDPOINT"] ?? "http://localhost:8000";
const TABLE_NAME = process.env["DYNAMODB_TABLE_NAME"] ?? "willdesign-hr-dev-table";
const REGION = process.env["AWS_REGION"] ?? "ap-northeast-1";

const rawClient = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});
const client = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

async function put(item: Record<string, unknown>): Promise<void> {
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
}

const NOW = new Date().toISOString();

async function seedEmployees(): Promise<void> {
  const employees = [
    {
      PK: "EMP#ADMIN001",
      SK: "PROFILE",
      GSI1PK: "SLACK#U_ADMIN",
      GSI1SK: "EMP#ADMIN001",
      GSI2PK: "ORG#EMP",
      GSI2SK: "ACTIVE#ADMIN001",
      id: "EMP#ADMIN001",
      name: "Tanaka Admin",
      email: "admin@willdesign.com",
      slackId: "U_ADMIN",
      employmentType: "JP_FULL_TIME",
      region: "JP",
      timezone: "Asia/Tokyo",
      languagePreference: "ja",
      managerId: null,
      joinDate: "2024-01-01",
      probationEndDate: null,
      status: "ACTIVE",
      role: "SUPER_ADMIN",
      terminationDate: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      PK: "EMP#MGR001",
      SK: "PROFILE",
      GSI1PK: "SLACK#U_MGR",
      GSI1SK: "EMP#MGR001",
      GSI2PK: "ORG#EMP",
      GSI2SK: "ACTIVE#MGR001",
      id: "EMP#MGR001",
      name: "Suzuki Manager",
      email: "manager@willdesign.com",
      slackId: "U_MGR",
      employmentType: "JP_FULL_TIME",
      region: "JP",
      timezone: "Asia/Tokyo",
      languagePreference: "ja",
      managerId: "EMP#ADMIN001",
      joinDate: "2024-04-01",
      probationEndDate: null,
      status: "ACTIVE",
      role: "MANAGER",
      terminationDate: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      PK: "EMP#JP001",
      SK: "PROFILE",
      GSI1PK: "SLACK#U_JP001",
      GSI1SK: "EMP#JP001",
      GSI2PK: "ORG#EMP",
      GSI2SK: "ACTIVE#JP001",
      id: "EMP#JP001",
      name: "Yamada Taro",
      email: "taro@willdesign.com",
      slackId: "U_JP001",
      employmentType: "JP_FULL_TIME",
      region: "JP",
      timezone: "Asia/Tokyo",
      languagePreference: "ja",
      managerId: "EMP#MGR001",
      joinDate: "2025-01-01",
      probationEndDate: "2025-04-01",
      status: "ACTIVE",
      role: "EMPLOYEE",
      terminationDate: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      PK: "EMP#NP001",
      SK: "PROFILE",
      GSI1PK: "SLACK#U_NP001",
      GSI1SK: "EMP#NP001",
      GSI2PK: "ORG#EMP",
      GSI2SK: "ACTIVE#NP001",
      id: "EMP#NP001",
      name: "Ram Sharma",
      email: "ram@willdesign.com",
      slackId: "U_NP001",
      employmentType: "NP_FULL_TIME",
      region: "NP",
      timezone: "Asia/Kathmandu",
      languagePreference: "en",
      managerId: "EMP#MGR001",
      joinDate: "2025-06-01",
      probationEndDate: "2025-09-01",
      status: "ACTIVE",
      role: "EMPLOYEE",
      terminationDate: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  for (const emp of employees) {
    await put(emp);
    // Also index by manager
    if (emp.managerId) {
      await put({
        ...emp,
        GSI1PK: `MGR#${emp.managerId}`,
        GSI1SK: emp.id,
      });
    }
  }
  console.log(`Seeded ${employees.length} employees.`);
}

async function seedAttendanceStates(): Promise<void> {
  const states = [
    { PK: "EMP#ADMIN001", SK: "ATT_STATE", employeeId: "EMP#ADMIN001", state: "IDLE", lastEventTimestamp: "" },
    { PK: "EMP#MGR001", SK: "ATT_STATE", employeeId: "EMP#MGR001", state: "IDLE", lastEventTimestamp: "" },
    { PK: "EMP#JP001", SK: "ATT_STATE", employeeId: "EMP#JP001", state: "IDLE", lastEventTimestamp: "" },
    { PK: "EMP#NP001", SK: "ATT_STATE", employeeId: "EMP#NP001", state: "IDLE", lastEventTimestamp: "" },
  ];

  for (const s of states) {
    await put(s);
  }
  console.log(`Seeded ${states.length} attendance states.`);
}

async function seedSalaries(): Promise<void> {
  const salaries = [
    {
      PK: "EMP#ADMIN001", SK: "SALARY#2024-01-01",
      id: "SAL#ADMIN001#1", employeeId: "EMP#ADMIN001",
      amount: 500000, currency: "JPY", salaryType: "MONTHLY",
      changeType: "INITIAL", effectiveFrom: "2024-01-01", createdAt: NOW,
    },
    {
      PK: "EMP#MGR001", SK: "SALARY#2024-04-01",
      id: "SAL#MGR001#1", employeeId: "EMP#MGR001",
      amount: 400000, currency: "JPY", salaryType: "MONTHLY",
      changeType: "INITIAL", effectiveFrom: "2024-04-01", createdAt: NOW,
    },
    {
      PK: "EMP#JP001", SK: "SALARY#2025-01-01",
      id: "SAL#JP001#1", employeeId: "EMP#JP001",
      amount: 300000, currency: "JPY", salaryType: "MONTHLY",
      changeType: "INITIAL", effectiveFrom: "2025-01-01", createdAt: NOW,
    },
    {
      PK: "EMP#NP001", SK: "SALARY#2025-06-01",
      id: "SAL#NP001#1", employeeId: "EMP#NP001",
      amount: 80000, currency: "NPR", salaryType: "MONTHLY",
      changeType: "INITIAL", effectiveFrom: "2025-06-01", createdAt: NOW,
    },
  ];

  for (const s of salaries) {
    await put(s);
  }
  console.log(`Seeded ${salaries.length} salary records.`);
}

async function seedLeaveBalances(): Promise<void> {
  const balances = [
    {
      PK: "EMP#JP001", SK: "LEAVE_BALANCE",
      employeeId: "EMP#JP001", paidLeaveTotal: 10, paidLeaveUsed: 2,
      paidLeaveRemaining: 8, carryOver: 0, carryOverExpiry: null, lastAccrualDate: "2025-07-01",
    },
    {
      PK: "EMP#NP001", SK: "LEAVE_BALANCE",
      employeeId: "EMP#NP001", paidLeaveTotal: 3, paidLeaveUsed: 0,
      paidLeaveRemaining: 3, carryOver: 0, carryOverExpiry: null, lastAccrualDate: "2025-12-01",
    },
    {
      PK: "EMP#MGR001", SK: "LEAVE_BALANCE",
      employeeId: "EMP#MGR001", paidLeaveTotal: 15, paidLeaveUsed: 3,
      paidLeaveRemaining: 12, carryOver: 5, carryOverExpiry: "2027-01-01", lastAccrualDate: "2026-01-01",
    },
  ];

  for (const b of balances) {
    await put(b);
  }
  console.log(`Seeded ${balances.length} leave balances.`);
}

async function seedAll(): Promise<void> {
  console.log("Seeding local DynamoDB...");
  await Promise.all([
    seedEmployees(),
    seedAttendanceStates(),
    seedSalaries(),
    seedLeaveBalances(),
  ]);
  console.log("Seed complete.");
}

seedAll().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
