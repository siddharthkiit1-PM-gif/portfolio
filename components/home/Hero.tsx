"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableText } from "@/components/editable/EditableText";
import { HeroResponsiveLayout } from "./HeroResponsiveLayout";
import { FlowingGradientText } from "./FlowingGradientText";
import { HeroRecruiterRail } from "./HeroRecruiterRail";
import { useViewportClass } from "@/lib/motion/useViewportClass";

/**
 * Hero — static typography over a calm CSS backdrop.
 *
 * Headline → kinetic line → name → subline → CTAs render statically on
 * every device (no scroll pin, no chromatic split, no GSAP timeline). The
 * only color motion left is the static flowing gradient on highlighted
 * words, which sits at its initial background-position.
 *
 * Layout: copy column on the left, static HeroRecruiterRail on the right
 * (monogram + recruiter pitch + contact strip). ExperienceSection lives
 * as a separate sibling on app/page.tsx.
 */
const DEFAULT_CALENDLY = "https://calendly.com/siddharth-kiit1/30min";

export function Hero() {
  const viewport = useViewportClass();
  const contacts = useQuery(api.siteContacts.get, {});
  const calendlyUrl = contacts?.calendlyUrl ?? DEFAULT_CALENDLY;

  const copy = (
    <div className="max-w-[640px]">
      <h1
        className="text-[40px] leading-[1.05] tracking-[-1.5px] sm:text-[52px] lg:text-[clamp(40px,5.6vh,56px)] lg:tracking-[-2px] text-white"
        style={{
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 300,
        }}
      >
        <EditableText page="home" slot="hero.headlineTop" fallback="I build products" as="span" singleLine />
        <br />
        <em className="not-italic" style={{ fontWeight: 500 }}>
          <FlowingGradientText>
            <EditableText page="home" slot="hero.headlineBottom" fallback="customers actually use." as="span" singleLine />
          </FlowingGradientText>
        </em>
      </h1>

      <div
        className="mt-[clamp(8px,1.4vh,18px)] text-[28px] leading-tight tracking-[-1px] text-white/85 sm:text-[32px] lg:text-[clamp(28px,4vh,40px)]"
        style={{
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 300,
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
        className="mt-[clamp(8px,1.4vh,18px)] text-[40px] leading-none tracking-[-1.5px] text-white sm:text-[56px] lg:text-[clamp(48px,min(6.5vw,9vh),68px)] lg:tracking-[-3px]"
        style={{
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 300,
        }}
      >
        Siddharth{" "}
        <span style={{ fontWeight: 500 }}>
          <FlowingGradientText>Agrawal.</FlowingGradientText>
        </span>
      </h2>

      <p className="mt-[clamp(8px,1.4vh,18px)] max-w-[560px] text-sm font-light leading-[1.5] text-white/75 lg:text-base">
        <EditableText page="home" slot="hero.subtext" fallback="PM crafting products at the intersection of Data, AI, and users." as="span" />
      </p>

      <div className="mt-[clamp(12px,2vh,20px)] flex flex-col gap-3 sm:flex-row sm:items-center">
        <a href="#experience" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black text-center sm:text-left">
          <EditableText page="home" slot="hero.ctaPrimary" fallback="View AI projects →" as="span" singleLine />
        </a>
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/20 px-5 py-3 text-sm text-white text-center sm:text-left"
        >
          <EditableText page="home" slot="hero.ctaSecondary" fallback="Book a meeting with me" as="span" singleLine />
        </a>
        <div className="ml-0 inline-flex items-center gap-2 text-xs text-white/50 sm:ml-3">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <EditableText page="home" slot="hero.statusPill" fallback="Open to PM roles" as="span" singleLine />
        </div>
      </div>
    </div>
  );

  return (
    <section
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

      <div className="absolute bottom-6 left-10 text-[10px] tracking-[0.25em] text-white/45">
        SCROLL ↓ TO ENTER
      </div>
    </section>
  );
}
