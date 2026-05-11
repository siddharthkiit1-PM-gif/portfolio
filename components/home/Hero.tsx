"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableText } from "@/components/editable/EditableText";
import { HeroPinController } from "./HeroPinController";
import { HeroResponsiveLayout } from "./HeroResponsiveLayout";
import { HeroChapterLabel } from "./HeroChapterLabel";
import { ChromaticText } from "./ChromaticText";
import { FlowingGradientText } from "./FlowingGradientText";
import { HeroRecruiterRail } from "./HeroRecruiterRail";
import { useDeviceTier } from "@/lib/motion/useDeviceTier";
import { useViewportClass } from "@/lib/motion/useViewportClass";

/**
 * Hero — cinema without the nebula.
 *
 * Scroll-pinned chromatic + flowing-gradient typography over a calm
 * CSS backdrop (deep navy + a single soft cool vignette + a faint
 * hairline grid). The WebGL orb / constellation / bloom stack has
 * been retired so the scroll feels lighter and the chromatic split
 * is the only effect carrying the cinematic weight.
 *
 * Layout: cinematic copy column on the left (chapter label → headline →
 * kinetic line → name climax → subline → CTAs), static HeroRecruiterRail
 * on the right (monogram + recruiter pitch + contact strip). The rail
 * does not animate with the scroll — it's the calm scan target a recruiter
 * can read from frame 0. ExperienceSection now lives as a separate sibling
 * section on app/page.tsx, no longer inside the hero pin.
 */
const DEFAULT_CALENDLY = "https://calendly.com/siddharth-kiit1/30min";

export function Hero() {
  const tier = useDeviceTier();
  const viewport = useViewportClass();
  const contacts = useQuery(api.siteContacts.get, {});
  const calendlyUrl = contacts?.calendlyUrl ?? DEFAULT_CALENDLY;

  // Kept for plumbing compatibility with HeroPinController; no orb to drive.
  const warpRef = useRef(0);

  const rootRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const kineticLineRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const statusPillRef = useRef<HTMLDivElement>(null);
  const chapterLabelRef = useRef<HTMLDivElement>(null);

  // Cinema choreography only runs when the viewport can actually contain it.
  //  - Phone: pin spacer + scroll-driven type freeze mid-scroll on touch.
  //  - Tablet: the rail stacks above the copy and the pinned 100dvh frame
  //    can't fit both blocks → bottom content clips.
  //  - Short laptops (< 720px tall): even the desktop two-column layout
  //    overflows the pinned 100dvh frame → CTAs / status pill get cut.
  // When cinema is off, the hero degrades to a normal stacked section and
  // the chromatic + gradient type fall back to clean static styling via
  // their CSS @property initial values.
  const [tallEnough, setTallEnough] = useState(true);
  useEffect(() => {
    const probe = () => setTallEnough(window.innerHeight >= 720);
    probe();
    window.addEventListener("resize", probe);
    return () => window.removeEventListener("resize", probe);
  }, []);
  const cinemaActive = viewport === "desktop" && tier !== "static" && tallEnough;

  const copy = (
    <div className="max-w-[640px]">
      <HeroChapterLabel ref={chapterLabelRef} defaultLabel="PRODUCT MANAGER · BUILDER · 2018 — NOW" />

      <h1
        ref={headlineRef}
        className="mt-[clamp(8px,1.4vh,18px)] text-[40px] leading-[1.05] tracking-[-1.5px] sm:text-[52px] lg:text-[clamp(40px,5.6vh,56px)] lg:tracking-[-2px] text-white"
        style={{
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 300,
          fontVariationSettings: '"wght" var(--ka-wght, 320)',
        }}
      >
        <ChromaticText amount={0.35}>
          <EditableText page="home" slot="hero.headlineTop" fallback="I build products" as="span" singleLine />
        </ChromaticText>
        <br />
        <em className="not-italic" style={{ fontWeight: 500, fontVariationSettings: '"wght" calc(var(--ka-wght, 320) + 200)' }}>
          <FlowingGradientText>
            <EditableText page="home" slot="hero.headlineBottom" fallback="customers actually use." as="span" singleLine />
          </FlowingGradientText>
        </em>
      </h1>

      <div
        ref={kineticLineRef}
        className="mt-[clamp(8px,1.4vh,18px)] text-[28px] leading-tight tracking-[-1px] text-white/85 sm:text-[32px] lg:text-[clamp(28px,4vh,40px)]"
        style={{
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 300,
          fontVariationSettings: '"wght" var(--ka-wght, 300)',
        }}
      >
        Build across{" "}
        <FlowingGradientText gradient="linear-gradient(90deg, #a78bfa 0%, #22d3ee 50%, #f472b6 100%)">
          <span style={{ fontWeight: 600 }}>Data</span>
        </FlowingGradientText>
        ,{" "}
        <FlowingGradientText gradient="linear-gradient(90deg, #22d3ee 0%, #a78bfa 50%, #f472b6 100%)">
          <span style={{ fontWeight: 600 }}>AI</span>
        </FlowingGradientText>
        , and{" "}
        <FlowingGradientText gradient="linear-gradient(90deg, #f472b6 0%, #a78bfa 50%, #22d3ee 100%)">
          <span style={{ fontWeight: 600 }}>users</span>
        </FlowingGradientText>
        .
      </div>

      <h2
        ref={nameRef}
        className="mt-[clamp(8px,1.4vh,18px)] text-[40px] leading-none tracking-[-1.5px] text-white sm:text-[56px] lg:text-[clamp(48px,min(6.5vw,9vh),68px)] lg:tracking-[-3px]"
        style={{
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 300,
          fontVariationSettings: '"wght" var(--ka-wght, 300)',
        }}
      >
        <ChromaticText amount={0.25}>Siddharth</ChromaticText>{" "}
        <ChromaticText amount={0.5}>
          <span style={{ fontWeight: 500 }}>
            <FlowingGradientText>Agrawal.</FlowingGradientText>
          </span>
        </ChromaticText>
      </h2>

      <p ref={sublineRef} className="mt-[clamp(8px,1.4vh,18px)] max-w-[560px] text-sm font-light leading-[1.5] text-white/75 lg:text-base">
        <EditableText page="home" slot="hero.subtext" fallback="PM crafting products at the intersection of Data, AI, and users." as="span" />
      </p>

      <div ref={ctaGroupRef} className="mt-[clamp(12px,2vh,20px)] flex flex-col gap-3 sm:flex-row sm:items-center">
        <a href="#work" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black text-center sm:text-left">
          <EditableText page="home" slot="hero.ctaPrimary" fallback="View AI projects →" as="span" singleLine />
        </a>
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/20 px-5 py-3 text-sm text-white text-center sm:text-left"
        >
          <EditableText page="home" slot="hero.ctaSecondary" fallback="Book a call" as="span" singleLine />
        </a>
        <div ref={statusPillRef} className="ml-0 inline-flex items-center gap-2 text-xs text-white/50 sm:ml-3">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <EditableText page="home" slot="hero.statusPill" fallback="Open to PM roles" as="span" singleLine />
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
      {/* Quiet backdrop — no WebGL. A single cool vignette where the orb used
          to sit gives depth; a faint hairline grid keeps the dark calm without
          letting it read as flat. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 65% 45%, rgba(64,132,200,0.12) 0%, rgba(64,132,200,0.04) 35%, transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 80px), repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 80px)",
        }}
      />

      <HeroResponsiveLayout
        viewport={viewport}
        silhouette={<HeroRecruiterRail />}
        copy={copy}
      />

      {cinemaActive && (
        <HeroPinController
          tier={tier as "high" | "mid" | "low"}
          viewport={viewport}
          warpRef={warpRef}
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
