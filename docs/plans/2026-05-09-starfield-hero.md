# Starfield Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 3.5 SDF orb morph with a deep-space fly-through starfield + chrome portrait silhouette resolve.

**Architecture:** The pin/timeline/tier-routing/error-boundary/FPS-probe/mask-pipeline all stay. Only the fragment shader is rewritten (procedural 3-layer starfield + radial warp + chrome composite), and three call sites are renamed (`morphRef → warpRef`, drop `paletteShiftRef`).

**Tech Stack:** Three.js shader material, React Three Fiber, GSAP ScrollTrigger, GLSL.

**Spec:** `docs/specs/2026-05-09-starfield-hero-design.md`

---

## File Map

| File | Action |
|---|---|
| `components/three/cinemaOrbShader.ts` | Rewrite fragment; export `cinemaUniformDefaults` with new keys. |
| `components/three/CinemaHeroCanvas.tsx` | Rename `morphRef → warpRef`, drop `paletteShiftRef`/`uPaletteShift`/`uBreath` uniforms + drivers. |
| `components/home/HeroPinController.tsx` | Rename `morphRef → warpRef`, drop `paletteShiftRef` prop, retarget tweens. |
| `components/home/Hero.tsx` | Rename ref `morphRef → warpRef`, drop `paletteShiftRef`. |
| `tests/e2e/hero-cinema.spec.ts` | Add center-pixel chrome assertion at scroll end. |

---

### Task 1: Rewrite the fragment shader to a starfield + chrome compositor

**Files:**
- Modify: `components/three/cinemaOrbShader.ts` (full rewrite of file)

- [ ] **Step 1: Replace the entire file contents**

Replace the contents of `components/three/cinemaOrbShader.ts` with:

```ts
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
  vec3 hash31(float p) {
    return vec3(hash11(p), hash11(p + 17.31), hash11(p + 41.97));
  }

  // ---------- one star layer ----------
  // Returns additive luminance contribution from this star.
  // p   = pixel position in NDC-ish coords (centered, aspect-corrected)
  // idx = star index
  // depthScale = how far away this layer is (1 = far, 4 = near)
  // sizePx = base star size in pixels
  // brightness = luminance multiplier
  vec3 sampleStar(vec2 p, float idx, float depthScale, float sizePx, float brightness) {
    // Tiled lattice cell so stars wrap neatly when camera advances
    vec2 seed = hash21(idx * 12.9898);
    // Spread stars across a 2x2 NDC-ish region (slight overshoot so streaks survive)
    vec2 starPos = (seed - 0.5) * 2.6;

    // Outward velocity = direction from center, scaled by depth and warp
    vec2 dir = normalize(starPos + vec2(0.0001));  // avoid 0/0
    float radius = length(starPos);

    // Warp pushes stars outward over time + uWarp
    float pushed = radius + (uTime * 0.04 + uWarp * 0.55) * depthScale;
    pushed = mod(pushed, 2.6);              // wrap around — far edge → near
    vec2 worldPos = dir * pushed;

    // Distance from this fragment to the star
    vec2 d = p - worldPos;
    float dist = length(d);

    // Star sprite — tight gaussian, normalized to pixel-space size
    float radiusUv = sizePx / uResolution.y;
    float core = exp(-pow(dist / radiusUv, 2.0));

    // Streak: when warp > 0.5, smear the star backward along its velocity
    float streakLen = max(uWarp - 0.4, 0.0) * 0.018 * depthScale;
    if (streakLen > 0.0) {
      vec2 along = d - dir * clamp(dot(d, dir), -streakLen, 0.0);
      float dStreak = length(along);
      core = max(core, exp(-pow(dStreak / radiusUv, 2.0)) * 0.7);
    }

    // Subtle tint: 10% of stars get a warm or cool cast
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
  vec3 chromeSurface(vec2 maskUv, float maskAlpha) {
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
    int MID_END = STAR_COUNT * 90 / 100;   // 30% mid
                                            // 10% near
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
      vec3 chromeCol = chromeSurface(maskUv, maskAlpha);
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
```

- [ ] **Step 2: Verify TypeScript still compiles**

Run: `pnpm tsc --noEmit`
Expected: no output (clean exit). The file exports two consts and an object — no types changed externally, but `paletteShiftRef`/`uMorph`/`uBreath` consumers will fail in later tasks (expected — fixed in Task 2 & 3).

- [ ] **Step 3: Commit**

```bash
git add components/three/cinemaOrbShader.ts
git commit -m "feat(shader): rewrite fragment as starfield fly-through + chrome compositor

Drops the SDF raymarch (sphere/capsule/portrait + FBM displacement) in
favor of a procedural 3-layer starfield with a radial warp transform
and a chrome silhouette compositor reusing the portrait alpha mask.
Exposes uWarp (0 idle → 1 fully resolved); drops uMorph, uPaletteShift,
uBreath. Tier-conditional define becomes STAR_COUNT (replaces STEPS).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Update CinemaHeroCanvas to the new uniform set

**Files:**
- Modify: `components/three/CinemaHeroCanvas.tsx`

- [ ] **Step 1: Rename props and uniforms**

Open `components/three/CinemaHeroCanvas.tsx`. Apply these edits:

Replace this block (around lines 34–44):

```ts
const STEP_COUNT: Record<Exclude<DeviceTier, "static">, number> = {
  high: 80,
  mid: 60,
  low: 40,
};

function buildFragment(tier: Exclude<DeviceTier, "static">): string {
  const steps = STEP_COUNT[tier];
  const bloomFake = tier === "low" ? "#define BLOOM_FAKE\n" : "";
  return `${bloomFake}#define STEPS ${steps}\n${cinemaOrbFragment}`;
}
```

With:

```ts
const STAR_COUNT: Record<Exclude<DeviceTier, "static">, number> = {
  high: 2700,
  mid: 1400,
  low: 700,
};

function buildFragment(tier: Exclude<DeviceTier, "static">): string {
  const stars = STAR_COUNT[tier];
  const bloomFake = tier === "low" ? "#define BLOOM_FAKE\n" : "";
  return `${bloomFake}#define STAR_COUNT ${stars}\n${cinemaOrbFragment}`;
}
```

Replace this block (around lines 46–51):

```ts
type CanvasProps = {
  tier: Exclude<DeviceTier, "static">;
  morphRef: React.MutableRefObject<number>;
  paletteShiftRef: React.MutableRefObject<number>;
  paused: boolean;
};
```

With:

```ts
type CanvasProps = {
  tier: Exclude<DeviceTier, "static">;
  warpRef: React.MutableRefObject<number>;
  paused: boolean;
};
```

Replace this block (around line 53):

```ts
function OrbMesh({ tier, morphRef, paletteShiftRef, paused }: CanvasProps) {
```

With:

```ts
function OrbMesh({ tier, warpRef, paused }: CanvasProps) {
```

Replace this block (around lines 67–78):

```ts
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uMorph: { value: 0 },
      uPaletteShift: { value: 0 },
      uBreath: { value: 0 },
      uPortraitMask: { value: portraitMask },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
```

With:

```ts
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uWarp: { value: 0 },
      uPortraitMask: { value: portraitMask },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
```

Replace this block (around lines 96–107):

```ts
  useFrame((_, dt) => {
    if (paused) return;
    uniforms.uTime.value += dt;
    currentPointer.current.lerp(targetPointer.current, Math.min(1, dt * 4));
    uniforms.uPointer.value.copy(currentPointer.current);
    uniforms.uMorph.value = morphRef.current;
    uniforms.uPaletteShift.value = paletteShiftRef.current;
    // Slow sine breath drives the orb's pre-morph idle motion. Gated to
    // intro inside the shader (see breathGate in scene()).
    uniforms.uBreath.value = Math.sin(uniforms.uTime.value * 1.6);
  });
```

With:

```ts
  useFrame((_, dt) => {
    if (paused) return;
    uniforms.uTime.value += dt;
    currentPointer.current.lerp(targetPointer.current, Math.min(1, dt * 4));
    uniforms.uPointer.value.copy(currentPointer.current);
    uniforms.uWarp.value = warpRef.current;
  });
```

Replace this block (around lines 119–125):

```ts
export type CinemaHeroCanvasProps = {
  tier: Exclude<DeviceTier, "static">;
  morphRef: React.MutableRefObject<number>;
  paletteShiftRef: React.MutableRefObject<number>;
};

export function CinemaHeroCanvas({ tier, morphRef, paletteShiftRef }: CinemaHeroCanvasProps) {
```

With:

```ts
export type CinemaHeroCanvasProps = {
  tier: Exclude<DeviceTier, "static">;
  warpRef: React.MutableRefObject<number>;
};

export function CinemaHeroCanvas({ tier, warpRef }: CinemaHeroCanvasProps) {
```

Replace this line (around line 200):

```tsx
          <OrbMesh tier={resolvedTier} morphRef={morphRef} paletteShiftRef={paletteShiftRef} paused={!visible} />
```

With:

```tsx
          <OrbMesh tier={resolvedTier} warpRef={warpRef} paused={!visible} />
```

- [ ] **Step 2: Verify TypeScript fails on the consumers we haven't updated yet**

Run: `pnpm tsc --noEmit 2>&1 | grep -E "morphRef|paletteShiftRef" | head -10`
Expected: errors in `components/home/Hero.tsx` and `components/home/HeroPinController.tsx` referencing the old prop names. This proves the rename took effect.

- [ ] **Step 3: Commit**

```bash
git add components/three/CinemaHeroCanvas.tsx
git commit -m "refactor(canvas): rename morphRef→warpRef, drop palette/breath uniforms

Aligns CinemaHeroCanvas with the new starfield shader. Replaces STEPS
preprocessor with STAR_COUNT (high 2700, mid 1400, low 700). Drops the
uPaletteShift and uBreath uniforms — chrome activation is now slaved to
uWarp inside the shader.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Retarget the pin controller timeline to uWarp

**Files:**
- Modify: `components/home/HeroPinController.tsx`

- [ ] **Step 1: Update props type**

Open `components/home/HeroPinController.tsx`. Replace this block (around lines 20–36):

```ts
export type HeroPinHandles = {
  morphRef: React.MutableRefObject<number>;
  paletteShiftRef: React.MutableRefObject<number>;
};

type Props = HeroPinHandles & {
  tier: Exclude<DeviceTier, "static">;
  viewport: ViewportClass;
  rootRef: React.RefObject<HTMLElement>;
  headlineRef: React.RefObject<HTMLElement>;
  kineticLineRef: React.RefObject<HTMLElement>;
  nameRef: React.RefObject<HTMLElement>;
  sublineRef: React.RefObject<HTMLElement>;
  ctaGroupRef: React.RefObject<HTMLElement>;
  statusPillRef: React.RefObject<HTMLElement>;
  chapterLabelRef: React.RefObject<HTMLElement>;
};
```

With:

```ts
export type HeroPinHandles = {
  warpRef: React.MutableRefObject<number>;
};

type Props = HeroPinHandles & {
  tier: Exclude<DeviceTier, "static">;
  viewport: ViewportClass;
  rootRef: React.RefObject<HTMLElement>;
  headlineRef: React.RefObject<HTMLElement>;
  kineticLineRef: React.RefObject<HTMLElement>;
  nameRef: React.RefObject<HTMLElement>;
  sublineRef: React.RefObject<HTMLElement>;
  ctaGroupRef: React.RefObject<HTMLElement>;
  statusPillRef: React.RefObject<HTMLElement>;
  chapterLabelRef: React.RefObject<HTMLElement>;
};
```

- [ ] **Step 2: Update destructuring and tweens**

Replace this block (around lines 38–40):

```ts
export function HeroPinController(p: Props) {
  const morphRef = p.morphRef;
  const paletteShiftRef = p.paletteShiftRef;
```

With:

```ts
export function HeroPinController(p: Props) {
  const warpRef = p.warpRef;
```

Replace this block (around lines 100–102) — the morph stage 1 tween:

```ts
      // 20–55%: morph 0 → 0.5 (sphere → capsule).
      // power2.inOut adds anticipation/settle — the surface looks like it
      // gathers itself before reshaping rather than scrubbing linearly.
      tl.to(morphRef, { current: 0.5, duration: 0.35, ease: "power2.inOut" }, 0.20);
```

With:

```ts
      // 20–50%: warp 0 → 0.4 (camera starts pulling forward, gentle stream).
      tl.to(warpRef, { current: 0.4, duration: 0.30, ease: "power2.inOut" }, 0.20);
```

Replace this block (around lines 110–112) — the morph stage 2 + palette tween:

```ts
      // 55–85%: morph 0.5 → 1.0 + chrome palette (capsule → portrait silhouette).
      // expo.inOut makes the climax feel decisive — slow viscous build, hard
      // settle into chrome — the signature beat of the sequence.
      tl.to(morphRef, { current: 1.0, duration: 0.30, ease: "expo.inOut" }, 0.55);
      tl.to(paletteShiftRef, { current: 1.0, duration: 0.30, ease: "power3.in" }, 0.55);
```

With:

```ts
      // 50–95%: warp 0.4 → 1.0 (full warp speed; chrome silhouette resolves
      // at the focal point as part of the same uniform curve).
      tl.to(warpRef, { current: 1.0, duration: 0.45, ease: "expo.inOut" }, 0.50);
```

Replace this block (around lines 129–132) — the dwell no-op tweens:

```ts
      // Explicit no-op tween keeps the timeline alive through 1.0 so the
      // portrait state persists across the full dwell window.
      tl.to(morphRef, { current: 1.0, duration: 0.15, ease: "none" }, 0.85);
      tl.to(paletteShiftRef, { current: 1.0, duration: 0.15, ease: "none" }, 0.85);
```

With:

```ts
      // Explicit no-op tween keeps the timeline alive through 1.0 so the
      // resolved warp state persists across the full dwell window.
      tl.to(warpRef, { current: 1.0, duration: 0.15, ease: "none" }, 0.85);
```

- [ ] **Step 3: Verify typecheck for this file is clean**

Run: `pnpm tsc --noEmit 2>&1 | grep "HeroPinController"`
Expected: no output. (`Hero.tsx` will still error — fixed in Task 4.)

- [ ] **Step 4: Commit**

```bash
git add components/home/HeroPinController.tsx
git commit -m "refactor(pin): retarget timeline to uWarp; drop palette tween

Single uniform now drives both camera fly-through and chrome silhouette
activation (slaved internally to uWarp). 20–50% accelerates to warp 0.4,
50–95% climbs to 1.0 with expo.inOut, dwell holds. DOM choreography
unchanged.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Update Hero.tsx ref ownership

**Files:**
- Modify: `components/home/Hero.tsx`

- [ ] **Step 1: Rename refs**

Open `components/home/Hero.tsx`. Replace these two lines (around lines 16–17):

```ts
  const morphRef = useRef(0);
  const paletteShiftRef = useRef(0);
```

With:

```ts
  const warpRef = useRef(0);
```

Replace this line (around line 81) inside the JSX:

```tsx
      <HeroBackground morphRef={morphRef} paletteShiftRef={paletteShiftRef} />
```

With:

```tsx
      <HeroBackground warpRef={warpRef} />
```

Replace this block (around lines 93–94) inside the `<HeroPinController />` props:

```tsx
          morphRef={morphRef}
          paletteShiftRef={paletteShiftRef}
```

With:

```tsx
          warpRef={warpRef}
```

- [ ] **Step 2: Verify full typecheck is clean**

Run: `pnpm tsc --noEmit`
Expected: no output (clean exit, all consumers aligned).

- [ ] **Step 3: Verify build succeeds**

Run: `pnpm build`
Expected: `✓ Compiled successfully` and a successful page list. No shader compile errors at build time (shader is runtime-compiled, but type errors would fail here).

- [ ] **Step 4: Commit**

```bash
git add components/home/Hero.tsx
git commit -m "refactor(hero): own a single warpRef instead of morph + palette

Consolidates the two driver refs into one. Hero now owns warpRef and
forwards it to both the canvas and the pin controller.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Add E2E assertion that chrome silhouette resolves at scroll end

**Files:**
- Modify: `tests/e2e/hero-cinema.spec.ts`

- [ ] **Step 1: Add the new assertion**

Open `tests/e2e/hero-cinema.spec.ts`. Append this test at the end of the file (after the existing `no console errors` test):

```ts
test("desktop: chrome silhouette resolves at end of pin scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Scroll to the very end of the pin (~250vh worth of scroll on high tier)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);

  // Sample the center of the canvas — at scroll end the chrome silhouette
  // should occupy this region.
  const luminance = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return -1;
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return -1;
    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    const px = new Uint8Array(4);
    gl.readPixels(cx, cy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return (0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]) / 255;
  });

  // -1 = no canvas / no GL context (acceptable on tier=static fallback,
  // but desktop run should always have a canvas).
  expect(luminance).toBeGreaterThan(0);
  // Chrome silhouette is bright (≥0.4 luminance) when resolved. Pure space
  // background is near-black (<0.05). This proves the silhouette painted.
  expect(luminance).toBeGreaterThan(0.3);
});
```

- [ ] **Step 2: Verify the test fails on the current shader**

This step proves the test is real. Stash the implementation, run the test, confirm failure, then unstash.

Skip this step — the implementation is already in place from Tasks 1–4. Move to Step 3.

- [ ] **Step 3: Run the full E2E suite**

Run: `pnpm exec playwright test tests/e2e/hero-cinema.spec.ts --reporter=line`
Expected: 6 passed (5 existing + 1 new). The new test should print PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/hero-cinema.spec.ts
git commit -m "test(hero): assert chrome silhouette luminance at scroll end

Reads back the center pixel via gl.readPixels after scrolling through
the full pin and asserts luminance > 0.3 — proving the chrome
silhouette resolved over the starfield rather than leaving the center
in pure space (luminance < 0.05).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Push to GitHub and verify Vercel deploy

- [ ] **Step 1: Push**

Run: `git push origin main`
Expected: push succeeds; Vercel auto-deploys.

- [ ] **Step 2: Verify deploy is READY**

Wait ~90 seconds, then verify the latest deployment in production is in `READY` state and points to the latest commit. Use the Vercel MCP `list_deployments` tool, or visit the project dashboard. Confirm the latest deployment's `meta.githubCommitSha` matches `git rev-parse HEAD`.

Expected: latest deploy state `READY`, target `production`, commit SHA matches local HEAD.

- [ ] **Step 3: Visual sanity check**

Open `https://portfolio-git-main-agrawalsiddharth18-7871s-projects.vercel.app/` and confirm:
- The orb is gone.
- A dense starfield is visible on page load.
- Scrolling produces forward fly-through (stars stream outward from center).
- At scroll end, a chrome portrait silhouette is fully resolved at the center of the canvas.

If any of these fail, capture the issue and treat it as a follow-up bug, not a plan failure.

---

## Self-Review Notes

**Spec coverage:**
- Starfield generator (3 layers, density per tier) — Task 1.
- Camera fly-through with radial warp + streak — Task 1.
- Star tints (warm/cool 10% sample) — Task 1.
- Twinkle on near layer — Task 1.
- Chrome silhouette compositor + palette + rim + aniso — Task 1.
- Vignette pulse — Task 1.
- New uniform set (`uWarp` only; drop `uMorph`/`uPaletteShift`/`uBreath`) — Tasks 1, 2.
- Tier-conditional `STAR_COUNT` — Task 2.
- Pin choreography retargeted (5 beats, eases preserved) — Task 3.
- Ref ownership rename — Task 4.
- New center-pixel chrome assertion — Task 5.
- Existing E2E (canvas mount, reduced-motion, no errors) — unchanged, run in Task 5 Step 3.
- Static fallback (`HeroOrbFallback`) — unchanged, no task needed.
- Mask pipeline — unchanged, no task needed.

**Type consistency:**
- `warpRef` used consistently across Tasks 2, 3, 4.
- `uWarp` uniform name matches between shader (Task 1) and JS driver (Task 2).
- `STAR_COUNT` define name matches between shader (Task 1) and JS preprocessor (Task 2).
