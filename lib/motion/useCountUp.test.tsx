import { describe, it, expect } from "vitest";
import { parseCountUpValue } from "./useCountUp";

describe("parseCountUpValue", () => {
  it("parses a plain integer", () => {
    expect(parseCountUpValue("500")).toEqual({
      prefix: "",
      number: 500,
      suffix: "",
    });
  });

  it("parses a $-prefixed K-suffixed value", () => {
    expect(parseCountUpValue("$500K")).toEqual({
      prefix: "$",
      number: 500,
      suffix: "K",
    });
  });

  it("parses a +-prefixed % value", () => {
    expect(parseCountUpValue("+18%")).toEqual({
      prefix: "+",
      number: 18,
      suffix: "%",
    });
  });

  it("parses a --prefixed % value", () => {
    expect(parseCountUpValue("-98%")).toEqual({
      prefix: "-",
      number: 98,
      suffix: "%",
    });
  });

  it("falls back to numberless display when no digits are present", () => {
    expect(parseCountUpValue("AT&T platform")).toEqual({
      prefix: "AT&T platform",
      number: 0,
      suffix: "",
    });
  });
});
