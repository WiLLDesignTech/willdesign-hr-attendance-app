/**
 * Seeds local DynamoDB with test data for development.
 * Run: npx tsx scripts/seed-data.ts
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { createTenantKeys } from "@hr-attendance-app/data";
import {
  orgPolicy,
  jpFulltimePolicy, jpContractPolicy, jpOutsourcedPolicy,
  jpParttimePolicy, jpSalesPolicy, jpInternPolicy,
  npFulltimePolicy, npPaidInternPolicy, npUnpaidInternPolicy,
} from "@hr-attendance-app/core";

const ENDPOINT = process.env["DYNAMODB_ENDPOINT"] ?? "http://localhost:8000";
const TABLE_NAME = process.env["DYNAMODB_TABLE_NAME"] ?? "hr-attendance-app-dev-table";
const REGION = process.env["AWS_REGION"] ?? "ap-northeast-1";
const TENANT_ID = "default";

const rawClient = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});
const client = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

const keys = createTenantKeys(TENANT_ID);

const put = async (item: Record<string, unknown>): Promise<void> => {
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
};

const NOW = new Date().toISOString();

const seedEmployees = async (): Promise<void> => {
  const employees = [
    {
      PK: keys.EMP("ADMIN001"),
      SK: keys.PROFILE,
      GSI1PK: keys.GSI1.SLACK("U_ADMIN"),
      GSI1SK: keys.EMP("ADMIN001"),
      GSI2PK: keys.GSI2.ORG_EMP,
      GSI2SK: "ACTIVE#ADMIN001",
      id: "ADMIN001",
      name: "Tanaka Admin",
      email: "admin@example.com",
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
      PK: keys.EMP("MGR001"),
      SK: keys.PROFILE,
      GSI1PK: keys.GSI1.SLACK("U_MGR"),
      GSI1SK: keys.EMP("MGR001"),
      GSI2PK: keys.GSI2.ORG_EMP,
      GSI2SK: "ACTIVE#MGR001",
      id: "MGR001",
      name: "Suzuki Manager",
      email: "manager@example.com",
      slackId: "U_MGR",
      employmentType: "JP_FULL_TIME",
      region: "JP",
      timezone: "Asia/Tokyo",
      languagePreference: "ja",
      managerId: "ADMIN001",
      joinDate: "2024-04-01",
      probationEndDate: null,
      status: "ACTIVE",
      role: "MANAGER",
      terminationDate: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      PK: keys.EMP("JP001"),
      SK: keys.PROFILE,
      GSI1PK: keys.GSI1.SLACK("U_JP001"),
      GSI1SK: keys.EMP("JP001"),
      GSI2PK: keys.GSI2.ORG_EMP,
      GSI2SK: "ACTIVE#JP001",
      id: "JP001",
      name: "Yamada Taro",
      email: "taro@example.com",
      slackId: "U_JP001",
      employmentType: "JP_FULL_TIME",
      region: "JP",
      timezone: "Asia/Tokyo",
      languagePreference: "ja",
      managerId: "MGR001",
      joinDate: "2025-01-01",
      probationEndDate: "2025-04-01",
      status: "ACTIVE",
      role: "EMPLOYEE",
      terminationDate: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      PK: keys.EMP("NP001"),
      SK: keys.PROFILE,
      GSI1PK: keys.GSI1.SLACK("U_NP001"),
      GSI1SK: keys.EMP("NP001"),
      GSI2PK: keys.GSI2.ORG_EMP,
      GSI2SK: "ACTIVE#NP001",
      id: "NP001",
      name: "Ram Sharma",
      email: "ram@example.com",
      slackId: "U_NP001",
      employmentType: "NP_FULL_TIME",
      region: "NP",
      timezone: "Asia/Kathmandu",
      languagePreference: "en",
      managerId: "MGR001",
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
    if (emp.managerId) {
      await put({
        ...emp,
        GSI1PK: keys.GSI1.MGR(emp.managerId),
        GSI1SK: keys.EMP(emp.id),
      });
    }
  }
  console.log(`Seeded ${employees.length} employees.`);
};

const seedAttendanceStates = async (): Promise<void> => {
  const ids = ["ADMIN001", "MGR001", "JP001", "NP001"];
  for (const id of ids) {
    await put({
      PK: keys.EMP(id),
      SK: keys.ATT_STATE,
      employeeId: id,
      state: "IDLE",
      lastEventTimestamp: "",
    });
  }
  console.log(`Seeded ${ids.length} attendance states.`);
};

const seedSalaries = async (): Promise<void> => {
  const salaries = [
    { id: "ADMIN001", amount: 500000, currency: "JPY", effectiveFrom: "2024-01-01", changeType: "INITIAL" },
    { id: "ADMIN001", amount: 550000, currency: "JPY", effectiveFrom: "2025-04-01", changeType: "REVIEW" },
    { id: "MGR001", amount: 400000, currency: "JPY", effectiveFrom: "2024-04-01", changeType: "INITIAL" },
    { id: "MGR001", amount: 430000, currency: "JPY", effectiveFrom: "2025-10-01", changeType: "PROMOTION" },
    { id: "JP001", amount: 300000, currency: "JPY", effectiveFrom: "2025-01-01", changeType: "INITIAL" },
    { id: "JP001", amount: 320000, currency: "JPY", effectiveFrom: "2026-01-01", changeType: "PROBATION_END" },
    { id: "NP001", amount: 80000, currency: "NPR", effectiveFrom: "2025-06-01", changeType: "INITIAL" },
  ];

  for (const s of salaries) {
    await put({
      PK: keys.EMP(s.id),
      SK: keys.SALARY(s.effectiveFrom),
      id: `SAL#${s.id}#${s.effectiveFrom}`,
      employeeId: s.id,
      amount: s.amount,
      currency: s.currency,
      salaryType: "MONTHLY",
      changeType: s.changeType,
      effectiveFrom: s.effectiveFrom,
      createdAt: NOW,
    });
  }
  console.log(`Seeded ${salaries.length} salary records.`);
};

const seedLeaveBalances = async (): Promise<void> => {
  const balances = [
    { id: "JP001", total: 10, used: 2, remaining: 8, carryOver: 0, lastAccrual: "2025-07-01" },
    { id: "NP001", total: 3, used: 0, remaining: 3, carryOver: 0, lastAccrual: "2025-12-01" },
    { id: "MGR001", total: 15, used: 3, remaining: 12, carryOver: 5, lastAccrual: "2026-01-01" },
  ];

  for (const b of balances) {
    await put({
      PK: keys.EMP(b.id),
      SK: "LEAVE_BALANCE",
      employeeId: b.id,
      paidLeaveTotal: b.total,
      paidLeaveUsed: b.used,
      paidLeaveRemaining: b.remaining,
      carryOver: b.carryOver,
      carryOverExpiry: b.carryOver > 0 ? "2027-01-01" : null,
      lastAccrualDate: b.lastAccrual,
    });
  }
  console.log(`Seeded ${balances.length} leave balances.`);
};

const seedRoles = async (): Promise<void> => {
  const roles = [
    { name: "SUPER_ADMIN", description: "Full system access", permissions: ["ONBOARD", "OFFBOARD", "AUDIT_VIEW", "POLICY_UPDATE", "ATTENDANCE_LOCK", "LEAVE_APPROVE", "FLAG_RESOLVE", "BANK_APPROVE", "EMPLOYEE_LIST_ALL", "EMPLOYEE_UPDATE", "HOLIDAY_MANAGE"] },
    { name: "MANAGER", description: "Team management", permissions: ["EMPLOYEE_LIST_ALL", "LEAVE_APPROVE", "FLAG_RESOLVE", "BANK_APPROVE"] },
    { name: "EMPLOYEE", description: "Basic access", permissions: [] },
  ];

  for (const r of roles) {
    await put({
      PK: keys.ROLE(r.name),
      SK: keys.DEFINITION,
      GSI2PK: keys.GSI2.ORG_ROLE,
      GSI2SK: r.name,
      name: r.name,
      description: r.description,
      permissions: r.permissions,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  console.log(`Seeded ${roles.length} roles.`);
};

const GROUP_POLICIES: Record<string, Record<string, unknown>> = {
  "jp-fulltime": jpFulltimePolicy,
  "jp-contract": jpContractPolicy,
  "jp-gyoumu-itaku": jpOutsourcedPolicy,
  "jp-parttime": jpParttimePolicy,
  "jp-sales": jpSalesPolicy,
  "jp-intern": jpInternPolicy,
  "np-fulltime": npFulltimePolicy,
  "np-paid-intern": npPaidInternPolicy,
  "np-unpaid-intern": npUnpaidInternPolicy,
};

const seedPolicies = async (): Promise<void> => {
  await put({ PK: keys.POLICY, SK: keys.POLICY_COMPANY, ...orgPolicy });
  for (const [groupName, policy] of Object.entries(GROUP_POLICIES)) {
    await put({ PK: keys.POLICY, SK: keys.POLICY_GROUP(groupName), ...policy });
  }
  console.log(`Seeded ${Object.keys(GROUP_POLICIES).length + 1} policy records.`);
};

const seedAll = async (): Promise<void> => {
  console.log("Seeding local DynamoDB...");
  await Promise.all([
    seedEmployees(),
    seedAttendanceStates(),
    seedSalaries(),
    seedLeaveBalances(),
    seedRoles(),
    seedPolicies(),
  ]);
  console.log("Seed complete.");
};

seedAll().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
