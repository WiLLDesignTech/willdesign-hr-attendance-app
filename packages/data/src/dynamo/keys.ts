/**
 * DynamoDB single-table key patterns.
 * All entity key prefixes centralized here.
 *
 * Every PK and GSI PK is prefixed with T#{tenantId}# for multi-tenant isolation.
 * Single-tenant mode uses tenantId="default".
 */
export type TenantKeys = ReturnType<typeof createTenantKeys>;

/**
 * Create a tenant-scoped KEYS object.
 * PKs and GSI PKs are prefixed with T#{tenantId}#.
 * SKs remain unchanged (they are scoped within a PK partition).
 */
export function createTenantKeys(tenantId: string) {
  const T = `T#${tenantId}`;

  return {
    // Employee
    EMP: (id: string) => `${T}#EMP#${id}`,
    PROFILE: "PROFILE",

    // Attendance
    ATT: (date: string, ts: string) => `ATT#${date}#${ts}`,
    ATT_STATE: "ATT_STATE",
    ATT_PREFIX: (date: string) => `ATT#${date}`,

    // Leave
    LEAVE: (id: string) => `LEAVE#${id}`,
    LEAVE_PREFIX: "LEAVE#",

    // Salary
    SALARY: (effectiveDate: string) => `SALARY#${effectiveDate}`,
    SALARY_PREFIX: "SALARY#",

    // Report
    REPORT: (date: string, version: number) => `REPORT#${date}#v${version}`,
    REPORT_PREFIX: (date: string) => `REPORT#${date}`,

    // Flag
    FLAG: (type: string, period: string) => `FLAG#${type}#${period}`,
    FLAG_PREFIX: "FLAG#",

    // Bank
    BANK: (period: string) => `BANK#${period}`,
    BANK_PREFIX: "BANK#",

    // Holiday
    REGION: (region: string) => `${T}#REGION#${region}`,
    HOL: (date: string) => `HOL#${date}`,
    HOL_PREFIX: "HOL#",

    // Audit
    AUDIT: (targetId: string) => `${T}#AUDIT#${targetId}`,
    AUDIT_ACTOR: (actorId: string) => `AUDIT_ACTOR#${actorId}`,

    // Override
    OVR: (type: string, value: string) => `OVR#${type}#${value}`,

    // Role
    ROLE: (name: string) => `${T}#ROLE#${name}`,
    DEFINITION: "DEFINITION",
    PERM: (resource: string, action: string) => `PERM#${resource}#${action}`,

    // Monthly Summary
    MONTH: (yearMonth: string) => `MONTH#${yearMonth}`,

    // Config
    CONFIG: `${T}#CONFIG`,
    CHANNEL: (channelId: string) => `CHANNEL#${channelId}`,
    KEYWORD: (lang: string, action: string) => `KEYWORD#${lang}#${action}`,

    // Document
    DOC: (id: string) => `DOC#${id}`,
    DOC_PREFIX: "DOC#",

    // Legal Obligation
    LEGAL: (type: string) => `LEGAL#${type}`,

    // Attendance Lock
    LOCK: (yearMonth: string) => `${T}#LOCK#${yearMonth}`,
    LOCK_SK_COMPANY: "COMPANY",
    LOCK_SK_GROUP: (groupId: string) => `GROUP#${groupId}`,
    LOCK_SK_EMP: (employeeId: string) => `EMP#${employeeId}`,

    // GSI patterns
    GSI1: {
      SLACK: (slackId: string) => `${T}#SLACK#${slackId}`,
      MGR: (managerId: string) => `${T}#MGR#${managerId}`,
      LEAVE_STATUS: (status: string) => `${T}#LEAVE#${status}`,
      FLAG_STATUS: (status: string) => `${T}#FLAG#${status}`,
      AUDIT_ACTOR: (actorId: string) => `${T}#AUDIT_ACTOR#${actorId}`,
    },
    GSI2: {
      ORG_EMP: `${T}#ORG#EMP`,
      ORG_LEAVE: `${T}#ORG#LEAVE`,
      ORG_ATT: (date: string) => `${T}#ORG#ATT#${date}`,
      ORG_REPORT: (date: string) => `${T}#ORG#REPORT#${date}`,
      ORG_HOLIDAY: `${T}#ORG#HOLIDAY`,
      ORG_ROLE: `${T}#ORG#ROLE`,
      ORG_LEGAL: `${T}#ORG#LEGAL`,
      EXPIRY: (date: string, id: string) => `${T}#EXPIRY#${date}#${id}`,
    },
  } as const;
}
