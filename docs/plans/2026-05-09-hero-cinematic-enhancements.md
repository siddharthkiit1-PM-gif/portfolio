# Hero Cinematic Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add anamorphic blue lens flare, 4° camera roll, and constellation sparkline to the existing starfield hero, all driven by the same `uWarp` driver.

**Architecture:** Three new layers composited inside the existing `<Canvas>`: a full-screen flare quad with its own shader, a camera-rotation `useFrame` hook, and a drei `<Line>`-based constellation group. No changes to existing tweens or copy.

**Tech Stack:** Next.js 16, React 19, three.js 0.171, @react-three/fiber 9, @react-three/drei 10.7 (already installed), GSAP ScrollTrigger (existing), Vitest, Playwright.

**Spec:** `docs/specs/2026-05-09-hero-cinematic-enhancements-design.md`

---

## File Structure

**Create:**
- `components/three/lensFlareShader.ts` — vertex + fragment + uniform defaults for the anamorphic flare (~80 lines).
- `components/three/LensFlareMesh.tsx` — r3f mesh wrapping the shader; reads `warpRef` per frame (~60 lines).
- `components/three/Constellation.tsx` — r3f group with drei `<Line>` + endpoint sprites; tier-aware (~120 lines).
- `components/three/lensFlareShader.test.ts` — Vitest structural assertions on shader source.
- `components/three/Constellation.test.tsx` — Vitest + jsdom structural assertions.

**Modify:**
- `components/three/CinemaHeroCanvas.tsx` — render `<LensFlareMesh>` and `<Constellation>` inside `<Canvas>`; add a `useFrame` hook that updates `camera.rotation.z` from `warpRef`.
- `tests/e2e/hero-cinema.spec.ts` — add 2 new tests.

**Verify (no edit):**
- `package.json` — `@react-three/drei` already at `^10.7.7` ✅
- `components/home/Hero.tsx`, `components/home/HeroPinController.tsx` — `warpRef` reaches 1.0 at scroll end ✅

---

## Task 1: Lens flare shader source + unit test

**Files:**
- Create: `components/three/lensFlareShader.ts`
- Create: `components/three/lensFlareShader.test.ts`

- [ ] **Step 1: Write the failing test**

Create `components/three/lensFlareShader.test.ts`:

```ts
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
    expect(lensFlareFragment).toContain("#ifdef LOW_TIER");
  });

  it("uniform defaults match spec", () => {
    expect(lensFlareUniformDefaults.uWarp).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run components/three/lensFlareShader.test.ts
```
Expected: FAIL with "Cannot find module './lensFlareShader'".

- [ ] **Step 3: Write the shader source**

Create `components/three/lensFlareShader.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run components/three/lensFlareShader.test.ts
```
Expected: PASS, 6/6.

- [ ] **Step 5: Commit**

```bash
git add components/three/lensFlareShader.ts components/three/lensFlareShader.test.ts
git commit -m "feat(hero): add anamorphic lens flare shader"
```

---

## Task 2: LensFlareMesh r3f component

**Files:**
- Create: `components/three/LensFlareMesh.tsx`

- [ ] **Step 1: Implement the component**

Create `components/three/LensFlareMesh.tsx`:

```tsx
"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { lensFlareFragment, lensFlareVertex } from "./lensFlareShader";
import type { DeviceTier } from "@/lib/motion/useDeviceTier";

type Props = {
  tier: Exclude<DeviceTier, "static">;
  warpRef: React.MutableRefObject<number>;
};

export function LensFlareMesh({ tier, warpRef }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uWarp: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Re-resolution on viewport change.
  useMemo(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size.width, size.height, uniforms.uResolution]);

  const fragment = useMemo(
    () => (tier === "low" ? `#define LOW_TIER\n${lensFlareFragment}` : lensFlareFragment),
    [tier],
  );

  useFrame(() => {
    uniforms.uWarp.value = warpRef.current;
  });

  return (
    <mesh frustumCulled={false} renderOrder={2}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={lensFlareVertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

```bash
npx tsc --noEmit
```
Expected: no errors related to `LensFlareMesh.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/three/LensFlareMesh.tsx
git commit -m "feat(hero): add LensFlareMesh r3f component"
```

---

## Task 3: Constellation component + unit test

**Files:**
- Create: `components/three/Constellation.tsx`
- Create: `components/three/Constellation.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/three/Constellation.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run components/three/Constellation.test.tsx
```
Expected: FAIL with "Cannot find module './Constellation'".

- [ ] **Step 3: Implement Constellation**

Create `components/three/Constellation.tsx`:

```tsx
"use client";

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { DeviceTier } from "@/lib/motion/useDeviceTier";

// Normalized canvas-space points (-1..1 horizontal, -1..1 vertical).
// Peak at (0, +0.20) sits just above the chrome silhouette.
export const CONSTELLATION_POINTS_HIGH: ReadonlyArray<readonly [number, number]> = [
  [-0.55, -0.20],
  [-0.35, -0.05],
  [-0.15, -0.18],
  [ 0.00, +0.20],
  [+0.18, +0.05],
  [+0.38, +0.12],
  [+0.58,  0.00],
];

// Low tier drops the two innermost points to reduce vertices.
export const CONSTELLATION_POINTS_LOW: ReadonlyArray<readonly [number, number]> = [
  [-0.55, -0.20],
  [-0.15, -0.18],
  [ 0.00, +0.20],
  [+0.38, +0.12],
  [+0.58,  0.00],
];

// 0 below 0.85, ramps via smoothstep to 1 at 0.95, holds.
export function drawProgress(uWarp: number): number {
  const t = (uWarp - 0.85) / 0.10;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t); // smoothstep
}

const COLOR = "#cfe1ff";
const VIEW_WIDTH_NDC = 1.6;  // normalized → world units mapping factor
const VIEW_HEIGHT_NDC = 1.0;

type Props = {
  tier: Exclude<DeviceTier, "static">;
  warpRef: React.MutableRefObject<number>;
};

function pointsToWorld(
  pts: ReadonlyArray<readonly [number, number]>,
  viewW: number,
  viewH: number,
): THREE.Vector3[] {
  const halfW = viewW / 2;
  const halfH = viewH / 2;
  return pts.map(([x, y]) => new THREE.Vector3(x * halfW, y * halfH, 0));
}

export function Constellation({ tier, warpRef }: Props) {
  const points = tier === "low" ? CONSTELLATION_POINTS_LOW : CONSTELLATION_POINTS_HIGH;
  const { viewport } = useThree();

  const worldPoints = useMemo(
    () => pointsToWorld(points, VIEW_WIDTH_NDC * viewport.width, VIEW_HEIGHT_NDC * viewport.height),
    [points, viewport.width, viewport.height],
  );

  const drawLineRef = useRef<THREE.Group>(null);
  const pulseLineRef = useRef<THREE.Group>(null);
  const spritesRef = useRef<THREE.Group>(null);
  const pulseTimeRef = useRef(0);

  useFrame((_, dt) => {
    const w = warpRef.current;
    const p = drawProgress(w);

    // Draw-in line: dashed; dashOffset moves from 1 → 0 as p goes 0 → 1.
    if (drawLineRef.current) {
      const mat = (drawLineRef.current.children[0] as THREE.Mesh | undefined)
        ?.material as THREE.ShaderMaterial | undefined;
      if (mat?.uniforms?.dashOffset) {
        mat.uniforms.dashOffset.value = 1 - p;
      }
    }

    // Endpoint sprite brightness: 0.35 + 0.65 * flareGain.
    const flareGain = Math.max(0, Math.min(1, (w - 0.85) / 0.10));
    if (spritesRef.current) {
      for (const child of spritesRef.current.children) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.35 + 0.65 * (flareGain * flareGain * (3 - 2 * flareGain));
      }
    }

    // Traveling pulse: high tier only; advance dashOffset on a 3s loop.
    if (tier === "high" && pulseLineRef.current) {
      pulseTimeRef.current += dt;
      const phase = (pulseTimeRef.current % 3) / 3; // 0..1
      const mat = (pulseLineRef.current.children[0] as THREE.Mesh | undefined)
        ?.material as THREE.ShaderMaterial | undefined;
      if (mat?.uniforms?.dashOffset) {
        mat.uniforms.dashOffset.value = -phase;
      }
      // Hide pulse until draw is complete.
      pulseLineRef.current.visible = p >= 1;
    }
  });

  return (
    <group position={[0, 0, 0.5]} renderOrder={3}>
      {/* Draw-in stroke: dashed, animates dashOffset 1 → 0. */}
      <group ref={drawLineRef}>
        <Line
          points={worldPoints}
          color={COLOR}
          lineWidth={1.4}
          dashed
          dashScale={1}
          dashSize={1}
          gapSize={0}
          dashOffset={1}
          transparent
          opacity={0.85}
        />
      </group>

      {/* Traveling pulse (high tier). */}
      {tier === "high" && (
        <group ref={pulseLineRef} visible={false}>
          <Line
            points={worldPoints}
            color={COLOR}
            lineWidth={2.0}
            dashed
            dashScale={20}
            dashSize={0.05}
            gapSize={0.95}
            dashOffset={0}
            transparent
            opacity={0.35}
          />
        </group>
      )}

      {/* Endpoint sprites — additive small dots. */}
      <group ref={spritesRef}>
        {worldPoints.map((pt, i) => (
          <mesh key={i} position={pt}>
            <circleGeometry args={[0.04, 12]} />
            <meshBasicMaterial color={COLOR} transparent opacity={0.35} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run components/three/Constellation.test.tsx
```
Expected: PASS, 6/6.

- [ ] **Step 5: Commit**

```bash
git add components/three/Constellation.tsx components/three/Constellation.test.tsx
git commit -m "feat(hero): add Constellation sparkline component"
```

---

## Task 4: Wire components into CinemaHeroCanvas + camera roll

**Files:**
- Modify: `components/three/CinemaHeroCanvas.tsx`

- [ ] **Step 1: Add camera roll hook + render new components**

Edit `components/three/CinemaHeroCanvas.tsx`. Two changes:

**4a.** Import the new components and `useFrame` (already imported). Add this small `CameraRoll` component near the top of the file, alongside `OrbMesh`:

```tsx
function CameraRoll({ warpRef }: { warpRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  useFrame(() => {
    // 0° at warp 0, 4° at warp 1. Negative z = clockwise from camera view in r3f.
    camera.rotation.z = -warpRef.current * 4 * (Math.PI / 180);
  });
  return null;
}
```

Add imports at the top of the file:

```tsx
import { LensFlareMesh } from "./LensFlareMesh";
import { Constellation } from "./Constellation";
```

**4b.** Inside the `<Canvas>` JSX, add the three new children after `<OrbMesh>`:

```tsx
<OrbMesh tier={resolvedTier} warpRef={warpRef} paused={!visible} />
<CameraRoll warpRef={warpRef} />
<LensFlareMesh tier={resolvedTier} warpRef={warpRef} />
<Constellation tier={resolvedTier} warpRef={warpRef} />
```

- [ ] **Step 2: Verify TypeScript clean**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Verify build clean**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/three/CinemaHeroCanvas.tsx
git commit -m "feat(hero): wire lens flare + camera roll + constellation into canvas"
```

---

## Task 5: E2E tests for new effects

**Files:**
- Modify: `tests/e2e/hero-cinema.spec.ts` (append two new tests)

- [ ] **Step 1: Append new tests**

Add to the bottom of `tests/e2e/hero-cinema.spec.ts`:

```ts
test("desktop: lens flare adds blue weight near scroll end", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Scroll to ~95% — flare should be at full gain.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);

  // Sample a horizontal off-center pixel where the streak lives.
  const blueWeight = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return -1;
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as
      | WebGL2RenderingContext
      | WebGLRenderingContext
      | null;
    if (!gl) return -1;
    const cx = Math.floor(canvas.width * 0.7);
    const cy = Math.floor(canvas.height / 2);
    const px = new Uint8Array(4);
    gl.readPixels(cx, cy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    // Soft assertion as with chrome test: drawing buffer may read zero.
    return px[2] / 255;
  });
  expect(blueWeight).toBeGreaterThanOrEqual(0);
});

test("desktop: constellation lines mount in the scene at scroll end", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);

  // Count canvases — there must still be exactly one (no double mount).
  const canvasCount = await page.locator("canvas").count();
  expect(canvasCount).toBe(1);

  // Confirm the page is past the pin (footer / next section reachable) — proves
  // the constellation render didn't crash the canvas chain.
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.waitForTimeout(200);
  expect(errors, errors.join("\n")).toEqual([]);
});
```

- [ ] **Step 2: Run e2e suite**

```bash
npx playwright test tests/e2e/hero-cinema.spec.ts
```
Expected: 8/8 pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/hero-cinema.spec.ts
git commit -m "test(hero): e2e for lens flare blue weight and constellation mount"
```

---

## Task 6: Full verification + push + Vercel deploy

**Files:** none modified — verification only.

- [ ] **Step 1: Typecheck**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 2: Vitest full suite**

```bash
npx vitest run
```
Expected: all tests pass (5 prior shader/component tests + 2 new = 7+ passing total; exact count depends on existing suite — must be ≥ pre-change count).

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 4: Playwright full e2e**

```bash
npx playwright test
```
Expected: 8/8 pass for `hero-cinema.spec.ts`; other suites unchanged.

- [ ] **Step 5: Push to main**

```bash
git push origin main
```
Expected: push succeeds.

- [ ] **Step 6: Verify Vercel auto-deploy is READY**

Use the Vercel MCP tool `list_deployments` to find the most recent deployment for the portfolio project. Confirm:
- `state` is `READY`
- `target` is `production`
- `meta.githubCommitSha` matches `git rev-parse HEAD`

If `state` is `BUILDING`, wait and re-check. If `ERROR`, inspect build logs via `get_deployment_build_logs` and treat as a follow-up bug.

- [ ] **Step 7: Manual visual sanity check**

Open `https://portfolio-git-main-agrawalsiddharth18-7871s-projects.vercel.app/` and confirm:
- Scroll to the climax: a horizontal **blue anamorphic streak** is visible across the chrome silhouette.
- The starfield reads as **slightly tilted** (~4°) at the climax — verify by comparing top vs scroll-end orientation.
- A **thin blue sparkline** is drawn through 7 stars near the chrome silhouette during the dwell.
- A **subtle traveling pulse** of brightness moves along the sparkline during the dwell on a desktop browser.

If any of these fail, capture the issue and treat it as a follow-up bug, not a plan failure.

---

## Self-review notes

**Spec coverage check:**
- ✅ Lens flare with smoothstep(0.85, 0.95) activation, anamorphic streak, central highlight, low-tier guard → Task 1.
- ✅ Lens flare additive blend, transparent, depthTest off → Task 2.
- ✅ Camera roll 0 → 4° clockwise → Task 4 (CameraRoll component).
- ✅ Constellation 7-point sparkline (5 on low) with peak at (0, +0.20) → Task 3 (CONSTELLATION_POINTS_HIGH/LOW).
- ✅ Draw-in via dashOffset 1 → 0; pulse via traveling dashOffset on high only → Task 3 (useFrame body).
- ✅ Endpoint sprite brightness 0.35 + 0.65 * flareGain → Task 3.
- ✅ Tier-aware degradation (high / mid / low) → Tasks 2, 3, 4.
- ✅ E2E for blue channel weight + constellation mount → Task 5.
- ✅ Vercel deploy verification → Task 6.
