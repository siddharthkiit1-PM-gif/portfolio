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
  it("clamps 0 up to 1", () => {
    expect(validateK(0)).toBe(1);
  });
  it("floors fractional values", () => {
    expect(validateK(3.7)).toBe(3);
  });
  it("defaults NaN to 5", () => {
    expect(validateK(NaN)).toBe(5);
  });
  it("clamps positive Infinity to 20", () => {
    expect(validateK(Infinity)).toBe(20);
  });
  it("defaults negative Infinity to 5", () => {
    expect(validateK(-Infinity)).toBe(5);
  });
});
