"use client";

/**
 * PostFilmHero — static Emergent-style hero for the post-cinematic frame.
 *
 * Reuses the same WebGL orb backdrop (HeroBackground), chromatic text, and
 * flowing-gradient highlights as the live Hero — but rendered as a single
 * static composition with no scroll-pin choreography. Copy is the final
 * frame the cinematic intro lands on:
 *   - "I build products customers actually use."
 *   - "Build across Data, AI, and users."
 *   - "Siddharth Agrawal."
 *
 * Adds a recruiter-grade impact ledger (3 hard numbers from the resume)
 * so the scan path lands on quantified outcomes within ~3 seconds.
 *
 * Mounted at /preview for review before replacing the live Hero.
 */

import { HeroBackground } from "@/components/three/HeroBackground";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";

const METRICS = [
  { value: "$100K", label: "ARR shipped 0 → 1" },
  { value: "+18%", label: "Retention lift" },
  { value: "98%", label: "Ops effort cut via AI" },
];

export function PostFilmHero() {
  // Static cinematic state: gentle chromatic split + a fixed gradient
  // position so the Emergent treatment is visible without scroll.
  const cssVars = {
    ["--ka-split" as string]: "0.6",
    ["--ka-grad" as string]: "60%",
    ["--ka-wght" as string]: "340",
  } as React.CSSProperties;

  return (
    <section
      className="relative isolate min-h-[100dvh] overflow-hidden bg-[#05060a] text-white"
      style={{ ...cssVars, touchAction: "pan-y" }}
    >
      {/* Same WebGL orb backdrop the cinematic film resolves into */}
      <HeroBackground warpRef={{ current: 0 }} />

      {/* Layout container */}
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1280px] items-center px-6 pb-24 pt-28 sm:px-10 lg:pt-24">
        <div className="max-w-[760px]">
          {/* Eyebrow */}
          <div
            className="text-[11px] text-white/55"
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            Product manager · builder · 2018 — now
          </div>

          {/* Headline — chromatic + flowing gradient, mirrors cinematic landing */}
          <h1
            className="mt-6 text-[44px] leading-[1.05] tracking-[-1.5px] text-white sm:text-[56px] lg:text-[64px] lg:tracking-[-2.5px]"
            style={{
              fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 300,
              fontVariationSettings: '"wght" var(--ka-wght, 320)',
            }}
          >
            <ChromaticText amount={0.35}>I build products</ChromaticText>
            <br />
            <em
              className="not-italic"
              style={{
                fontWeight: 500,
                fontVariationSettings: '"wght" calc(var(--ka-wght, 320) + 200)',
              }}
            >
              <FlowingGradientText>customers actually use.</FlowingGradientText>
            </em>
          </h1>

          {/* Domain triplet */}
          <div
            className="mt-6 text-[28px] leading-tight tracking-[-0.5px] text-white/85 sm:text-[36px] lg:text-[44px]"
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

          {/* Name */}
          <h2
            className="mt-8 text-[44px] leading-none tracking-[-1.5px] text-white sm:text-[64px] lg:text-[88px] lg:tracking-[-3px]"
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

          {/* Pitch */}
          <p className="mt-7 max-w-[560px] text-base font-light leading-[1.55] text-white/75 lg:text-lg">
            Engineer-turned-PM, 5+ years in software — currently owning
            technographics & market insights at{" "}
            <span className="text-white/95">6sense</span>; building{" "}
            <span className="text-white/95">healthcoach-ai</span> on the side.
          </p>

          {/* Impact ledger — top PM-style hard numbers */}
          <div className="mt-10 max-w-[640px]">
            <div
              className="text-[10px] text-white/40"
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
              }}
            >
              Selected impact
            </div>
            <div
              aria-hidden
              className="mt-3 h-px w-full"
              style={{ background: "rgba(255,255,255,0.12)" }}
            />
            <dl className="grid grid-cols-3 gap-6 pt-5 sm:gap-10">
              {METRICS.map((m) => (
                <div key={m.label} className="flex flex-col">
                  <dt
                    className="text-[28px] leading-none tracking-[-0.5px] text-white sm:text-[36px] lg:text-[44px]"
                    style={{
                      fontFamily:
                        "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
                      fontWeight: 400,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {m.value}
                  </dt>
                  <dd
                    className="mt-2 text-[10.5px] text-white/55"
                    style={{
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      lineHeight: 1.4,
                    }}
                  >
                    {m.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#work"
              className="rounded-full bg-white px-5 py-3 text-center text-sm font-medium text-black transition-opacity hover:opacity-90 sm:text-left"
            >
              View selected work →
            </a>
            <a
              href="/contact"
              className="rounded-full border border-white/20 px-5 py-3 text-center text-sm text-white transition-colors hover:bg-white/5 sm:text-left"
            >
              Book a call
            </a>
            <div className="ml-0 inline-flex items-center gap-2 text-xs text-white/55 sm:ml-3">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Open to senior PM roles
            </div>
          </div>
        </div>
      </div>

      {/* Bottom cue (no scroll pin — just a quiet hint to the work below) */}
      <div className="absolute bottom-6 left-6 z-10 text-[10px] tracking-[0.25em] text-white/45 sm:left-10">
        ↓ THE WORK
      </div>
    </section>
  );
}
