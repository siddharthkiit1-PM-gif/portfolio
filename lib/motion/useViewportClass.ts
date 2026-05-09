"use client";

import { useEffect, useState } from "react";

export type ViewportClass = "desktop" | "tablet" | "phone";

function compute(): ViewportClass {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia("(min-width: 1024px)").matches) return "desktop";
  if (window.matchMedia("(min-width: 768px)").matches) return "tablet";
  return "phone";
}

export function useViewportClass(): ViewportClass {
  const [vc, setVc] = useState<ViewportClass>("desktop");

  useEffect(() => {
    setVc(compute());
    const mqDesktop = window.matchMedia("(min-width: 1024px)");
    const mqTablet = window.matchMedia("(min-width: 768px)");
    const onChange = () => setVc(compute());
    mqDesktop.addEventListener("change", onChange);
    mqTablet.addEventListener("change", onChange);
    return () => {
      mqDesktop.removeEventListener("change", onChange);
      mqTablet.removeEventListener("change", onChange);
    };
  }, []);

  return vc;
}
