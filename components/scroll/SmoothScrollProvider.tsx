"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Lenis + GSAP ScrollTrigger have to be wired together explicitly. Without
 * this, Lenis intercepts the wheel and smooth-animates the page while
 * ScrollTrigger keeps reading native `window.scrollY` (which barely moves) —
 * so every ScrollTrigger downstream of the hero (Reveals, etc.) never fires
 * and the sections below the pin stay at their initial `opacity: 0`.
 *
 * The fix has three parts:
 *   1. Forward Lenis's scroll callback into `ScrollTrigger.update` so
 *      triggers see the smoothed scroll position.
 *   2. Route Lenis's RAF through GSAP's ticker so we have a single RAF
 *      driving both motion systems (avoids drift between the two loops).
 *   3. Disable `lagSmoothing` so GSAP doesn't try to compensate for jank by
 *      time-skipping the smoothed scroll.
 */
export function SmoothScrollProvider() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      // gsap.ticker hands time in seconds; Lenis wants milliseconds.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, [reduced]);

  return null;
}
