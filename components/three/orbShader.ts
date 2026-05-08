export const orbVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const orbFragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;

  // --- Hash + value noise + FBM ---
  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  // --- SDF ---
  float sdSphere(vec3 p, float r) {
    return length(p) - r;
  }

  float scene(vec3 p) {
    float d = sdSphere(p, 0.85);
    float n = fbm(p * 1.4 + vec3(0.0, 0.0, uTime * 0.08));
    return d - n * 0.18;
  }

  vec3 calcNormal(vec3 p) {
    const float h = 0.001;
    const vec2 k = vec2(1.0, -1.0);
    return normalize(
      k.xyy * scene(p + k.xyy * h) +
      k.yyx * scene(p + k.yyx * h) +
      k.yxy * scene(p + k.yxy * h) +
      k.xxx * scene(p + k.xxx * h)
    );
  }

  // --- Palette: violet -> cyan -> pink (cosine palette) ---
  vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.32, 0.18, 0.65);
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;

    // Camera + mouse parallax
    vec3 ro = vec3(uMouse.x * 0.25, uMouse.y * 0.18, 2.4);
    vec3 rd = normalize(vec3(uv, -1.4));

    float t = 0.0;
    float density = 0.0;
    bool hit = false;
    vec3 hitPos = vec3(0.0);

    for (int i = 0; i < 80; i++) {
      vec3 p = ro + rd * t;
      float d = scene(p);
      if (d < 0.001) {
        hit = true;
        hitPos = p;
        break;
      }
      density += 0.012 * exp(-abs(d) * 6.0);
      t += max(d * 0.7, 0.012);
      if (t > 5.0) break;
    }

    vec3 col = vec3(0.02, 0.024, 0.04); // deep space background

    if (hit) {
      vec3 n = calcNormal(hitPos);
      vec3 ld = normalize(vec3(0.6, 0.7, 0.8));
      float diff = max(dot(n, ld), 0.0);
      float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);

      float pal = 0.5 + 0.5 * dot(n, vec3(1.0, 0.5, 0.0));
      vec3 surface = palette(pal + uTime * 0.04);
      col = surface * (0.25 + 0.7 * diff) + fres * vec3(0.7, 0.5, 1.0) * 0.6;
    }

    // Volumetric haze around the orb
    col += density * vec3(0.55, 0.35, 0.85);

    // Vignette
    float vig = smoothstep(1.4, 0.4, length(uv));
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;
