"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Re-align the page to the URL hash after the hero pin and Lenis have set up.
 *
 * When you navigate to `/#work` from another route, the browser scrolls to
 * `#work` against the initial DOM — before GSAP ScrollTrigger pins the hero
 * and inserts its pin-spacing element. The spacer then pushes every section
 * below the hero down by ~1 viewport, so the browser's earlier scroll point
 * now corresponds to whichever section was sitting above ProjectsSection
 * (Experience, in our layout).
 *
 * This component runs once on mount, waits for ScrollTrigger to finish
 * refreshing (which is when pin spacers reach final size), then scrolls
 * the hash target into view at its real position.
 */
export function HashAnchorFix() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const align = () => {
      const el = document.querySelector(hash);
      if (!el) return;
      ScrollTrigger.refresh();
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    // Two passes: one immediately after first paint (catches Reveal mounts)
    // and one after pin spacers are in (~350ms is enough on every device we
    // tested without making the jump feel laggy).
    const t1 = requestAnimationFrame(align);
    const t2 = window.setTimeout(align, 350);

    return () => {
      cancelAnimationFrame(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return null;
}
