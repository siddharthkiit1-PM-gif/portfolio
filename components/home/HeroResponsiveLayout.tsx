"use client";

import type { ViewportClass } from "@/lib/motion/useViewportClass";
import type { ReactNode } from "react";

type Props = {
  viewport: ViewportClass;
  copy: ReactNode;
  /** Optional. When null/undefined, layout collapses to single column. */
  silhouette?: ReactNode;
};

export function HeroResponsiveLayout({ viewport, copy, silhouette }: Props) {
  const hasSilhouette = silhouette !== null && silhouette !== undefined;

  if (viewport === "desktop") {
    if (!hasSilhouette) {
      return (
        <div className="relative flex min-h-[100dvh] items-center px-10">
          <div className="relative z-10 mx-auto w-full max-w-[1100px]">{copy}</div>
        </div>
      );
    }
    return (
      <div className="relative grid h-[100dvh] grid-cols-[minmax(560px,1fr)_minmax(0,1fr)] items-center gap-12 px-10">
        <div className="relative z-10">{copy}</div>
        <div className="relative h-full">{silhouette}</div>
      </div>
    );
  }
  if (viewport === "tablet") {
    return (
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-start gap-10 px-10 pt-16">
        {hasSilhouette && <div className="relative h-[40dvh] w-full">{silhouette}</div>}
        <div className="relative z-10 max-w-[640px]">{copy}</div>
      </div>
    );
  }
  // phone
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-stretch gap-6 px-6 pt-12">
      {hasSilhouette && <div className="relative h-[40dvh] w-full">{silhouette}</div>}
      <div className="relative z-10">{copy}</div>
    </div>
  );
}
