import { describe, it, expect } from "vitest";
import { createTenantKeys } from "../src/dynamo/keys.js";
import { DEFAULT_TENANT_ID } from "@hr-attendance-app/types";

const T = `T#${DEFAULT_TENANT_ID}`;
const KEYS = createTenantKeys(DEFAULT_TENANT_ID);

describe("DynamoDB Key Patterns", () => {
  it("generates employee keys", () => {
    expect(KEYS.EMP("001")).toBe(`${T}#EMP#001`);
    expect(KEYS.PROFILE).toBe("PROFILE");
  });

  it("generates attendance keys", () => {
    expect(KEYS.ATT("2024-01-15", "2024-01-15T09:00:00Z")).toBe("ATT#2024-01-15#2024-01-15T09:00:00Z");
    expect(KEYS.ATT_STATE).toBe("ATT_STATE");
    expect(KEYS.ATT_PREFIX("2024-01-15")).toBe("ATT#2024-01-15");
  });

  it("generates leave keys", () => {
    expect(KEYS.LEAVE("req001")).toBe("LEAVE#req001");
  });

  it("generates salary keys", () => {
    expect(KEYS.SALARY("2024-01-15")).toBe("SALARY#2024-01-15");
  });

  it("generates report keys with version", () => {
    expect(KEYS.REPORT("2024-01-15", 2)).toBe("REPORT#2024-01-15#v2");
  });

  it("generates flag keys", () => {
    expect(KEYS.FLAG("DAILY", "2024-01-15")).toBe("FLAG#DAILY#2024-01-15");
  });

  it("generates bank keys", () => {
    expect(KEYS.BANK("2024-01")).toBe("BANK#2024-01");
  });

  it("generates holiday keys", () => {
    expect(KEYS.REGION("JP")).toBe(`${T}#REGION#JP`);
    expect(KEYS.HOL("2024-01-01")).toBe("HOL#2024-01-01");
  });

  it("generates audit keys", () => {
    expect(KEYS.AUDIT("EMP#001")).toBe(`${T}#AUDIT#EMP#001`);
  });

  it("generates role keys", () => {
    expect(KEYS.ROLE("ADMIN")).toBe(`${T}#ROLE#ADMIN`);
    expect(KEYS.DEFINITION).toBe("DEFINITION");
  });

  it("generates GSI1 keys", () => {
    expect(KEYS.GSI1.SLACK("U12345")).toBe(`${T}#SLACK#U12345`);
    expect(KEYS.GSI1.MGR("001")).toBe(`${T}#MGR#001`);
    expect(KEYS.GSI1.LEAVE_STATUS("PENDING")).toBe(`${T}#LEAVE#PENDING`);
    expect(KEYS.GSI1.FLAG_STATUS("PENDING")).toBe(`${T}#FLAG#PENDING`);
  });

  it("generates GSI2 keys", () => {
    expect(KEYS.GSI2.ORG_EMP).toBe(`${T}#ORG#EMP`);
    expect(KEYS.GSI2.ORG_LEAVE).toBe(`${T}#ORG#LEAVE`);
    expect(KEYS.GSI2.ORG_ATT("2024-01-15")).toBe(`${T}#ORG#ATT#2024-01-15`);
    expect(KEYS.GSI2.ORG_REPORT("2024-01-15")).toBe(`${T}#ORG#REPORT#2024-01-15`);
    expect(KEYS.GSI2.ORG_HOLIDAY).toBe(`${T}#ORG#HOLIDAY`);
    expect(KEYS.GSI2.ORG_ROLE).toBe(`${T}#ORG#ROLE`);
  });

  it("generates config keys", () => {
    expect(KEYS.CONFIG).toBe(`${T}#CONFIG`);
    expect(KEYS.CHANNEL("C12345")).toBe("CHANNEL#C12345");
    expect(KEYS.KEYWORD("en", "CLOCK_IN")).toBe("KEYWORD#en#CLOCK_IN");
  });

  it("generates document keys", () => {
    expect(KEYS.DOC("doc001")).toBe("DOC#doc001");
  });

  it("generates legal obligation keys", () => {
    expect(KEYS.LEGAL("CONFIDENTIALITY")).toBe("LEGAL#CONFIDENTIALITY");
    expect(KEYS.GSI2.ORG_LEGAL).toBe(`${T}#ORG#LEGAL`);
    expect(KEYS.GSI2.EXPIRY("2026-06-30", "001")).toBe(`${T}#EXPIRY#2026-06-30#001`);
  });
});

describe("Tenant-scoped Key Patterns", () => {
  it("prefixes PKs with tenant ID", () => {
    const keys = createTenantKeys("acme-corp");
    expect(keys.EMP("001")).toBe("T#acme-corp#EMP#001");
    expect(keys.REGION("JP")).toBe("T#acme-corp#REGION#JP");
    expect(keys.AUDIT("EMP#001")).toBe("T#acme-corp#AUDIT#EMP#001");
    expect(keys.ROLE("ADMIN")).toBe("T#acme-corp#ROLE#ADMIN");
    expect(keys.LOCK("2024-01")).toBe("T#acme-corp#LOCK#2024-01");
    expect(keys.CONFIG).toBe("T#acme-corp#CONFIG");
  });

  it("prefixes GSI1 keys with tenant ID", () => {
    const keys = createTenantKeys("acme-corp");
    expect(keys.GSI1.SLACK("U12345")).toBe("T#acme-corp#SLACK#U12345");
    expect(keys.GSI1.MGR("001")).toBe("T#acme-corp#MGR#001");
    expect(keys.GSI1.LEAVE_STATUS("PENDING")).toBe("T#acme-corp#LEAVE#PENDING");
  });

  it("prefixes GSI2 keys with tenant ID", () => {
    const keys = createTenantKeys("acme-corp");
    expect(keys.GSI2.ORG_EMP).toBe("T#acme-corp#ORG#EMP");
    expect(keys.GSI2.ORG_LEAVE).toBe("T#acme-corp#ORG#LEAVE");
    expect(keys.GSI2.ORG_ATT("2024-01-15")).toBe("T#acme-corp#ORG#ATT#2024-01-15");
  });

  it("does NOT prefix SKs with tenant ID", () => {
    const keys = createTenantKeys("acme-corp");
    expect(keys.PROFILE).toBe("PROFILE");
    expect(keys.ATT_STATE).toBe("ATT_STATE");
    expect(keys.ATT("2024-01-15", "2024-01-15T09:00:00Z")).toBe("ATT#2024-01-15#2024-01-15T09:00:00Z");
    expect(keys.LEAVE("req001")).toBe("LEAVE#req001");
    expect(keys.SALARY("2024-01-15")).toBe("SALARY#2024-01-15");
    expect(keys.LOCK_SK_COMPANY).toBe("COMPANY");
    expect(keys.LOCK_SK_GROUP("JP_FULL_TIME")).toBe("GROUP#JP_FULL_TIME");
  });

  it("isolates different tenants completely", () => {
    const k1 = createTenantKeys("tenant-a");
    const k2 = createTenantKeys("tenant-b");
    expect(k1.EMP("001")).not.toBe(k2.EMP("001"));
    expect(k1.GSI2.ORG_EMP).not.toBe(k2.GSI2.ORG_EMP);
  });
});
