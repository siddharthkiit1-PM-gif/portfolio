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
  high: 200,
  mid: 160,
  low: 130,
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
            snapTo: [0, 0.25, 0.5, 0.75, 1],
            duration: { min: 0.2, max: 0.4 },
            delay: 0.05,
            ease: "power2.inOut",
          },
        },
      });

      // 0–25%: character peel + chapter swap
      tl.to(chars, {
        x: () => gsap.utils.random(-60, 90),
        y: () => gsap.utils.random(-30, 30),
        rotation: () => gsap.utils.random(-18, 18),
        opacity: 0.35,
        ease: "power2.out",
        stagger: { each: 0.005, from: "random" },
        duration: 0.25,
      }, 0);
      tl.to(p.chapterLabelRef.current, { textContent: "01 · WHO", duration: 0.05 }, 0.05);
      tl.to(p.ctaGroupRef.current, { opacity: 0, duration: 0.15 }, 0.05);
      tl.to(p.statusPillRef.current, { opacity: 0, duration: 0.15 }, 0.05);

      // 0–50%: shader morph 0 → 0.5 + palette violet→cyan→pink (no chrome yet)
      tl.to(morphRef, { current: 0.5, duration: 0.5, ease: "none" }, 0);

      // 25–50%: kinetic line word-by-word
      tl.to(p.kineticLineRef.current, {
        opacity: 1, y: 0,
        duration: 0.25, ease: "power2.out",
      }, 0.25);
      tl.to(p.chapterLabelRef.current, { textContent: "02 · WHAT", duration: 0.05 }, 0.25);

      // 50–75%: morph to portrait + chrome palette
      tl.to(morphRef, { current: 1.0, duration: 0.5, ease: "none" }, 0.5);
      tl.to(paletteShiftRef, { current: 1.0, duration: 0.5, ease: "none" }, 0.5);
      tl.to(p.kineticLineRef.current, { opacity: 0, duration: 0.2 }, 0.55);
      tl.to(p.chapterLabelRef.current, { textContent: "03 · WHO", duration: 0.05 }, 0.55);

      // 75–100%: name coalesce + final settle
      tl.to(p.nameRef.current, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, 0.75);
      tl.to(chars, { opacity: 0, duration: 0.1 }, 0.75);
      tl.to(p.ctaGroupRef.current, { opacity: 1, x: 0, duration: 0.2, stagger: 0.06 }, 0.85);
      tl.to(p.statusPillRef.current, { opacity: 1, duration: 0.15 }, 0.9);
      tl.to(p.chapterLabelRef.current, {
        textContent: "PRODUCT MANAGER · BUILDER · 2018 — NOW",
        duration: 0.05,
      }, 0.95);
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
