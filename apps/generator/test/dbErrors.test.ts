import { DrizzleQueryError } from "drizzle-orm/errors";
import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "../lib/db/errors";

function pgError(code: string): Error {
  return Object.assign(new Error("duplicate key"), { code });
}

describe("isUniqueViolation", () => {
  it("recognises the driver's own error", () => {
    expect(isUniqueViolation(pgError("23505"))).toBe(true);
  });

  it("looks through Drizzle's query error to the driver's cause", () => {
    expect(isUniqueViolation(new DrizzleQueryError("insert", [], pgError("23505")))).toBe(true);
  });

  it("rejects other codes, plain errors and non-errors", () => {
    expect(isUniqueViolation(new DrizzleQueryError("insert", [], pgError("23503")))).toBe(false);
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
