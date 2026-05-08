"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { HeroOrbFallback } from "./HeroOrbFallback";

const HeroOrbCanvas = dynamic(
  () => import("./HeroOrbCanvas").then((m) => m.HeroOrbCanvas),
  { ssr: false, loading: () => <HeroOrbFallback /> },
);

export function HeroBackground() {
  const reduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  if (reduced || isMobile) return <HeroOrbFallback />;
  return <HeroOrbCanvas />;
}
