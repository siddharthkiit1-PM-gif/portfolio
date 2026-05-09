export const cinemaUniformDefaults = {
  uTime: 0,
  uMorph: 0,
  uPaletteShift: 0,
  uBreath: 0,
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

  #ifndef STEPS
  #define STEPS 80
  #endif

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uMorph;          // 0 → 1
  uniform float uPaletteShift;   // 0 → 1
  uniform float uBreath;         // -1 → 1, sine-driven, gated to intro
  uniform sampler2D uPortraitMask;

  // ----- noise (FBM) -----
  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
          mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x), f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
          mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a*noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  // ----- SDFs -----
  float sdSphere(vec3 p, float r) { return length(p) - r; }

  float sdCapsule(vec3 p, float r, float h) {
    p.y -= clamp(p.y, -h, h);
    return length(p) - r;
  }

  float sdPortrait(vec3 p) {
    // Sample the 2D alpha mask projected onto the front plane (z = 0).
    // Convert SDF position to UV (mask is centered, scale 1.4 for head size).
    vec2 uv = p.xy * 0.7 + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      return length(p) - 0.05; // outside the mask: a thin shell
    }
    float a = texture2D(uPortraitMask, vec2(uv.x, 1.0 - uv.y)).r;
    // Distance: alpha=1 → inside (-), alpha=0 → outside (+)
    float planar = (0.5 - a) * 0.6;
    // Extrude along z so the silhouette has a small 3D shell
    return max(planar, abs(p.z) - 0.08);
  }

  float scene(vec3 p) {
    float n = fbm(p * 1.4 + vec3(0.0, 0.0, uTime * 0.08)) * 0.18;

    // Intro breath: ±1.2% radius pulse on the sphere, gated off after 30% morph.
    float breathGate = 1.0 - smoothstep(0.0, 0.30, uMorph);
    float breath = uBreath * 0.012 * breathGate;

    float dSphere = sdSphere(p, 0.85 + breath) - n;
    float dCapsule = sdCapsule(p, 0.18, 1.4) - n * 0.6;
    float dPortrait = sdPortrait(p) - n * 0.25;

    // Two-stage blend with eased curves so the morph anticipates and settles
    // rather than scrubbing linearly.
    float a = smoothstep(0.0, 0.5, uMorph);
    float b = smoothstep(0.5, 1.0, uMorph);
    // Subtle ease-in-out on each stage — gives material a sense of viscosity.
    a = a * a * (3.0 - 2.0 * a);
    b = b * b * (3.0 - 2.0 * b);
    float d1 = mix(dSphere, dCapsule, a);
    return mix(d1, dPortrait, b);
  }

  vec3 calcNormal(vec3 p) {
    const float h = 0.001;
    const vec2 k = vec2(1.0, -1.0);
    return normalize(
      k.xyy * scene(p + k.xyy*h) +
      k.yyx * scene(p + k.yyx*h) +
      k.yxy * scene(p + k.yxy*h) +
      k.xxx * scene(p + k.xxx*h));
  }

  // Cosine palette — cinematic violet → cyan with cooler bias for theatrical feel.
  // Per-channel phase offset gives the gradient an iridescent shimmer rather
  // than a flat cycle, echoing the Apple/Emergent reference of light passing
  // through liquid-metal surfaces.
  vec3 cosinePalette(float t) {
    return vec3(0.5) + vec3(0.5) * cos(6.28318 * (vec3(0.95, 1.0, 1.05)*t + vec3(0.48, 0.32, 0.72)));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / uResolution.y;
    vec3 ro = vec3(uPointer.x*0.25, uPointer.y*0.18, 2.4);
    vec3 rd = normalize(vec3(uv, -1.4));

    float t = 0.0, density = 0.0;
    bool hit = false;
    vec3 hitPos = vec3(0.0);

    for (int i = 0; i < STEPS; i++) {
      vec3 p = ro + rd * t;
      float d = scene(p);
      if (d < 0.001) { hit = true; hitPos = p; break; }
      density += 0.012 * exp(-abs(d) * 6.0);
      t += max(d * 0.7, 0.012);
      if (t > 5.0) break;
    }

    vec3 col = vec3(0.02, 0.024, 0.04);

    if (hit) {
      vec3 n = calcNormal(hitPos);
      vec3 ld = normalize(vec3(0.6, 0.7, 0.8));
      float diff = max(dot(n, ld), 0.0);
      float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);

      // Cooler chrome cast — closer to brushed platinum / Apple Silicon
      // marketing materials than warm bronze.
      vec3 chrome = vec3(0.78, 0.84, 0.92);
      vec3 surface = mix(
        cosinePalette(0.5 + 0.5*dot(n, vec3(1.0,0.5,0.0)) + uTime*0.04),
        chrome,
        uPaletteShift
      );

      // Anisotropic horizontal streak — fakes a brushed-metal highlight
      // running across the silhouette as it resolves to chrome.
      float aniso = pow(1.0 - abs(n.x), 6.0) * uPaletteShift * 1.2;

      vec3 rimColor = mix(vec3(0.7,0.5,1.0), vec3(1.0), uPaletteShift*0.7);
      col = surface * (0.25 + 0.7*diff) + fres * rimColor * 0.6 + vec3(aniso);
    }

    // Volumetric haze — deeper indigo at intro, cool steel at chrome.
    vec3 hazeColor = mix(vec3(0.42, 0.28, 0.92), vec3(0.55, 0.62, 0.78), uPaletteShift);
    col += density * hazeColor;

    // In-fragment bloom approximation (low tier)
    #ifdef BLOOM_FAKE
    col += pow(max(col - 0.6, 0.0), vec3(2.0)) * 0.6;
    #endif

    // Vignette pulse: tightens around the climax of the morph so the eye is
    // pulled toward the resolved silhouette rather than scrubbing flat.
    float vigInner = mix(0.55, 0.30, smoothstep(0.4, 0.85, uMorph));
    float vigOuter = mix(1.40, 1.10, smoothstep(0.4, 0.85, uMorph));
    float vig = smoothstep(vigOuter, vigInner, length(uv));
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;
