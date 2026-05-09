import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useViewportClass } from "./useViewportClass";

function mockMatchMedia(matches: Record<string, boolean>) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: matches[query] ?? false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe("useViewportClass", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("returns 'desktop' for ≥1024px", () => {
    mockMatchMedia({ "(min-width: 1024px)": true, "(min-width: 768px)": true });
    const { result } = renderHook(() => useViewportClass());
    expect(result.current).toBe("desktop");
  });

  it("returns 'tablet' for 768–1023px", () => {
    mockMatchMedia({ "(min-width: 1024px)": false, "(min-width: 768px)": true });
    const { result } = renderHook(() => useViewportClass());
    expect(result.current).toBe("tablet");
  });

  it("returns 'phone' for <768px", () => {
    mockMatchMedia({ "(min-width: 1024px)": false, "(min-width: 768px)": false });
    const { result } = renderHook(() => useViewportClass());
    expect(result.current).toBe("phone");
  });
});
