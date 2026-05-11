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
    // pt is `clamp(16px, 3vh, 64px)` so the top inset breathes on tall
    // displays but collapses on shorter laptop viewports (~700-800px) where
    // the original `pt-[8vh]` was pushing the CTA pills past the visible
    // bottom of the pinned 100dvh frame.
    return (
      <div className="relative grid h-[100dvh] grid-cols-[minmax(560px,1fr)_360px] items-start gap-12 px-10 pt-[clamp(16px,3vh,64px)] xl:gap-16">
        <div className="relative z-10">{copy}</div>
        <div className="relative flex h-full items-center justify-end">{silhouette}</div>
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
  // phone — copy leads, rail follows. The recruiter rail on phone is a
  // secondary scan target; pushing the "I build products" headline below a
  // 40dvh rail block was burying the primary above-the-fold beat. We also
  // drop the fixed-height container so the rail can size to its own content
  // instead of clipping or overflowing inside an h-[40dvh] frame.
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-stretch gap-10 px-6 pt-10 pb-12">
      <div className="relative z-10">{copy}</div>
      {hasSilhouette && <div className="relative w-full">{silhouette}</div>}
    </div>
  );
}
