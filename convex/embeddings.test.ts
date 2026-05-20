import { describe, it, expect } from "vitest";
import { sha256OfText } from "./lib/hash";

describe("sha256OfText", () => {
  it("hashes deterministically", () => {
    expect(sha256OfText("hello")).toBe(sha256OfText("hello"));
    expect(sha256OfText("hello")).not.toBe(sha256OfText("world"));
  });
});
