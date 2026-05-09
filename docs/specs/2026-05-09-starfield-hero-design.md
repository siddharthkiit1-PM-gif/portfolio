# Starfield Hero Design

**Status:** Approved 2026-05-09
**Replaces:** the SDF orb morph shipped in Phase 3.5 (`components/three/cinemaOrbShader.ts`).

## Problem

The Phase 3.5 cinema orb (sphere → liquid capsule → chrome portrait) reads as visually awkward. The user described the orb as "the ball looks odd" and asked for "stars in space, live, and it shows the cinematic view." Goal: replace the orb with an Apple TV+-grade deep-space fly-through that ends on the chrome portrait silhouette.

## Cinematic concept

Pure deep space (no nebula, no haze cloud). The viewer is flying slowly forward through a dense starfield with three depth layers. As the user scrolls, camera velocity increases, stars streak outward from the focal point, and a chrome portrait silhouette resolves at the center. Stars never become the silhouette — they remain the cosmic backdrop. The chrome is lit from behind; rim glow catches on the deepest stars.

**Reference feel:** Apple TV+ Foundation / For All Mankind opening shots.

## Visual specification

### Starfield

- 3 depth layers, procedurally generated in the fragment shader from 3D hash noise — no geometry, no buffer attributes.
  - **Far:** ~2000 stars, 0.6–1.0 px, dim (`0.4–0.6` luminance), slow stream.
  - **Mid:** ~600 stars, 1.0–1.6 px, medium luminance (`0.7–0.85`), medium stream.
  - **Near:** ~80 stars, 1.8–2.6 px with soft halo (`0.0008` Gaussian), brightest (`0.9–1.0`), fastest stream.
- **Color tint:** 90% pure white. 10% have a subtle tint sampled from a low-freq lookup — half lean warm (`#ffe0b8`), half cool (`#bcd1ff`). Tint magnitude capped at 15% so the field still reads as "white stars."
- **Twinkle:** near layer only. Per-star sine modulation on brightness with phase offset from hash seed, frequency 0.6–1.2 Hz. Far/mid layers are stable.

### Camera fly-through

- Camera moves along `-Z` at velocity proportional to `uWarp`.
- Stars in shader space are a tiled 3D grid; modulo wraps stars from infinity into focal plane.
- Streak length: at warp ≥ 0.5, each star renders as a short line segment along its outward velocity vector (length = `uWarp * 0.018` in UV units), giving subtle motion blur. Below 0.5 they remain points.
- Outward streaming uses radial direction `(uv - center)` normalized, scaled by warp and depth — far layer streams slowest, near fastest.

### Chrome silhouette

- Reuses existing portrait alpha mask (`/portrait/portrait-mask-512.png`) sampled in the fragment.
- Activation curve: `smoothstep(0.5, 0.9, uWarp)` — invisible until 50% warp, fully resolved by 90%.
- Surface shading: same chrome palette shipped in Phase 3.5: base `(0.78, 0.84, 0.92)`, anisotropic horizontal streak, fresnel rim with `(0.7, 0.5, 1.0) → (1.0, 1.0, 1.0)` blend by `uPaletteShift`. (`uPaletteShift` is now slaved to `uWarp` curve internally — one less uniform from JS.)
- Composited **over** the starfield with edge-aware alpha so stars near the silhouette edge get clipped only inside the mask, preserving the rim glow.

### Vignette

- Pulse retained from Phase 3.5: tightens around the climax. Applied after compositing.

### Post-process pipeline (`CinemaHeroCanvas.tsx`)

Unchanged from current shipped state:
- **High:** Bloom + DOF + ChromaticAberration + Vignette + Noise.
- **Mid:** Bloom + Vignette + Noise.
- **Low:** in-fragment `BLOOM_FAKE` define only.
- **Static:** `HeroOrbFallback` — unchanged.

## Scroll choreography (`HeroPinController.tsx`)

Pin length, snap points, and DOM tween structure stay identical to current state. Only the uniform target changes (`morphRef` → `warpRef`).

| Scroll % | Beat | warp value | DOM |
|---|---|---|---|
| 0–20%  | Intro hold     | 0.0       | Headline / name / CTAs visible |
| 20–50% | Acceleration   | 0 → 0.4   | Char peel via SplitText, kinetic line reveal at 45% |
| 50–80% | Warp           | 0.4 → 0.85 | Chrome silhouette materializes; chars fade |
| 80–95% | Resolve        | 0.85 → 1.0 | Name coalesces with scale anticipation |
| 95–100% | Dwell         | 1.0       | CTA spring; subtle name drift |

Eases retained from Phase 3.5 polish: `power2.inOut` → `expo.inOut` on warp tweens, `expo.out` on char peel, `back.out(1.4)` on CTA group, `sine.inOut` parallax on name during dwell.

## Architecture

### Files modified

| File | Change |
|---|---|
| `components/three/cinemaOrbShader.ts` | **Full rewrite of fragment.** Drop SDF raymarch (sphere/capsule/portrait SDFs, FBM displacement, normal calc). Add starfield generator + warp transform + chrome silhouette compositor. Vertex unchanged. |
| `components/three/CinemaHeroCanvas.tsx` | Rename uniform `uMorph` → `uWarp` and `morphRef` → `warpRef` in props. Drop `uBreath` uniform + sin driver (no breath needed in space). Drop `uPaletteShift` uniform — chrome activation is internal to the shader, slaved to `uWarp`. Other plumbing unchanged. |
| `components/home/HeroPinController.tsx` | Rename `morphRef` → `warpRef`, drop `paletteShiftRef`. Update target values per choreography table. Eases unchanged. |
| `components/home/Hero.tsx` | Owns the refs; rename `morphRef` → `warpRef`, drop `paletteShiftRef`. |

### Files unchanged

- `lib/motion/useDeviceTier.ts`, `useViewportClass.ts` — tier gating still applies.
- `components/three/HeroOrbFallback.tsx` — static fallback.
- `scripts/build-portrait-mask.ts` + `/public/portrait/*` — mask assets reused.
- `tests/e2e/hero-cinema.spec.ts` — existing assertions still valid.

### New uniforms (`cinemaOrbShader.ts`)

```glsl
uniform float uTime;          // existing
uniform vec2  uResolution;    // existing
uniform vec2  uPointer;       // existing — small parallax offset
uniform float uWarp;          // NEW — replaces uMorph; 0 idle, 1 fully resolved
uniform sampler2D uPortraitMask; // existing
```

Removed: `uMorph`, `uPaletteShift`, `uBreath`.

### Tier-conditional define

`#define STAR_COUNT N` — replaces the old `#define STEPS N`. Loop count for star sampling.
- **High:** 2700
- **Mid:** 1400
- **Low:** 700

`BLOOM_FAKE` define on low tier preserved (in-fragment glow approximation).

## Performance budget

- Shader cost is dominated by the star loop. At 2700 iterations per fragment on a 2K display, this is the perf hot spot. Estimate: ~9ms / frame on M1, ~14ms on iPad Air, ~22ms on Pixel 5 (low tier 700 stars). FPS probe demotes tier if avg dt exceeds budget — same mechanism as today.
- DPR cap unchanged: high `[1, 1.5]`, mid `[1, 1.25]`, low `[1, 1]`.
- IntersectionObserver pause unchanged.

## Testing

### Existing E2E (still valid)
- Desktop: canvas mounts, pin holds.
- iPhone 13 / iPad Pro: canvas mounts.
- Reduced-motion: portrait fallback, no canvas.
- No console errors on home page load.

### New E2E assertion
- Scroll to 100% pin position, confirm chrome silhouette is visible at canvas center: sample center pixel via `page.evaluate`, assert luminance is in chrome range (`0.5 < L < 0.95`) and not black (proves silhouette resolved over starfield).

### Visual sanity (manual)
- Lighthouse Best Practices and Performance scores hold or improve relative to Phase 3.5 baseline (desktop 0.55, mobile 0.58).
- Reduced-motion path verified manually in DevTools emulation.

## Out of scope

- Custom particle geometry or `THREE.Points` system — fragment-only is faster and DPR-stable.
- Constellation lines, nebula clouds, or per-particle physics targets.
- Camera deceleration via DOF blur ramping — keep DOF static for budget reasons.
- Audio cues.

## Known limitations

- Procedural starfield does not match a real night-sky catalog — looks beautiful, not astronomically accurate. Acceptable.
- Streak length on mobile may need clamping if motion-blur reads as smear. Tunable via warp curve.

## Success criteria

1. The orb is gone. Replaced by a dense, depth-aware starfield with forward fly-through.
2. Chrome portrait silhouette resolves cleanly at the climax, lit by the field behind it.
3. All Phase 3.5 E2E tests still pass; new center-pixel assertion passes.
4. Tier gating + FPS demotion + reduced-motion fallback all behave as today.
5. Visual quality is comparable to Apple TV+ deep-space hero shots — confirmed by user review of the deployed preview.
