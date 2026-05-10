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
  high: 120,
  mid: 95,
  low: 75,
};

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

export function HeroPinController(p: Props) {
  const warpRef = p.warpRef;
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

      // Music-video text axis state, scoped to the hero <section>:
      //   --ka-split  chromatic-aberration offset in px (number)
      //   --ka-grad   background-position-x for flowing gradients (percentage)
      //   --ka-wght   variable font weight axis driving the breath
      // These are all registered via @property in globals.css so the browser
      // can interpolate them on the compositor without per-frame layout reads.
      gsap.set(root, { "--ka-split": 0, "--ka-grad": "0%", "--ka-wght": 320 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: `+=${pinLength}%`,
          pin: true,
          scrub: 1,
          snap: {
            snapTo: [0, 0.50, 0.85, 1],
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

      // Continuous gradient flow underneath every other beat (0 → 200%).
      // background-size is 300%, so this loops seamlessly through the visible
      // window and keeps the type breathing in color the entire pin.
      tl.fromTo(root, { "--ka-grad": "0%" }, { "--ka-grad": "200%", duration: 1, ease: "none" }, 0);

      // Variable weight breath: 320 (light) → 460 (mid) on the build-up,
      // releasing back to 360 during the resolve so the dwell reads calm.
      tl.to(root, { "--ka-wght": 380, duration: 0.30, ease: "power2.inOut" }, 0.20);
      tl.to(root, { "--ka-wght": 460, duration: 0.30, ease: "expo.inOut" }, 0.50);
      tl.to(root, { "--ka-wght": 360, duration: 0.18, ease: "expo.out" }, 0.80);

      // 20–50%: character peel. Tight ranges so chars NEVER drift far enough
      // to collide with the kinetic line / name lines below. Previous
      // -60..90 / -30..30 / -18..18 caused visible overlap with the next
      // line — looked like a render bug. New ranges keep the peel feeling
      // like a confident shake, not an explosion.
      tl.to(chars, {
        x: () => gsap.utils.random(-20, 30),
        y: () => gsap.utils.random(-10, 10),
        rotation: () => gsap.utils.random(-8, 8),
        opacity: 0.35,
        ease: "expo.out",
        stagger: { each: 0.005, from: "random" },
        duration: 0.28,
      }, 0.20);
      tl.to(p.chapterLabelRef.current, { textContent: "01 · WHO", duration: 0.05 }, 0.25);
      tl.to(p.ctaGroupRef.current, { opacity: 0, duration: 0.15 }, 0.20);
      tl.to(p.statusPillRef.current, { opacity: 0, duration: 0.15 }, 0.20);

      // 20–50%: warp 0 → 0.4 (camera starts pulling forward, gentle stream).
      tl.to(warpRef, { current: 0.4, duration: 0.30, ease: "power2.inOut" }, 0.20);

      // 45–65%: kinetic line reveal (sharper, more theatrical entrance)
      tl.to(p.kineticLineRef.current, {
        opacity: 1, y: 0,
        duration: 0.18, ease: "expo.out",
      }, 0.45);
      tl.to(p.chapterLabelRef.current, { textContent: "02 · WHAT", duration: 0.05 }, 0.47);

      // 50–95%: warp 0.4 → 1.0 (full warp speed; chrome silhouette resolves
      // at the focal point as part of the same uniform curve).
      tl.to(warpRef, { current: 1.0, duration: 0.45, ease: "expo.inOut" }, 0.50);
      // Chromatic split flickers during the warp acceleration — peak ~2px at
      // the moment the kinetic line enters, then settles back near zero so the
      // copy stays clean and readable instead of reading as a typo.
      // Clamped peaks so chromatic ghosts never fan past readable. Previous
      // values (2 and 3) created visible ghost text that read as a render bug;
      // 1.2 and 1.6 keep the cinematic split feel without breaking legibility.
      tl.fromTo(
        root,
        { "--ka-split": 0 },
        { "--ka-split": 1.2, duration: 0.08, ease: "power3.out" },
        0.45,
      );
      tl.to(root, { "--ka-split": 0.25, duration: 0.18, ease: "power2.inOut" }, 0.53);
      // Fade chars out earlier (was 0.75) so the canvas is clean before the
      // kinetic line peaks. With the tighter peel range, chars also no longer
      // need to linger to "tell the story" — the kinetic line takes over.
      tl.to(chars, { opacity: 0, duration: 0.10 }, 0.55);
      tl.to(p.kineticLineRef.current, { opacity: 0, duration: 0.15 }, 0.65);
      tl.to(p.chapterLabelRef.current, { textContent: "03 · YOU", duration: 0.05 }, 0.70);

      // 72–85%: name coalesce — scale anticipation 0.96 → 1 with expo.out
      // gives the type a subtle "snap into focus" feel. The chromatic split
      // pops to ~7px on the impact frame, then resolves clean — like a
      // shutter snapping focus.
      tl.fromTo(
        p.nameRef.current,
        { opacity: 0, y: 20, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.16, ease: "expo.out" },
        0.72,
      );
      // Brief impact pulse on the name — bigger than the headline pulse
      // because the name is the climax, but still well under reading-noise.
      tl.to(root, { "--ka-split": 1.6, duration: 0.05, ease: "power3.out" }, 0.72);
      tl.to(root, { "--ka-split": 0.12, duration: 0.16, ease: "power2.out" }, 0.77);
      // back.out spring on CTA group — small overshoot reads as confidence.
      tl.to(p.ctaGroupRef.current, { opacity: 1, x: 0, duration: 0.16, ease: "back.out(1.4)", stagger: 0.06 }, 0.78);
      tl.to(p.statusPillRef.current, { opacity: 1, duration: 0.10 }, 0.82);

      // 85–100%: DWELL — viewer rests on the resolved identity.
      tl.to(p.chapterLabelRef.current, {
        textContent: "04 · ARC",
        duration: 0.05,
      }, 0.84);
      // Explicit no-op tween keeps the timeline alive through 1.0 so the
      // resolved warp state persists across the full dwell window.
      tl.to(warpRef, { current: 1.0, duration: 0.15, ease: "none" }, 0.85);

      // Subtle parallax drift on the name during dwell — keeps the climax
      // feeling alive instead of frozen, in the spirit of Apple hero shots
      // that always have residual breathing motion.
      tl.fromTo(
        p.nameRef.current,
        { y: 0 },
        { y: -4, duration: 0.15, ease: "sine.inOut" },
        0.86,
      );
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
