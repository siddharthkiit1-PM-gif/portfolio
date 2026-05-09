import { describe, it, expect } from "vitest";
import { CONSTELLATION_POINTS_HIGH, CONSTELLATION_POINTS_LOW, drawProgress } from "./Constellation";

describe("Constellation", () => {
  it("high tier exposes 7 control points", () => {
    expect(CONSTELLATION_POINTS_HIGH).toHaveLength(7);
  });

  it("low tier exposes 5 control points", () => {
    expect(CONSTELLATION_POINTS_LOW).toHaveLength(5);
  });

  it("peak point (highest y) sits above center", () => {
    const peak = CONSTELLATION_POINTS_HIGH.reduce((a, b) => (a[1] > b[1] ? a : b));
    expect(peak[1]).toBeGreaterThan(0);
  });

  it("drawProgress is 0 below 0.85 warp", () => {
    expect(drawProgress(0.0)).toBe(0);
    expect(drawProgress(0.84)).toBe(0);
  });

  it("drawProgress is 1 at or above 0.95 warp", () => {
    expect(drawProgress(0.95)).toBe(1);
    expect(drawProgress(1.0)).toBe(1);
  });

  it("drawProgress smoothly ramps between 0.85 and 0.95", () => {
    const mid = drawProgress(0.9);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});
