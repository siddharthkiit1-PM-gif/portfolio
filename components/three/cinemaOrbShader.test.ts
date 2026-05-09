import { describe, it, expect } from "vitest";
import { cinemaOrbVertex, cinemaOrbFragment, cinemaUniformDefaults } from "./cinemaOrbShader";

describe("cinemaOrbShader (starfield)", () => {
  it("vertex shader is a fullscreen quad", () => {
    expect(cinemaOrbVertex).toContain("gl_Position");
    expect(cinemaOrbVertex).toContain("vUv");
  });

  it("fragment exposes the expected uniforms", () => {
    for (const u of [
      "uTime",
      "uResolution",
      "uPointer",
      "uWarp",
      "uPortraitMask",
    ]) {
      expect(cinemaOrbFragment).toContain(`uniform`);
      expect(cinemaOrbFragment).toContain(u);
    }
  });

  it("fragment is a starfield + chrome compositor (no SDF stages)", () => {
    expect(cinemaOrbFragment).toContain("sampleStar");
    expect(cinemaOrbFragment).toContain("chromeSurface");
    expect(cinemaOrbFragment).not.toContain("sdSphere");
    expect(cinemaOrbFragment).not.toContain("sdCapsule");
  });

  it("fragment uses STAR_COUNT macro so density is tunable per tier", () => {
    expect(cinemaOrbFragment).toContain("#ifndef STAR_COUNT");
    expect(cinemaOrbFragment).toContain("#define STAR_COUNT");
  });

  it("uniform defaults match the spec", () => {
    expect(cinemaUniformDefaults.uWarp).toBe(0);
    expect(cinemaUniformDefaults.uTime).toBe(0);
  });
});
