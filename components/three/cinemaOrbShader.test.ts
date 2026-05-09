import { describe, it, expect } from "vitest";
import { cinemaOrbVertex, cinemaOrbFragment, cinemaUniformDefaults } from "./cinemaOrbShader";

describe("cinemaOrbShader", () => {
  it("vertex shader is a fullscreen quad", () => {
    expect(cinemaOrbVertex).toContain("gl_Position");
    expect(cinemaOrbVertex).toContain("vUv");
  });

  it("fragment exposes the 6 expected uniforms", () => {
    for (const u of [
      "uTime",
      "uResolution",
      "uPointer",
      "uMorph",
      "uPaletteShift",
      "uPortraitMask",
    ]) {
      expect(cinemaOrbFragment).toContain("uniform");
      expect(cinemaOrbFragment).toContain(u);
    }
  });

  it("fragment defines all three SDF stages", () => {
    expect(cinemaOrbFragment).toContain("sdSphere");
    expect(cinemaOrbFragment).toContain("sdCapsule");
    expect(cinemaOrbFragment).toContain("sdPortrait");
  });

  it("fragment uses STEPS macro so step count is tunable per tier", () => {
    expect(cinemaOrbFragment).toContain("#ifndef STEPS");
    expect(cinemaOrbFragment).toContain("#define STEPS");
  });

  it("uniform defaults match the spec", () => {
    expect(cinemaUniformDefaults.uMorph).toBe(0);
    expect(cinemaUniformDefaults.uPaletteShift).toBe(0);
    expect(cinemaUniformDefaults.uTime).toBe(0);
  });
});
