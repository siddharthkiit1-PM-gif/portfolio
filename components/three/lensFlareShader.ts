export const lensFlareUniformDefaults = {
  uWarp: 0,
};

export const lensFlareVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const lensFlareFragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uWarp;
  uniform vec2 uResolution;

  void main() {
    // Activation: off below 0.85, full at 0.95, holds through dwell.
    float flareGain = smoothstep(0.85, 0.95, uWarp);
    if (flareGain <= 0.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Aspect-correct centered UV.
    vec2 p = vUv - 0.5;
    p.x *= uResolution.x / uResolution.y;

    // Central highlight — small Gaussian core.
    float r2 = dot(p, p);
    float highlight = exp(-r2 * 1600.0);

    vec3 col = vec3(highlight);

    #ifndef LOW_TIER
      // Anamorphic blue streak.
      float streak = exp(-pow(p.y * 80.0, 2.0)) * exp(-abs(p.x) * 1.4);
      vec3 streakColor = vec3(0.55, 0.78, 1.0);
      col += streakColor * streak * 0.75;

      // Inner core line — tighter, brighter.
      float core = exp(-pow(p.y * 240.0, 2.0)) * exp(-abs(p.x) * 2.6);
      vec3 coreColor = vec3(0.85, 0.92, 1.0);
      col += coreColor * core * 0.5;
    #endif

    gl_FragColor = vec4(col * flareGain, flareGain);
  }
`;
