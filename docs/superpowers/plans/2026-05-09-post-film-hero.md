# Hero Refactor — Cinema Without the Nebula

> **For agentic workers:** plan executed inline. Tasks run straight through.

**Goal:** Refactor the live `components/home/Hero.tsx` (already scroll-pinned, chromatic, gradient-flow) to remove the WebGL nebula, fix the chromatic-overlap bug at peak frames, tighten the scroll feel, and land the locked copy + recruiter-grade impact chyron from the resume.

**Architecture:** Keep `HeroPinController` as the orchestrator. Replace `HeroBackground` (WebGL orb + constellation + bloom) with a quiet CSS-only backdrop (deep `#05060a` + radial vignette + faint hairline grid). Clamp `--ka-split` peaks so chromatic ghosts don't fan past readable. Trim pin length and snap stops. Insert `ImpactChyron` where the silhouette lived.

**Tech Stack:** Next.js 16 · React 19 · TS strict · Tailwind v4 · GSAP ScrollTrigger + SplitText (already wired) · existing `ChromaticText` and `FlowingGradientText` primitives.

**Out of scope:** the `/preview` route (shelved), case studies, projects grid, about, contact CTA. All untouched.

---

## Task 1 — Cut the nebula, add quiet backdrop in `Hero.tsx`

**Files:** Modify `components/home/Hero.tsx`.

- Remove `<HeroBackground warpRef={warpRef} />` and the `import { HeroBackground }`.
- Add an absolute-positioned quiet backdrop layer inside `<section>`:
  - Layer 1: solid `#05060a` (already on section)
  - Layer 2: radial vignette `radial-gradient(ellipse at 60% 45%, rgba(64,132,200,0.10) 0%, transparent 55%)` (a single soft cool glow where the orb used to sit — keeps depth without 3D)
  - Layer 3: faint hairline grid via repeating-linear-gradient, `rgba(255,255,255,0.025)` at 80px, both axes — architectural, not cosmic
- Drop `warpRef` (no longer drives anything visible). Leave the prop on `HeroPinController` typed as optional and ignore inside the timeline; or remove the warp tweens (Task 3).

## Task 2 — Update copy in `Hero.tsx`

- `hero.headlineBottom` fallback: `people actually use.` → `customers actually use.`
- Kinetic line text: `Built across AI, health, and consumer.` → `Build across Data, AI, and users.` (with three `FlowingGradientText` highlights — `Data`, `AI`, `users`)
- `hero.subtext` fallback: `PM at the intersection of AI, health, and consumer.` → `PM crafting products at the intersection of Data, AI, and users.`

## Task 3 — Fix overlap + tighten scroll in `HeroPinController.tsx`

**Files:** Modify `components/home/HeroPinController.tsx`.

- `PIN_VH`: `{ high: 240, mid: 190, low: 150 }` → `{ high: 120, mid: 95, low: 75 }`.
- Snap stops: `[0, 0.20, 0.50, 0.70, 0.85, 1]` → `[0, 0.50, 0.85, 1]`.
- Clamp `--ka-split` peaks:
  - Line ~138: `"--ka-split": 2` → `"--ka-split": 1.2`
  - Line ~157: `"--ka-split": 3` (name impact) → `"--ka-split": 1.6`
  - Resolve targets unchanged (`0.3`, `0.15`).
- Drop the `warpRef` tweens (no orb to drive). Leave the prop in for now to avoid plumbing churn; tweens are dead code since `HeroBackground` is gone.

## Task 4 — Build `ImpactChyron.tsx` (resume-grounded)

**Files:** Create `components/home/ImpactChyron.tsx`.

Two-line mono credit between hairlines. Top line: the three numbers (revenue · retention · leverage). Bottom line: where + scope. Sourced verbatim from resume (`$100K ARR · 0 → 1`, `+18% RETENTION`, `98% OPS CUT VIA AI`, `6SENSE · MARKET INSIGHT SIGNALS · 30+ ENTERPRISE CUSTOMERS`).

Stays calm and fully readable through the entire pin (no chromatic, no gradient — recruiter scan layer). Mounts vertically centered on desktop, beneath copy on mobile.

## Task 5 — Mount `ImpactChyron` in the silhouette slot

**Files:** Modify `components/home/Hero.tsx`.

Replace `silhouette={<div className="h-full w-full" aria-hidden />}` with `silhouette={<ImpactChyron />}`. Two-column desktop now reads: **text left, calm number-credit right**. Mobile/tablet: chyron stacks below copy.

## Task 6 — Verify

- `curl http://localhost:3001/` → 200, no console errors
- Scroll the hero: pin clears in ~120vh, chromatic ghosts stay readable, gradient flows, name impact pops without fanning, chyron visible the whole time
- Reduced-motion: chromatic stays at 0, no chars peel

## Task 7 — Commit

Single commit: `feat(hero): remove nebula, clamp chromatic peaks, tighten scroll, land impact chyron`.

---

## Stop point

After Task 7, stop. Wait for user verdict on `/` before:
- Touching the `/preview` route (it's shelved, can be deleted later)
- Touching case studies / projects / about / contact
- Pushing to Vercel
