import { describe, it, expect } from "vitest";
import { tiptapToPlainText, plainTextToTiptap, CURRENT_SCHEMA_VERSION } from "./tiptapJson";

describe("tiptapJson", () => {
  it("round-trips plain text", () => {
    const json = plainTextToTiptap("Hello, world.");
    expect(tiptapToPlainText(json)).toBe("Hello, world.");
  });

  it("returns empty string for null/empty doc", () => {
    expect(tiptapToPlainText(null)).toBe("");
    expect(tiptapToPlainText({ type: "doc", content: [] })).toBe("");
  });

  it("exports current schema version", () => {
    expect(CURRENT_SCHEMA_VERSION).toBeGreaterThanOrEqual(1);
  });
});
