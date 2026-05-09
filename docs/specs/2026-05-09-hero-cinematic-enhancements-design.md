# Hero Cinematic Enhancements — Design Spec

**Date:** 2026-05-09
**Status:** Approved by user, ready for implementation
**Builds on:** `2026-05-09-starfield-hero-design.md`

## Problem

The starfield hero (live at `dpl_AA9gozCeH4RL2Hqjs36c3dhwp1No`) reads as polished but stops short of "memorable signature" territory. The climax beat (chrome silhouette + name resolve at scroll end) holds correctly but lacks the punctuation marks that distinguish reference work — Apple TV+ Foundation, J.J. Abrams Star Trek, Severance opener.

## Goal

Add three coordinated enhancements that elevate the climax from polished to signature, without rewriting any existing motion or copy:

1. **Anamorphic blue lens flare** at the warp climax — distinctive horizontal streak through canvas center.
2. **Camera roll** — committed 0 → 4° clockwise lean as `uWarp` ramps, sells forward motion.
3. **Constellation sparkline** — 7-point rising line drawn between stars at scroll end, with a traveling luminosity pulse during dwell.

All three are gated by the same `uWarp` driver already in place, so they stay synchronized with the existing scroll choreography.

## Cinematic concept

> Scroll begins. Stars stream forward. As the camera leans into the warp, a blue anamorphic flare blooms across the chrome silhouette — the visual climax. As the dwell beat holds, a quiet sparkline traces itself across the sky, peaking just above the chrome. A pulse of light walks the line, slowly, while the viewer rests on the resolved identity.

The flare is the punctuation; the camera roll is the commitment; the sparkline is the signature.

## Architecture

### Render order (back to front)

1. **Starfield + chrome silhouette** — existing `cinemaOrbShader` fragment, unchanged.
2. **Anamorphic lens flare** — new full-screen quad, additive blend, driven by `uWarp`. Lives in `components/three/lensFlareShader.ts` + `LensFlareMesh` (in same file or co-located).
3. **Constellation sparkline** — drei `<Line>` primitives in a separate r3f group. Lives in `components/three/Constellation.tsx`.

### Camera roll

Applied to the r3f `Canvas` camera's `rotation.z` via a `useFrame` callback inside `OrbMesh` (or a new sibling component) reading `warpRef`. No new file.

### Driver

Still a single `warpRef` (uWarp 0 → 1). Lens flare opacity, camera roll angle, constellation draw progress, and pulse phase all derive from it.

### Why this stack

- **Drei `<Line>`** is the canonical r3f primitive for animated SVG-like strokes. It uses `meshline` under the hood, exposes `dashOffset` and `dashArray` uniforms — exactly what the draw-in and traveling-pulse animations need.
- **Separate flare quad** keeps `cinemaOrbShader` focused on starfield + chrome (single responsibility). Flare math is small enough to live in its own file rather than bloating the orb shader.
- **Camera-level roll** is simpler than rolling the world; r3f handles it via `camera.rotation.z` per frame.

### No new dependencies

`@react-three/drei` is the only new import. Will be added to `package.json` if not already present (verified during planning).

## Visual specification

### Lens flare

- **Activation:** `flareGain = smoothstep(0.85, 0.95, uWarp)`. Off below 0.85, full at 0.95, holds through dwell to 1.0.
- **Composition (additive over starfield):**
  - Central highlight: white core, Gaussian falloff radius ≈ 0.025 of viewport min-dim, multiplied by `flareGain`.
  - Anamorphic streak: `streak = exp(-pow(uvCentered.y * 80.0, 2.0)) * exp(-abs(uvCentered.x) * 1.4)`, tinted `vec3(0.55, 0.78, 1.0)`, multiplied by `flareGain * 0.75`.
  - Inner core line: tighter, brighter horizontal streak (smaller y-scale, tighter x-decay), tinted `vec3(0.85, 0.92, 1.0)`, multiplied by `flareGain * 0.5`.
- **Anchoring:** Streak centered on the canvas — same anchor as the chrome silhouette.
- **Tier policy:**
  - `high` / `mid`: full flare (highlight + streak + core).
  - `low`: highlight only (skips both streaks).

### Camera roll

- **Driver:** `camera.rotation.z = warpRef.current * 4 * (Math.PI / 180)` per frame.
- **Range:** 0° at warp 0, 4° at warp 1.
- **Direction:** Clockwise from camera view. We commit to one direction (no sway, no alternation).
- **Tier policy:** Identical across all tiers — pure JS, zero GPU cost.
- **Reduced motion:** Already gated; reduced-motion users get the static portrait, no canvas, no roll.

### Constellation sparkline

- **Shape:** 7 control points in NDC-like normalized space (mapped to canvas pixels via viewport):
  ```
  (-0.55, -0.20), (-0.35, -0.05), (-0.15, -0.18),
  ( 0.00, +0.20), (+0.18, +0.05), (+0.38, +0.12),
  (+0.58,  0.00)
  ```
  Peak at `(0, +0.20)` sits just above the chrome silhouette's center, framing it without overlap.
- **Stroke:** drei `<Line>` with:
  - `lineWidth={1.4}`, DPR-aware
  - `color="#cfe1ff"`
  - `transparent` material, dash uniforms driven from JS each frame.
- **Endpoint stars:** 7 small additive sprites at the control points; brightness `0.35 + 0.65 * flareGain`.
- **Animation phases:**
  1. **Draw-in** (`uWarp` 0.85 → 0.95): `dashOffset` from `1.0` → `0.0` over ~400ms of scroll, `expo.out` curve.
  2. **Pulse during dwell** (`uWarp` ≥ 0.95): a separate `<Line>` overlay with a small bright dash segment whose `dashOffset` advances by `dt` each frame on a 3s loop, opacity ~0.35, additive.
- **Tier policy:**
  - `high`: full draw + traveling pulse.
  - `mid`: draw + hold (no traveling pulse — saves one draw call).
  - `low`: 5 control points (drop the two innermost); no pulse; simpler line material.

## Scroll choreography (delta from existing plan)

| Pin progress | New behavior |
|---|---|
| 0 — 0.50 | (no change) camera roll begins, lens flare/constellation latent |
| 0.50 — 0.85 | (no change) warp ramps; camera roll passes through ~3.4° |
| **0.85 — 0.95** | **Lens flare blooms (gain ramps 0 → 1); constellation sparkline strokes in (drawProgress 0 → 1)** |
| **0.95 — 1.00** | **Lens flare full; constellation pulse begins traveling along stroke (high tier only); camera roll lands at 4°** |

No existing tweens are removed. The new effects layer on top of the existing pin timeline.

## Files

**Create:**
- `components/three/lensFlareShader.ts` — vertex + fragment + uniform defaults.
- `components/three/LensFlareMesh.tsx` — r3f mesh wrapping the shader, takes `warpRef` prop.
- `components/three/Constellation.tsx` — r3f group with drei `<Line>` + endpoint sprites, takes `warpRef` and `tier` props.
- `components/three/lensFlareShader.test.ts` — Vitest, structural assertions on shader source.
- `components/three/Constellation.test.tsx` — Vitest + jsdom, structural assertions on rendered output per tier.

**Modify:**
- `components/three/CinemaHeroCanvas.tsx` — render `<LensFlareMesh>` and `<Constellation>` inside `<Canvas>`, after `<OrbMesh>`. Add a `useFrame` hook that updates `camera.rotation.z` from `warpRef`.
- `tests/e2e/hero-cinema.spec.ts` — add 2 new tests (lens flare blue weight at scroll end; constellation line count at scroll end).

**Verify (no edit expected):**
- `components/home/Hero.tsx` — passes `warpRef` to `<HeroBackground>` which already forwards to canvas. No new props.
- `components/home/HeroPinController.tsx` — existing warp tween reaches 1.0 at scroll end. No retargeting.

## Performance budget

| Tier | Add'l GPU cost | Add'l draw calls | Frame budget delta |
|---|---|---|---|
| high | flare quad (~12 ALU) + 2 lines + 7 sprites | +3 | < 1ms |
| mid  | flare quad + 1 line + 7 sprites | +2 | < 0.7ms |
| low  | flare highlight only + 1 line (5 pts) + 5 sprites | +2 | < 0.5ms |

Stays inside per-tier FPS-probe budgets (18/25/36ms). If the probe downgrades tier mid-session, all three effects degrade together via the same tier prop — no additional probe logic.

## Testing

### Unit (Vitest)
- `lensFlareShader.test.ts`: vertex/fragment compile structurally, expose `uWarp` and `uResolution`, contain `streak` and central-highlight code paths, defaults match spec.
- `Constellation.test.tsx` (jsdom): renders without crashing for each tier, exposes 7 (high/mid) or 5 (low) endpoint sprites, accepts a `warp` prop and forwards to dash uniforms.

### E2E (Playwright)
- New: "lens flare activates near scroll end" — scroll to 95% of pin, sample center y / off-center x via `gl.readPixels`, expect non-zero blue channel weight (soft assertion as with existing chrome test).
- New: "constellation lines mount at scroll end" — after scrolling to bottom, count rendered Line meshes in the r3f scene via window-attached debug hook, expect ≥ 1.
- Existing 6 tests pass unchanged.

### Manual visual sanity (deployed preview)
- Anamorphic blue streak visible during climax.
- Camera tilted ~4° at scroll end.
- Sparkline drawn through 7 stars; pulse traveling during dwell on high tier.

## Out of scope

- Lens flare on cursor (anchored to center only).
- Constellation that morphs / responds to pointer.
- Audio cue.
- Persistent star seeds across reloads.
- DOF / TAA improvements.
- Real DOF instead of fake bokeh.
- Any change to copy, layout, or non-hero sections.
- Nebula / dust / gas effects (explicitly rejected by user).

## Known limitations

- Camera roll rotates the entire camera, so the chrome silhouette and starfield rotate together. The chrome silhouette is rendered in screen space (its `maskUv` derives from `vUv`, not world position), so it stays anchored relative to the viewport even as the camera rotates — the rotation is read by the viewer as the *starfield* tilting, which is the intended effect.
- drei `<Line>` requires `@react-three/drei` to be installed. If not already present in `package.json`, the implementation plan adds it as the first task.
- Anamorphic streak math uses two `exp()` calls per pixel; cheap on modern GPUs but skipped on `low` tier as a precaution.

## Success criteria

- TypeScript strict clean.
- Vitest 7/7 (5 existing + 2 new) passing.
- Playwright 8/8 (6 existing + 2 new) passing.
- `next build` clean.
- Vercel preview deploys to `READY`.
- Manual visual check on the deployed preview confirms: blue streak at climax, 4° camera lean, sparkline drawn through 7 stars, traveling pulse during dwell.
