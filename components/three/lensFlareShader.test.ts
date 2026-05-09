import { describe, it, expect } from "vitest";
import { lensFlareVertex, lensFlareFragment, lensFlareUniformDefaults } from "./lensFlareShader";

describe("lensFlareShader", () => {
  it("vertex is a fullscreen quad", () => {
    expect(lensFlareVertex).toContain("gl_Position");
    expect(lensFlareVertex).toContain("vUv");
  });

  it("fragment exposes uWarp and uResolution uniforms", () => {
    expect(lensFlareFragment).toContain("uniform float uWarp");
    expect(lensFlareFragment).toContain("uniform vec2 uResolution");
  });

  it("fragment computes flareGain via smoothstep on uWarp", () => {
    expect(lensFlareFragment).toContain("smoothstep(0.85, 0.95, uWarp)");
  });

  it("fragment composes anamorphic streak and central highlight", () => {
    expect(lensFlareFragment).toContain("streak");
    expect(lensFlareFragment).toContain("exp(-pow");
    expect(lensFlareFragment).toContain("highlight");
  });

  it("fragment supports LOW_TIER guard to skip streaks", () => {
    expect(lensFlareFragment).toContain("#ifndef LOW_TIER");
  });

  it("uniform defaults match spec", () => {
    expect(lensFlareUniformDefaults.uWarp).toBe(0);
  });
});
