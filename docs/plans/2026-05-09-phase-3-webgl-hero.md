# Phase 3 — WebGL Hero + Smooth Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static hero gradient with a volumetric raymarched WebGL orb, add Lenis smooth scroll, and add scroll-triggered reveal animations on home sections, with full mobile + reduced-motion fallbacks.

**Architecture:** Three.js / React Three Fiber renders a single full-screen fragment-shader pass that raymarches a noise-displaced sphere SDF; the orb pauses when off-screen via Intersection Observer and downgrades to a static SVG below 768px or when `prefers-reduced-motion: reduce`. Lenis wraps the document body for smooth scroll (disabled under reduced-motion). A small GSAP ScrollTrigger-backed `<Reveal>` primitive fades and translates content sections in as they enter the viewport.

**Tech Stack:** three@0.171, @react-three/fiber@9, @react-three/drei@10, lenis@1.3, gsap@3.13. All client-only; lazy-loaded via `next/dynamic` so SSR is unaffected.

---

## File Structure

| File | Responsibility |
|---|---|
| `components/three/orbShader.ts` | GLSL vertex + fragment as TS string exports |
| `components/three/HeroOrbCanvas.tsx` | R3F `<Canvas>` mounting a fullscreen `ShaderMaterial` quad; mouse parallax; IO pause |
| `components/three/HeroBackground.tsx` | Container deciding canvas vs static SVG fallback (mobile/reduced-motion) |
| `components/three/HeroOrbFallback.tsx` | Pure CSS/SVG gradient orb shown on mobile + reduced-motion |
| `components/scroll/SmoothScrollProvider.tsx` | Mounts Lenis on body; pauses on reduced-motion |
| `components/scroll/Reveal.tsx` | Wraps children, GSAP ScrollTrigger fade-in-up |
| `lib/motion/useReducedMotion.ts` | Hook that reads `prefers-reduced-motion` |
| `components/home/Hero.tsx` | **Modify**: replace static gradient div with `<HeroBackground />` |
| `app/layout.tsx` | **Modify**: mount `<SmoothScrollProvider>` |
| `app/page.tsx` | **Modify**: wrap below-fold sections in `<Reveal>` |
| `tests/e2e/hero-webgl.spec.ts` | E2E: canvas mounts; reduced-motion path renders SVG instead |

---

### Task 3.1: Install dependencies

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install runtime deps**

```bash
cd /Users/siddharthagrawal/portfolio && pnpm add three@^0.171.0 @react-three/fiber@^9.1.0 @react-three/drei@^10.0.0 lenis@^1.3.4 gsap@^3.13.0
```

Expected: 5 packages added.

- [ ] **Step 2: Install three's TS types**

```bash
cd /Users/siddharthagrawal/portfolio && pnpm add -D @types/three@^0.171.0
```

- [ ] **Step 3: Verify build is clean before any code change**

Run: `pnpm build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add package.json pnpm-lock.yaml && git commit -m "$(cat <<'EOF'
chore(deps): add three, R3F, drei, lenis, gsap for Phase 3

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

### Task 3.2: Reduced-motion hook

**Files:**
- Create: `lib/motion/useReducedMotion.ts`
- Test: `lib/motion/useReducedMotion.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `lib/motion/useReducedMotion.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "./useReducedMotion";

function mockMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  const mql = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_t: string, l: (e: MediaQueryListEvent) => void) =>
      listeners.push(l),
    removeEventListener: () => undefined,
    onchange: null,
    dispatchEvent: () => true,
    addListener: () => undefined,
    removeListener: () => undefined,
  } as unknown as MediaQueryList;
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => mql),
  );
  return {
    fire: (next: boolean) => {
      (mql as unknown as { matches: boolean }).matches = next;
      listeners.forEach((l) => l({ matches: next } as MediaQueryListEvent));
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("useReducedMotion", () => {
  it("returns false when system prefers motion", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when system prefers reduce", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when preference changes", () => {
    const ctl = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => ctl.fire(true));
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/motion/useReducedMotion.test.tsx`
Expected: FAIL with "Cannot find module './useReducedMotion'".

- [ ] **Step 3: Implement**

Create `lib/motion/useReducedMotion.ts`:

```ts
"use client";

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/motion/useReducedMotion.test.tsx`
Expected: 3 pass.

- [ ] **Step 5: Install missing test dep if needed**

If the hook test reports "Cannot find module '@testing-library/react'", run:

```bash
cd /Users/siddharthagrawal/portfolio && pnpm add -D @testing-library/react@^16.3.0
```

Then re-run the test.

- [ ] **Step 6: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add lib/motion package.json pnpm-lock.yaml && git commit -m "$(cat <<'EOF'
feat(motion): useReducedMotion hook

Reactive media-query hook (prefers-reduced-motion: reduce) used by
the WebGL canvas, Lenis provider, and Reveal primitive to gate
animation.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

### Task 3.3: SmoothScrollProvider (Lenis)

**Files:**
- Create: `components/scroll/SmoothScrollProvider.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create SmoothScrollProvider**

Create `components/scroll/SmoothScrollProvider.tsx`:

```tsx
"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export function SmoothScrollProvider() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduced]);

  return null;
}
```

- [ ] **Step 2: Mount in layout**

Edit `app/layout.tsx`. After the import line for `SiteNav`, add:

```tsx
import { SmoothScrollProvider } from "@/components/scroll/SmoothScrollProvider";
```

Inside `<Providers>` after `<AdminBar />`, add `<SmoothScrollProvider />`:

```tsx
<Providers>
  <AdminBar />
  <SmoothScrollProvider />
  <SiteNav />
  {children}
</Providers>
```

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add components/scroll app/layout.tsx && git commit -m "$(cat <<'EOF'
feat(scroll): Lenis smooth-scroll provider

Mounts Lenis on the body with a smooth ease curve. Disabled when
prefers-reduced-motion: reduce is set. RAF lifecycle cleaned up on
unmount.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

### Task 3.4: Reveal primitive (GSAP ScrollTrigger)

**Files:**
- Create: `components/scroll/Reveal.tsx`

- [ ] **Step 1: Create Reveal**

Create `components/scroll/Reveal.tsx`:

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        },
      );
    });
    return () => ctx.revert();
  }, [delay, y, reduced]);

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add components/scroll/Reveal.tsx && git commit -m "$(cat <<'EOF'
feat(scroll): Reveal primitive (GSAP ScrollTrigger fade-in-up)

Wraps any children in a fade + translate-Y reveal triggered when the
element reaches 85% of the viewport. Reduced-motion users get the
final state immediately.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

### Task 3.5: HeroOrbFallback (mobile + reduced-motion SVG)

**Files:**
- Create: `components/three/HeroOrbFallback.tsx`

- [ ] **Step 1: Implement**

Create `components/three/HeroOrbFallback.tsx`:

```tsx
export function HeroOrbFallback() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-[55%] top-[35%] -z-10 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[60px]"
      style={{
        background:
          "conic-gradient(from 120deg, #7c3aed, #06b6d4, #f472b6, #7c3aed)",
      }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add components/three/HeroOrbFallback.tsx && git commit -m "$(cat <<'EOF'
feat(three): static SVG/CSS hero orb fallback

Used on mobile (<768px) and when prefers-reduced-motion: reduce is
set. Visually equivalent to the previous Phase 2 stand-in.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

### Task 3.6: Volumetric raymarched orb shader

**Files:**
- Create: `components/three/orbShader.ts`

- [ ] **Step 1: Create shader strings**

Create `components/three/orbShader.ts`:

```ts
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

  // --- Palette: violet → cyan → pink ---
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add components/three/orbShader.ts && git commit -m "$(cat <<'EOF'
feat(three): volumetric raymarched orb shaders

Vertex passes a fullscreen quad. Fragment raymarches a noise-displaced
sphere SDF (FBM, 5 octaves), shades with normal-based diffuse + Fresnel
rim, samples a violet→cyan→pink cosine palette, and accumulates
volumetric haze along the ray. Mouse parallax via uMouse uniform.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

### Task 3.7: HeroOrbCanvas (R3F mount + IO pause)

**Files:**
- Create: `components/three/HeroOrbCanvas.tsx`

- [ ] **Step 1: Implement**

Create `components/three/HeroOrbCanvas.tsx`:

```tsx
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { orbFragment, orbVertex } from "./orbShader";

function OrbMesh({ paused }: { paused: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const targetMouse = useRef(new THREE.Vector2(0, 0));
  const currentMouse = useRef(new THREE.Vector2(0, 0));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    // size is updated via useEffect below; intentionally exclude
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      targetMouse.current.set(x, y);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, dt) => {
    if (paused) return;
    uniforms.uTime.value += dt;
    currentMouse.current.lerp(targetMouse.current, Math.min(1, dt * 4));
    uniforms.uMouse.value.copy(currentMouse.current);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={orbVertex}
        fragmentShader={orbFragment}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
}

export function HeroOrbCanvas() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false }}
        camera={{ position: [0, 0, 1] }}
        frameloop={visible ? "always" : "never"}
      >
        <OrbMesh paused={!visible} />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Verify it imports cleanly**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add components/three/HeroOrbCanvas.tsx && git commit -m "$(cat <<'EOF'
feat(three): HeroOrbCanvas — R3F mount with IO pause

Single fullscreen plane + ShaderMaterial; dpr capped at 1.5; antialias
off; depthWrite off (background-only). Pointer parallax lerped onto
uMouse. IntersectionObserver flips frameloop to "never" when off-screen
to free GPU when scrolled past.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

### Task 3.8: HeroBackground container (dynamic + fallback)

**Files:**
- Create: `components/three/HeroBackground.tsx`

- [ ] **Step 1: Implement**

Create `components/three/HeroBackground.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { HeroOrbFallback } from "./HeroOrbFallback";

const HeroOrbCanvas = dynamic(
  () => import("./HeroOrbCanvas").then((m) => m.HeroOrbCanvas),
  { ssr: false, loading: () => <HeroOrbFallback /> },
);

export function HeroBackground() {
  const reduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  if (reduced || isMobile) return <HeroOrbFallback />;
  return <HeroOrbCanvas />;
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add components/three/HeroBackground.tsx && git commit -m "$(cat <<'EOF'
feat(three): HeroBackground container with mobile + reduced-motion fallback

Lazy-loads HeroOrbCanvas via next/dynamic (ssr: false) so three.js
never ships in the SSR bundle. Renders the static SVG fallback below
768px or under prefers-reduced-motion. Loading state also uses the
fallback so there is no flash of empty canvas.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

### Task 3.9: Wire HeroBackground into Hero + Reveals on home

**Files:**
- Modify: `components/home/Hero.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace static gradient stand-in in Hero**

Edit `components/home/Hero.tsx`. Add this import below the EditableText import:

```tsx
import { HeroBackground } from "@/components/three/HeroBackground";
```

Replace the static gradient block:

```tsx
      {/* Static gradient stand-in for the future WebGL orb (Phase 3). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[55%] top-[35%] -z-10 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[60px]"
        style={{
          background:
            "conic-gradient(from 120deg, #7c3aed, #06b6d4, #f472b6, #7c3aed)",
        }}
      />
```

with:

```tsx
      <HeroBackground />
```

- [ ] **Step 2: Wrap below-fold sections in Reveal**

Replace `app/page.tsx` with:

```tsx
import { Hero } from "@/components/home/Hero";
import { HeroCaseStudiesPlaceholder } from "@/components/home/HeroCaseStudiesPlaceholder";
import { ProjectGridPlaceholder } from "@/components/home/ProjectGridPlaceholder";
import { AboutPreviewPlaceholder } from "@/components/home/AboutPreviewPlaceholder";
import { ContactCTA } from "@/components/home/ContactCTA";
import { Reveal } from "@/components/scroll/Reveal";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Reveal>
        <HeroCaseStudiesPlaceholder />
      </Reveal>
      <Reveal>
        <ProjectGridPlaceholder />
      </Reveal>
      <Reveal>
        <AboutPreviewPlaceholder />
      </Reveal>
      <Reveal>
        <ContactCTA />
      </Reveal>
    </>
  );
}
```

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add components/home/Hero.tsx app/page.tsx && git commit -m "$(cat <<'EOF'
feat(home): mount HeroBackground + Reveal scroll choreography

Hero now renders the volumetric raymarched orb (or SVG fallback on
mobile / reduced-motion). The four below-fold sections fade and
translate up as they enter the viewport.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

### Task 3.10: E2E — canvas mounts; reduced-motion path uses fallback

**Files:**
- Create: `tests/e2e/hero-webgl.spec.ts`
- Modify: `tests/e2e/smoke.spec.ts` (no change expected; verifying)

- [ ] **Step 1: Create the spec**

Create `tests/e2e/hero-webgl.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("hero mounts a webgl canvas in default mode", async ({ page }) => {
  await page.goto("/");
  // Canvas appears once dynamic import resolves
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible({ timeout: 10000 });
  // Sanity: canvas has a non-zero size
  const box = await canvas.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(100);
  expect(box?.height ?? 0).toBeGreaterThan(100);
});

test("reduced-motion users see no canvas", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  // Give the dynamic import time to resolve before asserting absence
  await page.waitForLoadState("networkidle");
  await expect(page.locator("canvas")).toHaveCount(0);
  await context.close();
});

test("no console errors on home page load", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors, errors.join("\n")).toEqual([]);
});
```

- [ ] **Step 2: Run E2E**

Run: `pnpm test:e2e`
Expected: 6 passed (smoke 1 + home-edit 2 + hero-webgl 3).

- [ ] **Step 3: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add tests/e2e/hero-webgl.spec.ts && git commit -m "$(cat <<'EOF'
test(e2e): WebGL hero canvas + reduced-motion fallback + no console errors

Three Playwright assertions: canvas mounts at non-zero size in default
mode, the canvas is absent when reducedMotion: reduce is set, and the
home page loads with zero pageerrors / console.error.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)" && git push
```

---

### Task 3.11: Tag the milestone

- [ ] **Step 1: Verify Vercel deploy is green**

Run: `npx vercel ls 2>&1 | head -5`
Expected: most-recent deploy `● Ready`.

- [ ] **Step 2: Tag**

```bash
cd /Users/siddharthagrawal/portfolio && git tag -a phase-3-complete -m "Phase 3 complete: WebGL hero + Lenis + Reveal scroll choreography" && git push --tags
```

---

## Self-review

**Spec coverage (against `docs/specs/2026-05-08-portfolio-design.md`):**
- §4 visual direction — volumetric WebGL orb (Task 3.6/3.7), conic palette via cosine palette in shader, mouse parallax (Task 3.7), bloom approximated via volumetric haze in shader. ✓
- §4 reduced-motion — Lenis disabled (Task 3.3), orb frozen via fallback (Task 3.8). ✓
- §4 mobile — `<768px` downgrades to static SVG (Task 3.8). ✓
- §5 architecture — R3F + Lenis + GSAP all integrated (Tasks 3.1, 3.3, 3.4, 3.7). ✓
- §8 components — `HeroOrbScene` (renamed `HeroOrbCanvas`), `SmoothScrollProvider`, scroll wrapper. `ScrollScene` deferred to Phase 5 per the brainstorm. ✓
- §11 perf — dpr capped at 1.5, canvas paused via IO when off-screen (Task 3.7). ✓
- §11 reduced-motion — covered above. ✓
- §13 phase 3 — WebGL hero ✓, Lenis ✓, scroll choreography ✓ (simple Reveal; full pinned sequences in Phase 5), sticky pill already done in Phase 2.

**Gaps logged for follow-up plans:**
- Phase 5: pinned ScrollTrigger sequences (horizontal scrub case-study cards), `ScrollScene` primitive that wraps a section in pinning + progress.
- Phase 9: Lighthouse perf audit; tune `dpr` cap and shader iterations on mid-tier mobile.

**Placeholder scan:** All code blocks contain real, runnable code. Shader is fully written. No "TBD"/"add error handling" / "TODO". The fallback in Task 3.5 is a verbatim copy of the Phase 2 stand-in (intentionally — it is the same fallback the spec mandates).

**Type consistency:**
- `useReducedMotion(): boolean` (Task 3.2) — used in Tasks 3.3, 3.4, 3.8 with the same signature.
- `Reveal` props `{ children, delay?, y? }` (Task 3.4) — wrapped sections in 3.9 use the default-only form.
- `HeroBackground` (no props, Task 3.8) — rendered without props in 3.9.
- `orbVertex` / `orbFragment` (Task 3.6) — imported by Task 3.7.

**Known limitations:**
- Shader is a single-iteration baseline. Visual tuning (palette, displacement amplitude, density) is expected after seeing it run; tweak constants in `orbShader.ts`.
- No bloom post-process pass; haze is faked in fragment. If quality demands it, add `EffectComposer + UnrealBloomPass` from `@react-three/postprocessing` in a follow-up.
- `gsap` and `gsap/ScrollTrigger` are eagerly imported in `Reveal.tsx`. If bundle budget tightens, switch to dynamic import.

---

## Execution handoff

**Plan complete and saved to `docs/plans/2026-05-09-phase-3-webgl-hero.md`.**

User-approved choices in this plan:
- Volumetric raymarched orb (max quality)
- Lenis + Reveal-on-scroll only this phase (pinned sequences deferred to Phase 5)
- All implementer + reviewer subagents → Opus + ultrathink (per saved memory)
- GitHub-first deploy; Vercel auto-deploys (per saved memory)
- Run all 11 tasks straight through, no per-task confirmation (per saved memory)
