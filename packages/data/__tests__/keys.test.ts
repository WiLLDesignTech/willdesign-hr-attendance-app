import { describe, it, expect } from "vitest";
import { KEYS } from "../src/dynamo/keys.js";

describe("DynamoDB Key Patterns", () => {
  it("generates employee keys", () => {
    expect(KEYS.EMP("001")).toBe("EMP#001");
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
    expect(KEYS.REGION("JP")).toBe("REGION#JP");
    expect(KEYS.HOL("2024-01-01")).toBe("HOL#2024-01-01");
  });

  it("generates audit keys", () => {
    expect(KEYS.AUDIT("EMP#001")).toBe("AUDIT#EMP#001");
  });

  it("generates role keys", () => {
    expect(KEYS.ROLE("ADMIN")).toBe("ROLE#ADMIN");
    expect(KEYS.DEFINITION).toBe("DEFINITION");
  });

  it("generates GSI1 keys", () => {
    expect(KEYS.GSI1.SLACK("U12345")).toBe("SLACK#U12345");
    expect(KEYS.GSI1.MGR("001")).toBe("MGR#001");
    expect(KEYS.GSI1.LEAVE_STATUS("PENDING")).toBe("LEAVE#PENDING");
    expect(KEYS.GSI1.FLAG_STATUS("PENDING")).toBe("FLAG#PENDING");
  });

  it("generates GSI2 keys", () => {
    expect(KEYS.GSI2.ORG_EMP).toBe("ORG#EMP");
    expect(KEYS.GSI2.ORG_LEAVE).toBe("ORG#LEAVE");
    expect(KEYS.GSI2.ORG_ATT("2024-01-15")).toBe("ORG#ATT#2024-01-15");
    expect(KEYS.GSI2.ORG_REPORT("2024-01-15")).toBe("ORG#REPORT#2024-01-15");
    expect(KEYS.GSI2.ORG_HOLIDAY).toBe("ORG#HOLIDAY");
    expect(KEYS.GSI2.ORG_ROLE).toBe("ORG#ROLE");
  });

  it("generates config keys", () => {
    expect(KEYS.CONFIG).toBe("CONFIG");
    expect(KEYS.CHANNEL("C12345")).toBe("CHANNEL#C12345");
    expect(KEYS.KEYWORD("en", "CLOCK_IN")).toBe("KEYWORD#en#CLOCK_IN");
  });

  it("generates document keys", () => {
    expect(KEYS.DOC("doc001")).toBe("DOC#doc001");
  });

  it("generates legal obligation keys", () => {
    expect(KEYS.LEGAL("CONFIDENTIALITY")).toBe("LEGAL#CONFIDENTIALITY");
    expect(KEYS.GSI2.ORG_LEGAL).toBe("ORG#LEGAL");
    expect(KEYS.GSI2.EXPIRY("2026-06-30", "001")).toBe("EXPIRY#2026-06-30#001");
  });
});
