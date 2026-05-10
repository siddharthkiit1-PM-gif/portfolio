"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
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
  const parts = parseCountUpValue(value);

  // When reduced motion is on, or the value contains no digits, render the
  // final string immediately and skip the observer entirely.
  const skipAnimation = reduced || parts.number === 0;
  const [display, setDisplay] = useState<string>(() =>
    skipAnimation ? value : `${parts.prefix}0${parts.suffix}`,
  );

  useEffect(() => {
    if (skipAnimation) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;

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
    // value, durationMs, delayMs, threshold are stable per-mount in our
    // call sites; intentionally excluding them keeps the animation from
    // restarting on parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipAnimation]);

  return { ref, display };
}
