"use client";

import { useRef } from "react";
import { EditableText } from "@/components/editable/EditableText";
import { HeroBackground } from "@/components/three/HeroBackground";
import { HeroPinController } from "./HeroPinController";
import { HeroResponsiveLayout } from "./HeroResponsiveLayout";
import { HeroChapterLabel } from "./HeroChapterLabel";
import { useDeviceTier } from "@/lib/motion/useDeviceTier";
import { useViewportClass } from "@/lib/motion/useViewportClass";

export function Hero() {
  const tier = useDeviceTier();
  const viewport = useViewportClass();

  const morphRef = useRef(0);
  const paletteShiftRef = useRef(0);

  const rootRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const kineticLineRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const statusPillRef = useRef<HTMLDivElement>(null);
  const chapterLabelRef = useRef<HTMLDivElement>(null);

  const cinemaActive = tier !== "static";

  const copy = (
    <div className="max-w-[640px]">
      <HeroChapterLabel ref={chapterLabelRef} defaultLabel="PRODUCT MANAGER · BUILDER · 2018 — NOW" />

      <h1 ref={headlineRef} className="mt-6 text-[44px] leading-[1.05] tracking-[-1.5px] sm:text-[56px] lg:text-[62px] lg:tracking-[-2.5px] font-light text-white">
        <EditableText page="home" slot="hero.headlineTop" fallback="I build products" as="span" singleLine />
        <br />
        <em
          className="not-italic font-normal bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #a78bfa 20%, #22d3ee 60%, #f472b6)" }}
        >
          <EditableText page="home" slot="hero.headlineBottom" fallback="people actually use." as="span" singleLine />
        </em>
      </h1>

      <div ref={kineticLineRef} className="mt-6 text-[36px] leading-tight tracking-[-1px] font-light text-white/85 lg:text-[48px]">
        Built across <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #22d3ee)" }}>AI</span>, health, and consumer.
      </div>

      <h2 ref={nameRef} className="mt-6 text-[44px] leading-none tracking-[-1.5px] font-light text-white sm:text-[64px] lg:text-[96px] lg:tracking-[-3.5px]">
        Siddharth{" "}
        <span className="font-normal bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #a78bfa 20%, #22d3ee 60%, #f472b6)" }}>
          Agrawal.
        </span>
      </h2>

      <p ref={sublineRef} className="mt-6 max-w-[560px] text-base font-light leading-[1.55] text-white/75 lg:text-lg">
        <EditableText page="home" slot="hero.subtext" fallback="PM at the intersection of AI, health, and consumer." as="span" />
      </p>

      <div ref={ctaGroupRef} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a href="#work" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black text-center sm:text-left">
          <EditableText page="home" slot="hero.ctaPrimary" fallback="View selected work →" as="span" singleLine />
        </a>
        <a href="/contact" className="rounded-full border border-white/20 px-5 py-3 text-sm text-white text-center sm:text-left">
          <EditableText page="home" slot="hero.ctaSecondary" fallback="Book a call" as="span" singleLine />
        </a>
        <div ref={statusPillRef} className="ml-0 inline-flex items-center gap-2 text-xs text-white/50 sm:ml-3">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <EditableText page="home" slot="hero.statusPill" fallback="Open to senior PM roles" as="span" singleLine />
        </div>
      </div>
    </div>
  );

  return (
    <section
      ref={rootRef}
      className="relative isolate min-h-[100dvh] overflow-hidden bg-[#05060a] text-white"
      style={{ touchAction: "pan-y" }}
    >
      <HeroBackground morphRef={morphRef} paletteShiftRef={paletteShiftRef} />

      <HeroResponsiveLayout
        viewport={viewport}
        silhouette={<div className="h-full w-full" aria-hidden />}
        copy={copy}
      />

      {cinemaActive && (
        <HeroPinController
          tier={tier as "high" | "mid" | "low"}
          viewport={viewport}
          morphRef={morphRef}
          paletteShiftRef={paletteShiftRef}
          rootRef={rootRef as React.RefObject<HTMLElement>}
          headlineRef={headlineRef as React.RefObject<HTMLElement>}
          kineticLineRef={kineticLineRef as React.RefObject<HTMLElement>}
          nameRef={nameRef as React.RefObject<HTMLElement>}
          sublineRef={sublineRef as React.RefObject<HTMLElement>}
          ctaGroupRef={ctaGroupRef as React.RefObject<HTMLElement>}
          statusPillRef={statusPillRef as React.RefObject<HTMLElement>}
          chapterLabelRef={chapterLabelRef as React.RefObject<HTMLElement>}
        />
      )}

      <div className="absolute bottom-6 left-10 text-[10px] tracking-[0.25em] text-white/45">
        SCROLL ↓ TO ENTER
      </div>
    </section>
  );
}
