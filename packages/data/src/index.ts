// @hr-attendance-app/data — AWS adapter implementations (DynamoDB, S3, SES, Cognito)
// Shared by both API and Slack packages

export { getDocClient, resetClient } from "./dynamo/client.js";
export { createTenantKeys } from "./dynamo/keys.js";
export type { TenantKeys } from "./dynamo/keys.js";

export { DynamoEmployeeRepository } from "./dynamo/employee.js";
export { DynamoAttendanceRepository } from "./dynamo/attendance.js";
export { DynamoAuditRepository } from "./dynamo/audit.js";
export { DynamoLeaveRepository } from "./dynamo/leave.js";
export { DynamoSalaryRepository } from "./dynamo/salary.js";
export { DynamoFlagRepository } from "./dynamo/flag.js";
export { DynamoBankRepository } from "./dynamo/bank.js";
export { DynamoReportRepository } from "./dynamo/report.js";
export { DynamoHolidayRepository } from "./dynamo/holiday.js";
export { DynamoAttendanceLockRepository } from "./dynamo/attendance-lock.js";
export { DynamoOverrideRepository } from "./dynamo/override.js";
export { DynamoRoleRepository } from "./dynamo/role.js";
export { DynamoMonthlySummaryRepository } from "./dynamo/monthly-summary.js";

export { S3PolicyRepository } from "./s3/policy-repository.js";
export { S3DocumentRepository } from "./s3/document-repository.js";
export { SESEmailAdapter } from "./ses/email-adapter.js";
export { renderSalaryStatementHtml } from "./ses/salary-template.js";
export { CognitoAuthAdapter } from "./cognito/auth-provider-adapter.js";
