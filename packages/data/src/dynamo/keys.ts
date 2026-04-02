/**
 * DynamoDB single-table key patterns.
 * All entity key prefixes centralized here.
 */
export const KEYS = {
  // Employee
  EMP: (id: string) => `EMP#${id}`,
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
  REGION: (region: string) => `REGION#${region}`,
  HOL: (date: string) => `HOL#${date}`,
  HOL_PREFIX: "HOL#",

  // Audit
  AUDIT: (targetId: string) => `AUDIT#${targetId}`,
  AUDIT_ACTOR: (actorId: string) => `AUDIT_ACTOR#${actorId}`,

  // Override
  OVR: (type: string, value: string) => `OVR#${type}#${value}`,

  // Role
  ROLE: (name: string) => `ROLE#${name}`,
  DEFINITION: "DEFINITION",
  PERM: (resource: string, action: string) => `PERM#${resource}#${action}`,

  // Monthly Summary
  MONTH: (yearMonth: string) => `MONTH#${yearMonth}`,

  // Config
  CONFIG: "CONFIG",
  CHANNEL: (channelId: string) => `CHANNEL#${channelId}`,
  KEYWORD: (lang: string, action: string) => `KEYWORD#${lang}#${action}`,

  // Document
  DOC: (id: string) => `DOC#${id}`,
  DOC_PREFIX: "DOC#",

  // Legal Obligation
  LEGAL: (type: string) => `LEGAL#${type}`,

  // GSI patterns
  GSI1: {
    SLACK: (slackId: string) => `SLACK#${slackId}`,
    MGR: (managerId: string) => `MGR#${managerId}`,
    LEAVE_STATUS: (status: string) => `LEAVE#${status}`,
    FLAG_STATUS: (status: string) => `FLAG#${status}`,
    AUDIT_ACTOR: (actorId: string) => `AUDIT_ACTOR#${actorId}`,
  },
  GSI2: {
    ORG_EMP: "ORG#EMP",
    ORG_LEAVE: "ORG#LEAVE",
    ORG_ATT: (date: string) => `ORG#ATT#${date}`,
    ORG_REPORT: (date: string) => `ORG#REPORT#${date}`,
    ORG_HOLIDAY: "ORG#HOLIDAY",
    ORG_ROLE: "ORG#ROLE",
    ORG_LEGAL: "ORG#LEGAL",
    EXPIRY: (date: string, id: string) => `EXPIRY#${date}#${id}`,
  },
} as const;
