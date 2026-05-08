import { describe, it, expect } from "vitest";
import { isAdminEmail } from "./users";

describe("isAdminEmail", () => {
  it("returns true for an email on the allowlist", () => {
    expect(isAdminEmail("siddharth@example.com", ["siddharth@example.com"])).toBe(true);
  });
  it("is case-insensitive on local part and domain", () => {
    expect(isAdminEmail("Siddharth@Example.com", ["siddharth@example.com"])).toBe(true);
  });
  it("returns false otherwise", () => {
    expect(isAdminEmail("intruder@example.com", ["siddharth@example.com"])).toBe(false);
  });
});
