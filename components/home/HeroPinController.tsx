"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { DeviceTier } from "@/lib/motion/useDeviceTier";
import type { ViewportClass } from "@/lib/motion/useViewportClass";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

const PIN_VH: Record<Exclude<DeviceTier, "static">, number> = {
  high: 240,
  mid: 190,
  low: 150,
};

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

export function HeroPinController(p: Props) {
  const morphRef = p.morphRef;
  const paletteShiftRef = p.paletteShiftRef;
  const splitRef = useRef<SplitText | null>(null);

  useLayoutEffect(() => {
    const root = p.rootRef.current;
    const headline = p.headlineRef.current;
    if (!root || !headline) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) ScrollTrigger.normalizeScroll(true);

    const split = new SplitText(headline, { type: "chars" });
    splitRef.current = split;
    const chars = split.chars as HTMLElement[];

    const pinLength = PIN_VH[p.tier];

    const ctx = gsap.context(() => {
      // Initial states for elements that animate in mid-pin
      gsap.set(p.kineticLineRef.current, { opacity: 0, y: 20 });
      gsap.set(p.nameRef.current, { opacity: 0, y: 20 });
      gsap.set(p.sublineRef.current, { opacity: 0.78 });
      gsap.set(p.ctaGroupRef.current, { opacity: 1, x: 0 });
      gsap.set(p.statusPillRef.current, { opacity: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: `+=${pinLength}%`,
          pin: true,
          scrub: 1,
          snap: {
            snapTo: [0, 0.20, 0.50, 0.70, 0.85, 1],
            duration: { min: 0.2, max: 0.4 },
            delay: 0.05,
            ease: "power2.inOut",
          },
        },
      });

      // 0–20%: INTRO HOLD — orb breathes calmly, no morph yet. The personal
      // mark stays for a deliberate beat before the cinematic motion starts.
      // morphRef + paletteShiftRef stay at 0 (already their initial value).
      tl.to(p.chapterLabelRef.current, { textContent: "00 · ENTER", duration: 0.05 }, 0);

      // 20–50%: character peel + first morph stage (orb → liquid)
      tl.to(chars, {
        x: () => gsap.utils.random(-60, 90),
        y: () => gsap.utils.random(-30, 30),
        rotation: () => gsap.utils.random(-18, 18),
        opacity: 0.35,
        ease: "power2.out",
        stagger: { each: 0.005, from: "random" },
        duration: 0.28,
      }, 0.20);
      tl.to(p.chapterLabelRef.current, { textContent: "01 · WHO", duration: 0.05 }, 0.25);
      tl.to(p.ctaGroupRef.current, { opacity: 0, duration: 0.15 }, 0.20);
      tl.to(p.statusPillRef.current, { opacity: 0, duration: 0.15 }, 0.20);

      // 20–55%: morph 0 → 0.5 (sphere → capsule, palette stays violet→cyan)
      tl.to(morphRef, { current: 0.5, duration: 0.35, ease: "none" }, 0.20);

      // 45–65%: kinetic line reveal
      tl.to(p.kineticLineRef.current, {
        opacity: 1, y: 0,
        duration: 0.18, ease: "power2.out",
      }, 0.45);
      tl.to(p.chapterLabelRef.current, { textContent: "02 · WHAT", duration: 0.05 }, 0.47);

      // 55–85%: morph 0.5 → 1.0 + chrome palette (capsule → portrait silhouette)
      tl.to(morphRef, { current: 1.0, duration: 0.30, ease: "none" }, 0.55);
      tl.to(paletteShiftRef, { current: 1.0, duration: 0.30, ease: "none" }, 0.55);
      tl.to(p.kineticLineRef.current, { opacity: 0, duration: 0.15 }, 0.65);
      tl.to(p.chapterLabelRef.current, { textContent: "03 · YOU", duration: 0.05 }, 0.70);

      // 72–85%: name coalesce, headline chars fade out
      tl.to(p.nameRef.current, { opacity: 1, y: 0, duration: 0.13, ease: "power2.out" }, 0.72);
      tl.to(chars, { opacity: 0, duration: 0.10 }, 0.75);
      tl.to(p.ctaGroupRef.current, { opacity: 1, x: 0, duration: 0.13, stagger: 0.06 }, 0.78);
      tl.to(p.statusPillRef.current, { opacity: 1, duration: 0.10 }, 0.82);

      // 85–100%: PORTRAIT DWELL — chrome silhouette holds, viewer rests on the
      // resolved identity for ~15% of pin scroll before un-pin. Per user
      // direction: the personal mark (logo / portrait) lingers at the climax.
      tl.to(p.chapterLabelRef.current, {
        textContent: "PRODUCT MANAGER · BUILDER · 2018 — NOW",
        duration: 0.05,
      }, 0.86);
      // Explicit no-op tween keeps the timeline alive through 1.0 so the
      // portrait state persists across the full dwell window.
      tl.to(morphRef, { current: 1.0, duration: 0.15, ease: "none" }, 0.85);
      tl.to(paletteShiftRef, { current: 1.0, duration: 0.15, ease: "none" }, 0.85);
    }, root);

    return () => {
      ctx.revert();
      splitRef.current?.revert();
      splitRef.current = null;
      if (isIOS) ScrollTrigger.normalizeScroll(false);
    };
  }, [p.tier, p.viewport]);

  // imperative refs are mutated by the timeline; re-render not needed
  useEffect(() => undefined, []);

  return null;
}
