import { describe, it, expect } from "vitest";
import { validateK } from "./mcp";

describe("validateK", () => {
  it("defaults to 5 when k is undefined", () => {
    expect(validateK(undefined)).toBe(5);
  });
  it("clamps to max 20", () => {
    expect(validateK(50)).toBe(20);
  });
  it("rejects negative", () => {
    expect(validateK(-1)).toBe(1);
  });
});
