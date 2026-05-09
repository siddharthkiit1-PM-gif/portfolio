"use client";

import dynamic from "next/dynamic";
import { useDeviceTier } from "@/lib/motion/useDeviceTier";
import { HeroOrbFallback } from "./HeroOrbFallback";
import type { CinemaHeroCanvasProps } from "./CinemaHeroCanvas";

const CinemaHeroCanvas = dynamic(
  () => import("./CinemaHeroCanvas").then((m) => m.CinemaHeroCanvas),
  { ssr: false, loading: () => <HeroOrbFallback /> },
);

type Props = Omit<CinemaHeroCanvasProps, "tier">;

export function HeroBackground(props: Props) {
  const tier = useDeviceTier();
  if (tier === "static") return <HeroOrbFallback />;
  return <CinemaHeroCanvas tier={tier} {...props} />;
}
