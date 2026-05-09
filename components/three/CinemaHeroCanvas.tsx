"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, DepthOfField, Vignette, Noise, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";
import { cinemaOrbFragment, cinemaOrbVertex } from "./cinemaOrbShader";
import type { DeviceTier } from "@/lib/motion/useDeviceTier";
import { downgradeTier } from "@/lib/motion/useDeviceTier";
import { HeroOrbFallback } from "./HeroOrbFallback";

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    // Swallow; fallback rendered below.
  }
  render() {
    if (this.state.hasError) return <HeroOrbFallback />;
    return this.props.children;
  }
}

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

type CanvasProps = {
  tier: Exclude<DeviceTier, "static">;
  morphRef: React.MutableRefObject<number>;
  paletteShiftRef: React.MutableRefObject<number>;
  paused: boolean;
};

function OrbMesh({ tier, morphRef, paletteShiftRef, paused }: CanvasProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const targetPointer = useRef(new THREE.Vector2(0, 0));
  const currentPointer = useRef(new THREE.Vector2(0, 0));

  const portraitMask = useLoader(TextureLoader, "/portrait/portrait-mask-512.png");
  useEffect(() => {
    portraitMask.minFilter = THREE.LinearFilter;
    portraitMask.magFilter = THREE.LinearFilter;
    portraitMask.wrapS = THREE.ClampToEdgeWrapping;
    portraitMask.wrapT = THREE.ClampToEdgeWrapping;
  }, [portraitMask]);

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

  const fragment = useMemo(() => buildFragment(tier), [tier]);

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      targetPointer.current.set(x, y);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

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

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={cinemaOrbVertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
}

export type CinemaHeroCanvasProps = {
  tier: Exclude<DeviceTier, "static">;
  morphRef: React.MutableRefObject<number>;
  paletteShiftRef: React.MutableRefObject<number>;
};

export function CinemaHeroCanvas({ tier, morphRef, paletteShiftRef }: CinemaHeroCanvasProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [resolvedTier, setResolvedTier] = useState<DeviceTier>(tier);

  useEffect(() => setResolvedTier(tier), [tier]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "200px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 1s FPS probe; downgrade if avg dt > tier budget
  useEffect(() => {
    const budget = resolvedTier === "high" ? 18 : resolvedTier === "mid" ? 25 : 36; // ms
    let frames = 0;
    let total = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      total += now - last;
      last = now;
      frames++;
      if (total < 1000) {
        raf = requestAnimationFrame(loop);
      } else {
        const avg = total / frames;
        if (avg > budget) {
          const next = downgradeTier(resolvedTier);
          if (next !== resolvedTier) setResolvedTier(next);
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [resolvedTier]);

  if (resolvedTier === "static") return null;

  const dprCap =
    resolvedTier === "high" ? ([1, 1.5] as [number, number]) :
    resolvedTier === "mid"  ? ([1, 1.25] as [number, number]) :
                              ([1, 1] as [number, number]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
    >
      <CanvasErrorBoundary>
        <Canvas
          dpr={dprCap}
          gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 1] }}
          frameloop={visible ? "always" : "never"}
          onCreated={({ gl }) => {
            // Guard against null context attributes (older Safari, GPU sandboxing,
            // second-mount in Chromium) which crash EffectComposer's alpha read.
            if (gl.getContextAttributes() == null) {
              throw new Error("WebGL context attributes unavailable");
            }
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              downgradeTier(resolvedTier);
              setResolvedTier("static");
            });
          }}
        >
          <OrbMesh tier={resolvedTier} morphRef={morphRef} paletteShiftRef={paletteShiftRef} paused={!visible} />
          {resolvedTier !== "low" && (
            <EffectComposer>
              <Bloom
                intensity={resolvedTier === "high" ? 1.05 : 0.6}
                luminanceThreshold={0.55}
                luminanceSmoothing={0.25}
                mipmapBlur
              />
              {resolvedTier === "high" ? (
                <DepthOfField focusDistance={0.0} focalLength={0.02} bokehScale={3} />
              ) : <></>}
              {resolvedTier === "high" ? (
                <ChromaticAberration
                  blendFunction={BlendFunction.NORMAL}
                  offset={[0.0008, 0.0012]}
                  radialModulation={false}
                  modulationOffset={0}
                />
              ) : <></>}
              <Vignette eskil={false} offset={0.18} darkness={0.85} />
              <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={resolvedTier === "high" ? 0.12 : 0.08} />
            </EffectComposer>
          )}
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
