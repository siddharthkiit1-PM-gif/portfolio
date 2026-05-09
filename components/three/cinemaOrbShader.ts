export const cinemaUniformDefaults = {
  uTime: 0,
  uWarp: 0,
};

export const cinemaOrbVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const cinemaOrbFragment = /* glsl */ `
  precision highp float;

  #ifndef STAR_COUNT
  #define STAR_COUNT 1400
  #endif

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uWarp;             // 0 idle → 1 fully resolved
  uniform sampler2D uPortraitMask;

  // ---------- hash helpers ----------
  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }
  vec2 hash21(float p) {
    return vec2(hash11(p), hash11(p + 17.31));
  }

  // ---------- one star layer ----------
  // Returns additive luminance contribution from this star.
  // p          = pixel position in NDC-ish coords (centered, aspect-corrected)
  // idx        = star index
  // depthScale = how far away this layer is (1 = far, 4 = near)
  // sizePx     = base star size in pixels
  // brightness = luminance multiplier
  vec3 sampleStar(vec2 p, float idx, float depthScale, float sizePx, float brightness) {
    // Tiled lattice cell so stars wrap neatly when camera advances
    vec2 seed = hash21(idx * 12.9898);
    // Spread stars across a 2x2 NDC-ish region (slight overshoot so streaks survive)
    vec2 starPos = (seed - 0.5) * 2.6;

    // Outward velocity = direction from center, scaled by depth and warp
    vec2 dir = normalize(starPos + vec2(0.0001));
    float radius = length(starPos);

    // Warp pushes stars outward over time + uWarp
    float pushed = radius + (uTime * 0.04 + uWarp * 0.55) * depthScale;
    pushed = mod(pushed, 2.6);
    vec2 worldPos = dir * pushed;

    // Distance from this fragment to the star
    vec2 d = p - worldPos;
    float dist = length(d);

    // Star sprite — tight gaussian, normalized to pixel-space size
    float radiusUv = sizePx / uResolution.y;
    float core = exp(-pow(dist / radiusUv, 2.0));

    // Streak: when warp > 0.4, smear the star backward along its velocity
    float streakLen = max(uWarp - 0.4, 0.0) * 0.018 * depthScale;
    if (streakLen > 0.0) {
      vec2 along = d - dir * clamp(dot(d, dir), -streakLen, 0.0);
      float dStreak = length(along);
      core = max(core, exp(-pow(dStreak / radiusUv, 2.0)) * 0.7);
    }

    // Subtle tint: ~10% of stars get a warm or cool cast
    vec3 tint = vec3(1.0);
    float tintRoll = hash11(idx * 1.13);
    if (tintRoll > 0.93) tint = vec3(1.0, 0.88, 0.72);     // warm
    else if (tintRoll > 0.86) tint = vec3(0.74, 0.82, 1.0); // cool

    // Twinkle: only on near layer (depthScale > 2.0)
    float twinkle = 1.0;
    if (depthScale > 2.0) {
      twinkle = 0.65 + 0.35 * sin(uTime * (0.6 + hash11(idx) * 0.6) + idx * 6.28);
    }

    return tint * core * brightness * twinkle;
  }

  // ---------- chrome silhouette compositor ----------
  vec3 chromeSurface(vec2 maskUv) {
    // Fake normal from mask gradient — gives the silhouette a sense of curvature
    float e = 1.0 / 256.0;
    float mx = texture2D(uPortraitMask, maskUv + vec2(e, 0.0)).r
             - texture2D(uPortraitMask, maskUv - vec2(e, 0.0)).r;
    float my = texture2D(uPortraitMask, maskUv + vec2(0.0, e)).r
             - texture2D(uPortraitMask, maskUv - vec2(0.0, e)).r;
    vec3 n = normalize(vec3(-mx, -my, 0.6));

    vec3 ld = normalize(vec3(0.6, 0.7, 0.8));
    float diff = max(dot(n, ld), 0.0);
    float fres = pow(1.0 - max(n.z, 0.0), 2.5);

    vec3 chrome = vec3(0.78, 0.84, 0.92);
    // Anisotropic horizontal streak — brushed-metal highlight
    float aniso = pow(1.0 - abs(n.x), 6.0) * 1.2;
    vec3 rim = mix(vec3(0.7, 0.5, 1.0), vec3(1.0), 0.7);

    return chrome * (0.25 + 0.7 * diff) + fres * rim * 0.6 + vec3(aniso);
  }

  void main() {
    // Aspect-corrected centered coords in roughly [-1, 1]
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    // Pointer parallax — small lateral offset
    uv += uPointer * 0.04;

    vec3 col = vec3(0.005, 0.008, 0.014);  // deep space — not pure black

    // Three depth layers: far / mid / near
    int FAR_END = STAR_COUNT * 60 / 100;   // 60% far
    int MID_END = STAR_COUNT * 90 / 100;   // 30% mid; remaining 10% = near

    for (int i = 0; i < STAR_COUNT; i++) {
      float idx = float(i);
      if (i < FAR_END) {
        col += sampleStar(uv, idx, 1.0, 0.9, 0.55);
      } else if (i < MID_END) {
        col += sampleStar(uv, idx + 7777.0, 1.6, 1.3, 0.78);
      } else {
        col += sampleStar(uv, idx + 31337.0, 2.6, 2.2, 0.95);
      }
    }

    // Chrome silhouette compositor
    // mask UV: portrait centered, scale ~0.7 to match the silhouette size
    vec2 maskUv = uv * 0.7 + 0.5;
    maskUv.y = 1.0 - maskUv.y;
    float inMaskRange = step(0.0, maskUv.x) * step(maskUv.x, 1.0)
                      * step(0.0, maskUv.y) * step(maskUv.y, 1.0);
    float maskAlpha = inMaskRange * texture2D(uPortraitMask, maskUv).r;

    // Activation curve — silhouette invisible until 50% warp
    float activation = smoothstep(0.5, 0.9, uWarp);
    float chromeAlpha = maskAlpha * activation;

    if (chromeAlpha > 0.001) {
      vec3 chromeCol = chromeSurface(maskUv);
      col = mix(col, chromeCol, chromeAlpha);
    }

    // Vignette pulse — tightens at climax
    float vigInner = mix(0.55, 0.30, smoothstep(0.4, 0.85, uWarp));
    float vigOuter = mix(1.40, 1.10, smoothstep(0.4, 0.85, uWarp));
    float vig = smoothstep(vigOuter, vigInner, length(uv));
    col *= vig;

    #ifdef BLOOM_FAKE
    col += pow(max(col - 0.6, 0.0), vec3(2.0)) * 0.6;
    #endif

    gl_FragColor = vec4(col, 1.0);
  }
`;
