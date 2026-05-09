import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDeviceTier } from "./useDeviceTier";

function mock({
  reduce = false,
  width = 1440,
  memory = 8,
  cores = 8,
  webgl2 = true,
}: { reduce?: boolean; width?: number; memory?: number; cores?: number; webgl2?: boolean }) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((q: string) => ({
      matches:
        (q === "(prefers-reduced-motion: reduce)" && reduce) ||
        (q === "(min-width: 1024px)" && width >= 1024) ||
        (q === "(min-width: 768px)" && width >= 768),
      media: q,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => memory });
  Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => cores });
  // Patch HTMLCanvasElement.prototype.getContext so document.createElement("canvas")
  // returns a configurable WebGL2 context (jsdom doesn't implement getContext).
  const proto = globalThis.HTMLCanvasElement.prototype as unknown as {
    getContext: (name: string) => unknown;
  };
  const original = proto.getContext;
  proto.getContext = function (name: string) {
    if (name === "webgl2") return webgl2 ? ({} as WebGL2RenderingContext) : null;
    return original ? original.call(this, name) : null;
  };
}

describe("useDeviceTier", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("returns 'static' when reduced-motion is set", () => {
    mock({ reduce: true });
    const { result } = renderHook(() => useDeviceTier());
    expect(result.current).toBe("static");
  });

  it("returns 'static' when WebGL2 is unavailable", () => {
    mock({ webgl2: false });
    const { result } = renderHook(() => useDeviceTier());
    expect(result.current).toBe("static");
  });

  it("returns 'static' when deviceMemory < 3", () => {
    mock({ memory: 2 });
    const { result } = renderHook(() => useDeviceTier());
    expect(result.current).toBe("static");
  });

  it("returns 'high' on a beefy desktop", () => {
    mock({ width: 1920, memory: 16, cores: 12 });
    const { result } = renderHook(() => useDeviceTier());
    expect(result.current).toBe("high");
  });

  it("returns 'mid' on a tablet", () => {
    mock({ width: 900, memory: 8, cores: 8 });
    const { result } = renderHook(() => useDeviceTier());
    expect(result.current).toBe("mid");
  });

  it("returns 'low' on a phone", () => {
    mock({ width: 414, memory: 4, cores: 6 });
    const { result } = renderHook(() => useDeviceTier());
    expect(result.current).toBe("low");
  });
});
