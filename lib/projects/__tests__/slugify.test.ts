import { describe, expect, it } from "vitest";
import { slugify } from "../slugify";

describe("slugify", () => {
  it("lowercases ASCII words and joins them with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips non-ASCII characters", () => {
    expect(slugify("Café & Crème")).toBe("caf-crme");
  });

  it("collapses repeated whitespace and punctuation into one hyphen", () => {
    expect(slugify("AI   for  Sales!!!")).toBe("ai-for-sales");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  — Project — ")).toBe("project");
  });

  it("returns 'untitled' for an empty input", () => {
    expect(slugify("")).toBe("untitled");
    expect(slugify("   ")).toBe("untitled");
  });

  it("preserves digits", () => {
    expect(slugify("Q3 2024 Launch")).toBe("q3-2024-launch");
  });
});
