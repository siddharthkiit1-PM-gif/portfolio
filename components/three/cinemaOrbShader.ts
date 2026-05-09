export const cinemaUniformDefaults = {
  uTime: 0,
  uMorph: 0,
  uPaletteShift: 0,
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

    float dSphere = sdSphere(p, 0.85) - n;
    float dCapsule = sdCapsule(p, 0.18, 1.4) - n * 0.6;
    float dPortrait = sdPortrait(p) - n * 0.25;

    // Two-stage blend: sphere → capsule (0..0.5), capsule → portrait (0.5..1)
    float a = smoothstep(0.0, 0.5, uMorph);
    float b = smoothstep(0.5, 1.0, uMorph);
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

  // Cosine palette violet → cyan → pink
  vec3 cosinePalette(float t) {
    return vec3(0.5) + vec3(0.5) * cos(6.28318 * (vec3(1.0)*t + vec3(0.32, 0.18, 0.65)));
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

      vec3 chrome = vec3(0.85, 0.87, 0.92);
      vec3 surface = mix(
        cosinePalette(0.5 + 0.5*dot(n, vec3(1.0,0.5,0.0)) + uTime*0.04),
        chrome,
        uPaletteShift
      );

      vec3 rimColor = mix(vec3(0.7,0.5,1.0), vec3(1.0), uPaletteShift*0.7);
      col = surface * (0.25 + 0.7*diff) + fres * rimColor * 0.6;
    }

    // Volumetric haze (palette warps with chrome too)
    vec3 hazeColor = mix(vec3(0.55, 0.35, 0.85), vec3(0.6, 0.65, 0.75), uPaletteShift);
    col += density * hazeColor;

    // In-fragment bloom approximation (low tier)
    #ifdef BLOOM_FAKE
    col += pow(max(col - 0.6, 0.0), vec3(2.0)) * 0.6;
    #endif

    float vig = smoothstep(1.4, 0.4, length(uv));
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;
