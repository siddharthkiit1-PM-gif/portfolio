"use client";

import { forwardRef } from "react";

type Props = { defaultLabel: string };

export const HeroChapterLabel = forwardRef<HTMLDivElement, Props>(
  function HeroChapterLabel({ defaultLabel }, ref) {
    return (
      <div
        ref={ref}
        className="text-[11px] tracking-[0.3em] text-white/50"
        style={{ willChange: "contents" }}
      >
        {defaultLabel}
      </div>
    );
  },
);
