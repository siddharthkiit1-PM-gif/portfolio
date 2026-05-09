"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "high" | "mid" | "low" | "static";

function probeWebGL2(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

function readTierOverride(): DeviceTier | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("cinemaTier");
  if (v === "high" || v === "mid" || v === "low" || v === "static") return v;
  return null;
}

function compute(): DeviceTier {
  if (typeof window === "undefined") return "static";

  // Test/debug override: ?cinemaTier=low pins the tier, bypassing the device
  // gates and the post-mount FPS probe. This makes e2e tests deterministic.
  const override = readTierOverride();
  if (override) return override;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  if (!probeWebGL2()) return "static";

  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 4;
  if (mem < 3) return "static";

  const cores = navigator.hardwareConcurrency ?? 4;
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  const isTablet = window.matchMedia("(min-width: 768px)").matches;

  if (isDesktop && cores >= 8 && mem >= 6) return "high";
  if (isTablet) return "mid";
  return "low";
}

const SESSION_KEY = "cinemaTier";

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>("static");

  useEffect(() => {
    // 1. Check sessionStorage for prior downgrade
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored === "high" || stored === "mid" || stored === "low" || stored === "static") {
        setTier(stored);
        return;
      }
    } catch {
      // storage may be blocked; continue
    }
    setTier(compute());
  }, []);

  return tier;
}

export function downgradeTier(current: DeviceTier): DeviceTier {
  const next: DeviceTier =
    current === "high" ? "mid" : current === "mid" ? "low" : "static";
  try {
    sessionStorage.setItem(SESSION_KEY, next);
  } catch {
    // ignore
  }
  return next;
}
