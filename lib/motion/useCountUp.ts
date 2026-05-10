"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "./useReducedMotion";

export type CountUpParts = {
  /** Non-numeric leading characters, e.g. "$" or "+" or "-". */
  prefix: string;
  /** The integer value to count up to. */
  number: number;
  /** Non-numeric trailing characters, e.g. "K" or "%". */
  suffix: string;
};

/**
 * Splits a display value like `"$500K"` into `{ prefix, number, suffix }`.
 * If no digits are present the entire string is returned as `prefix` and
 * `number` is 0 — the caller can then decide to skip the count animation.
 *
 * Note: thousands separators are not stripped. A value like `"1,200"` parses
 * as `{ prefix: "", number: 1, suffix: ",200" }` since the regex stops at the
 * first non-digit run after the leading digits.
 */
export function parseCountUpValue(value: string): CountUpParts {
  const match = value.match(/^([^\d]*)(\d+)(.*)$/);
  if (!match) {
    return { prefix: value, number: 0, suffix: "" };
  }
  return {
    prefix: match[1],
    number: parseInt(match[2], 10),
    suffix: match[3],
  };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export type UseCountUpOptions = {
  /** Animation duration in ms. Default 1200. */
  durationMs?: number;
  /** Delay before the animation starts (after first intersection). Default 0. */
  delayMs?: number;
  /** Intersection ratio that triggers the animation. Default 0.6. */
  threshold?: number;
};

export type UseCountUpResult<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  /** Current display string, e.g. "$237K" mid-animation. */
  display: string;
};

/**
 * IntersectionObserver-triggered count-up. Returns a ref to attach to the
 * element being observed and the current `display` string. Fires once on
 * first intersection and disconnects afterwards. Reduced-motion users skip
 * the animation and see the final value immediately.
 */
export function useCountUp<T extends HTMLElement = HTMLElement>(
  value: string,
  options: UseCountUpOptions = {},
): UseCountUpResult<T> {
  const { durationMs = 1200, delayMs = 0, threshold = 0.6 } = options;
  const reduced = useReducedMotion();
  const ref = useRef<T | null>(null);
  const parts = useMemo(() => parseCountUpValue(value), [value]);

  // Skip the animation when reduced motion is on, when the value contains
  // no digits, or when the target is 0.
  const skipAnimation = reduced || parts.number === 0;
  // Initialize to the full value so SSR/first paint renders the real string
  // (better for SEO/scrapers, and avoids a one-frame "$0K" flash for
  // reduced-motion users before `useReducedMotion` flips post-mount).
  const [display, setDisplay] = useState<string>(value);

  useEffect(() => {
    if (skipAnimation) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;

    // Reset to the "0" representation before wiring up the observer so the
    // animation starts from zero rather than from the full value.
    setDisplay(`${parts.prefix}0${parts.suffix}`);

    let rafId = 0;
    let startTimeoutId: number | undefined;
    let started = false;
    const finalDisplay = `${parts.prefix}${parts.number}${parts.suffix}`;

    const start = () => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startedAt;
        const t = Math.min(1, elapsed / durationMs);
        const current = Math.round(easeOutCubic(t) * parts.number);
        setDisplay(`${parts.prefix}${current}${parts.suffix}`);
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          setDisplay(finalDisplay);
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started) {
            started = true;
            observer.disconnect();
            startTimeoutId = window.setTimeout(start, delayMs);
            return;
          }
        }
      },
      { threshold },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (startTimeoutId !== undefined) window.clearTimeout(startTimeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
    // Re-run when `value` or any animation option changes. This is the
    // desired behavior for live admin edits: a new target value should
    // restart the count-up animation against the fresh parts.
  }, [skipAnimation, value, parts, durationMs, delayMs, threshold]);

  return { ref, display };
}
