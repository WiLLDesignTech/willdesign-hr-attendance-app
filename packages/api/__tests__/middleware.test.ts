import { describe, it, expect } from "vitest";
import { parseAuthContext, validateBody, handleError, buildResponse } from "../src/middleware/index.js";
import { Roles } from "@hr-attendance-app/types";

describe("Auth Middleware", () => {
  it("extracts auth context from valid claims", () => {
    const claims = {
      sub: "user-123",
      "custom:employee_id": "EMP#001",
      "cognito:groups": "ADMIN",
    };
    const result = parseAuthContext(claims);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actorId).toBe("EMP#001");
      expect(result.data.actorRole).toBe(Roles.ADMIN);
    }
  });

  it("returns error for missing employee_id claim", () => {
    const claims = { sub: "user-123" };
    const result = parseAuthContext(claims);
    expect(result.success).toBe(false);
  });

  it("defaults to EMPLOYEE role when no group", () => {
    const claims = {
      sub: "user-123",
      "custom:employee_id": "EMP#001",
    };
    const result = parseAuthContext(claims);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actorRole).toBe(Roles.EMPLOYEE);
    }
  });
});

describe("Validation Middleware", () => {
  it("validates a valid body", () => {
    const schema = { parse: (v: unknown) => v };
    const result = validateBody(schema, { name: "test" });
    expect(result.success).toBe(true);
  });

  it("returns error for invalid body", () => {
    const schema = {
      parse: () => { throw new Error("Invalid field"); },
    };
    const result = validateBody(schema, {});
    expect(result.success).toBe(false);
  });
});

describe("Error Handler", () => {
  it("maps known error codes to HTTP status", () => {
    expect(handleError("NOT_FOUND").statusCode).toBe(404);
    expect(handleError("FORBIDDEN").statusCode).toBe(403);
    expect(handleError("VALIDATION").statusCode).toBe(400);
    expect(handleError("CONFLICT").statusCode).toBe(409);
    expect(handleError("UNPROCESSABLE").statusCode).toBe(422);
  });

  it("defaults to 500 for unknown errors", () => {
    expect(handleError("UNKNOWN_ERROR").statusCode).toBe(500);
  });
});

describe("Response Builder", () => {
  it("builds 200 response with JSON body", () => {
    const response = buildResponse(200, { message: "ok" });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ message: "ok" });
    expect(response.headers?.["Content-Type"]).toBe("application/json");
  });

  it("builds error response", () => {
    const response = buildResponse(400, { error: "Bad request" });
    expect(response.statusCode).toBe(400);
  });
});
