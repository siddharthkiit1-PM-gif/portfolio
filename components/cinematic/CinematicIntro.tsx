"use client";

import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import gsap from "gsap";
import { CinematicScore } from "./cinematicScore";

const SKIP_KEY = "cinemaIntroSeen";
const B = CinematicScore.BEATS;

type Phase = "gate" | "playing" | "done";

/**
 * CinematicIntro — full-screen autoplay film that sits over the home page
 * for ~22 seconds, then dissolves into the existing scroll experience.
 *
 * Browser autoplay policy gates audio behind a user gesture, so the film
 * opens with a "Press to begin" splash. After the user clicks (or presses
 * Enter), the Tone.js score starts and a GSAP master timeline runs the
 * visual choreography in lockstep with the score's beat timestamps.
 *
 * Returning visitors (sessionStorage marker) and reduced-motion users
 * skip the film entirely.
 */
export function CinematicIntro() {
  const [phase, setPhase] = useState<Phase>("gate");
  const [showGate, setShowGate] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<CinematicScore | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Word DOM refs (populated on render)
  const refs = {
    iWord: useRef<HTMLDivElement>(null),
    buildWord: useRef<HTMLDivElement>(null),
    productsWord: useRef<HTMLDivElement>(null),
    peopleLine: useRef<HTMLDivElement>(null),
    builtAcross: useRef<HTMLDivElement>(null),
    aiWord: useRef<HTMLSpanElement>(null),
    healthWord: useRef<HTMLSpanElement>(null),
    consumerWord: useRef<HTMLSpanElement>(null),
    nameLine: useRef<HTMLDivElement>(null),
    builtBy: useRef<HTMLDivElement>(null),
    chapter: useRef<HTMLDivElement>(null),
    centerDot: useRef<HTMLDivElement>(null),
    glow: useRef<HTMLDivElement>(null),
    leakL: useRef<HTMLDivElement>(null),
    leakR: useRef<HTMLDivElement>(null),
    flash: useRef<HTMLDivElement>(null),
    vignette: useRef<HTMLDivElement>(null),
    skip: useRef<HTMLButtonElement>(null),
  };

  // Decide whether to show the gate at all (sessionStorage + reduced motion).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }
    try {
      if (sessionStorage.getItem(SKIP_KEY) === "1") {
        setPhase("done");
        return;
      }
    } catch {
      // sessionStorage may be blocked; show the gate anyway
    }
    setShowGate(true);
  }, []);

  // Pre-zero every animated element on mount so the gate splash sits on a
  // clean black canvas. Without this, the white flash element (bg-white +
  // mix-blend-mode: screen, default opacity 1) and the light leaks paint
  // the entire viewport white before any GSAP timeline runs.
  useLayoutEffect(() => {
    if (phase !== "gate") return;
    const stage = stageRef.current;
    if (!stage) return;
    gsap.set(stage, { "--ka-grad": "0%", "--ka-split": 0, "--ka-wght": 200 });
    gsap.set([
      refs.iWord.current,
      refs.buildWord.current,
      refs.productsWord.current,
      refs.peopleLine.current,
      refs.builtAcross.current,
      refs.nameLine.current,
    ], { opacity: 0, y: 80, scale: 0.92, filter: "blur(24px)" });
    gsap.set(refs.builtBy.current, { opacity: 0, y: 12, letterSpacing: "0.5em" });
    gsap.set([refs.aiWord.current, refs.healthWord.current, refs.consumerWord.current], {
      opacity: 0, y: 16, filter: "blur(8px)",
    });
    gsap.set(refs.chapter.current, { opacity: 0, y: 8 });
    gsap.set(refs.centerDot.current, { opacity: 0, scale: 0 });
    gsap.set(refs.glow.current, { opacity: 0, scale: 0.6 });
    gsap.set([refs.leakL.current, refs.leakR.current], { opacity: 0 });
    gsap.set(refs.flash.current, { opacity: 0 });
    gsap.set(refs.vignette.current, { opacity: 0.55 });
    // refs are stable mutable objects; don't add to deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(SKIP_KEY, "1");
    } catch {
      // ignore
    }
    tlRef.current?.kill();
    tlRef.current = null;
    scoreRef.current?.stop();
    scoreRef.current = null;
    setPhase("done");
  }, []);

  const start = useCallback(async () => {
    setPhase("playing");
    setShowGate(false);
    const stage = stageRef.current;
    if (!stage) return;

    // Re-apply initial states (defense against any drift between the mount
    // useLayoutEffect and this click).
    gsap.set(stage, { "--ka-grad": "0%", "--ka-split": 0, "--ka-wght": 200 });
    gsap.set([
      refs.iWord.current,
      refs.buildWord.current,
      refs.productsWord.current,
      refs.peopleLine.current,
      refs.builtAcross.current,
      refs.nameLine.current,
    ], { opacity: 0, y: 80, scale: 0.92, filter: "blur(24px)" });
    gsap.set(refs.builtBy.current, { opacity: 0, y: 12, letterSpacing: "0.5em" });
    gsap.set([refs.aiWord.current, refs.healthWord.current, refs.consumerWord.current], {
      opacity: 0, y: 16, filter: "blur(8px)",
    });
    gsap.set(refs.chapter.current, { opacity: 0, y: 8 });
    gsap.set(refs.centerDot.current, { opacity: 0, scale: 0 });
    gsap.set(refs.glow.current, { opacity: 0, scale: 0.6 });
    gsap.set([refs.leakL.current, refs.leakR.current], { opacity: 0 });
    gsap.set(refs.flash.current, { opacity: 0 });
    gsap.set(refs.vignette.current, { opacity: 0.55 });

    // Kick off the audio score in parallel — never block the visual film
    // on audio init. If Tone.start() rejects (autoplay policy edge case)
    // or reverb generation hangs, the visuals still play silently.
    const score = new CinematicScore();
    scoreRef.current = score;
    score.start().catch(() => {
      // Audio failed; carry on silently.
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // Fade the whole overlay out and hand off to the scrolled site.
        gsap.to(rootRef.current, {
          opacity: 0,
          duration: 1.2,
          ease: "power2.inOut",
          onComplete: finish,
        });
      },
    });
    tlRef.current = tl;

    // Continuous gradient flow underlay throughout the film.
    tl.to(stage, { "--ka-grad": "200%", duration: B.end, ease: "none" }, 0);

    // 0–1.2s: void → single point of light, chapter label rises.
    tl.to(refs.centerDot.current, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }, 0.3);
    tl.to(refs.chapter.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.6);

    // 1.0s padIn: center glow expands.
    tl.to(refs.glow.current, { opacity: 0.55, scale: 1.4, duration: 1.5, ease: "power2.out" }, B.padIn);
    tl.to(stage, { "--ka-wght": 300, duration: 1.5, ease: "power2.out" }, B.padIn);

    // 3.0s impact1: "I" punches in — kick + chromatic flash + screen shake.
    tl.to(refs.iWord.current, {
      opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
      duration: 0.18, ease: "expo.out",
    }, B.impact1);
    tl.to(stage, { "--ka-split": 6, duration: 0.05, ease: "power3.out" }, B.impact1);
    tl.to(stage, { "--ka-split": 0.5, duration: 0.25, ease: "power2.out" }, B.impact1 + 0.06);
    tl.to(refs.flash.current, { opacity: 0.35, duration: 0.04 }, B.impact1);
    tl.to(refs.flash.current, { opacity: 0, duration: 0.25, ease: "power2.out" }, B.impact1 + 0.05);
    tl.fromTo(stage,
      { x: 0 },
      { x: 8, duration: 0.04, yoyo: true, repeat: 5, ease: "power1.inOut" },
      B.impact1,
    );

    // 3.4s impact2: "build" lands.
    tl.to(refs.buildWord.current, {
      opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
      duration: 0.18, ease: "expo.out",
    }, B.impact2);
    tl.to(stage, { "--ka-split": 4, duration: 0.04, ease: "power3.out" }, B.impact2);
    tl.to(stage, { "--ka-split": 0.4, duration: 0.22, ease: "power2.out" }, B.impact2 + 0.05);

    // 3.9s impact3: "products" sweeps in from blur with gradient flow flash.
    tl.to(refs.productsWord.current, {
      opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
      duration: 0.45, ease: "expo.out",
    }, B.impact3);
    tl.to(refs.leakL.current, { opacity: 0.6, duration: 0.2 }, B.impact3);
    tl.to(refs.leakL.current, { opacity: 0, duration: 0.6, ease: "power2.out" }, B.impact3 + 0.2);

    // 5.0s chord change: weight breathes up, slow dolly (scale stage).
    tl.to(stage, { "--ka-wght": 460, duration: 1.2, ease: "power2.inOut" }, B.chordChange1);
    tl.to(stage, { scale: 1.04, duration: 2.0, ease: "sine.inOut" }, B.chordChange1);

    // 6.5s impact4: cut — fade out first line, prep second.
    tl.to([refs.iWord.current, refs.buildWord.current, refs.productsWord.current], {
      opacity: 0, scale: 1.1, filter: "blur(20px)",
      duration: 0.35, ease: "power2.in",
    }, B.impact4);
    tl.to(stage, { scale: 1, duration: 0.4, ease: "power2.out" }, B.impact4);
    tl.to(refs.flash.current, { opacity: 0.18, duration: 0.05 }, B.impact4);
    tl.to(refs.flash.current, { opacity: 0, duration: 0.25 }, B.impact4 + 0.05);

    // 7.0s: "people actually use." enters huge, scales down to read size.
    tl.to(refs.peopleLine.current, {
      opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
      duration: 0.6, ease: "expo.out",
    }, B.impact4 + 0.4);

    // 8.0s impact5: "use." stab flash.
    tl.to(stage, { "--ka-split": 5, duration: 0.05, ease: "power3.out" }, B.impact5);
    tl.to(stage, { "--ka-split": 0.4, duration: 0.3, ease: "power2.out" }, B.impact5 + 0.06);
    tl.to(refs.flash.current, { opacity: 0.25, duration: 0.04 }, B.impact5);
    tl.to(refs.flash.current, { opacity: 0, duration: 0.3 }, B.impact5 + 0.05);
    tl.to(refs.leakR.current, { opacity: 0.5, duration: 0.2 }, B.impact5);
    tl.to(refs.leakR.current, { opacity: 0, duration: 0.6, ease: "power2.out" }, B.impact5 + 0.2);

    // 9.5s chord change: clear the line, prep "Built across".
    tl.to(refs.peopleLine.current, {
      opacity: 0, scale: 1.06, filter: "blur(18px)",
      duration: 0.5, ease: "power2.in",
    }, B.chordChange2);
    tl.to(refs.builtAcross.current, {
      opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
      duration: 0.5, ease: "expo.out",
    }, B.chordChange2 + 0.4);

    // 10.5–12.5s: domain words land per tick.
    tl.to(refs.aiWord.current, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.25, ease: "expo.out" }, B.domain1);
    tl.to(refs.healthWord.current, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.25, ease: "expo.out" }, B.domain2);
    tl.to(refs.consumerWord.current, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.25, ease: "expo.out" }, B.domain3);

    // 12.5–14s: white-noise riser. Visual: vignette tightens, stage zooms in,
    // weight axis ramps to max, gradient flow accelerates via grad ramp.
    tl.to(refs.vignette.current, { opacity: 0.85, duration: 1.4, ease: "power2.in" }, B.riserStart);
    tl.to(stage, { scale: 1.08, duration: 1.4, ease: "power2.in" }, B.riserStart);
    tl.to(stage, { "--ka-wght": 700, duration: 1.4, ease: "power2.in" }, B.riserStart);

    // 14s finalImpact: WHITE FLASH. Clear everything. Smash "Siddharth Agrawal.".
    tl.to(refs.flash.current, { opacity: 1, duration: 0.05 }, B.finalImpact);
    tl.to(refs.flash.current, { opacity: 0, duration: 0.5, ease: "power2.out" }, B.finalImpact + 0.05);
    tl.to([refs.builtAcross.current], {
      opacity: 0, scale: 1.2, filter: "blur(30px)",
      duration: 0.3, ease: "power2.in",
    }, B.finalImpact);
    tl.to(stage, { scale: 1, duration: 0.5, ease: "power2.out" }, B.finalImpact);
    tl.to(stage, { "--ka-split": 10, duration: 0.06, ease: "power3.out" }, B.finalImpact);
    tl.to(stage, { "--ka-split": 0.6, duration: 0.5, ease: "power2.out" }, B.finalImpact + 0.08);

    tl.fromTo(refs.nameLine.current,
      { opacity: 0, y: 50, scale: 1.2, filter: "blur(30px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "expo.out" },
      B.finalImpact + 0.05,
    );

    // 15.2s: "BUILT BY" credit eyebrow rises above the name with its
    // letter-spacing collapsing from 0.5em → 0.3em — the slow tracking
    // settle reads like a closing title card.
    tl.to(refs.builtBy.current, {
      opacity: 0.7,
      y: 0,
      letterSpacing: "0.3em",
      duration: 1.2,
      ease: "power2.out",
    }, B.finalImpact + 1.2);

    // 17–22s: dwell. Soft sine drift on name. Slow vignette release. Weight settles.
    tl.to(stage, { "--ka-wght": 360, duration: 2.0, ease: "power2.out" }, B.decay);
    tl.fromTo(refs.nameLine.current,
      { y: 0 }, { y: -6, duration: 3, ease: "sine.inOut" },
      B.decay,
    );
    tl.to(refs.vignette.current, { opacity: 0.4, duration: 3, ease: "power2.out" }, B.decay);

    // 21s: chapter label fades back to context.
    tl.to(refs.chapter.current, { opacity: 0.6, duration: 1, ease: "power2.out" }, B.end - 1);
  }, [finish, refs.aiWord, refs.buildWord, refs.builtAcross, refs.builtBy, refs.centerDot,
      refs.chapter, refs.consumerWord, refs.flash, refs.glow, refs.healthWord, refs.iWord,
      refs.leakL, refs.leakR, refs.nameLine, refs.peopleLine, refs.productsWord, refs.vignette]);

  // ESC / Enter handlers
  useEffect(() => {
    if (phase === "done") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        finish();
      } else if (e.key === "Enter" && phase === "gate") {
        e.preventDefault();
        void start();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, finish, start]);

  // Cleanup on unmount
  useEffect(() => () => {
    tlRef.current?.kill();
    scoreRef.current?.stop();
  }, []);

  if (phase === "done") return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[80] bg-black"
      style={{
        fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
        cursor: phase === "gate" ? "pointer" : "default",
        contain: "strict",
      }}
      onClick={phase === "gate" ? () => void start() : undefined}
      role={phase === "gate" ? "button" : undefined}
      aria-label={phase === "gate" ? "Press to begin the cinematic intro" : undefined}
      tabIndex={phase === "gate" ? 0 : undefined}
    >
      {/* Stage holds all the animated content + the CSS custom properties. */}
      <div
        ref={stageRef}
        className="relative h-full w-full overflow-hidden"
        style={{ transformOrigin: "center center" }}
      >
        {/* Centered radial glow — the void anchor. */}
        <div
          ref={refs.glow}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "min(80vw, 1100px)",
            aspectRatio: "1 / 1",
            background: "radial-gradient(circle, rgba(167,139,250,0.35) 0%, rgba(34,211,238,0.18) 35%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          ref={refs.centerDot}
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{
            width: 6, height: 6,
            transform: "translate(-50%, -50%)",
            background: "white",
            borderRadius: "50%",
            boxShadow: "0 0 30px rgba(255,255,255,0.9), 0 0 80px rgba(167,139,250,0.6)",
          }}
        />

        {/* Light leaks — diagonal gradient sweeps that flash on impacts. */}
        <div
          ref={refs.leakL}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, rgba(167,139,250,0.6) 50%, rgba(244,114,182,0.4) 60%, transparent 75%)",
            mixBlendMode: "screen",
          }}
        />
        <div
          ref={refs.leakR}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(255deg, transparent 30%, rgba(34,211,238,0.6) 50%, rgba(167,139,250,0.4) 60%, transparent 75%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Chapter label */}
        <div
          ref={refs.chapter}
          className="pointer-events-none absolute left-10 top-10 text-[10px] tracking-[0.3em] text-white/55"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        >
          00 · ENTER
        </div>

        {/* The film's word stage — words enter and leave per beat. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-[1200px] px-6 text-center text-white">
            {/* Line 1: I build products */}
            <div
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center gap-[0.35em] flex-wrap"
              style={{
                fontWeight: 300,
                fontVariationSettings: '"wght" var(--ka-wght, 320)',
                fontSize: "clamp(64px, 11vw, 180px)",
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              <ChromaticGhost ref={refs.iWord} amount={0.35}>I</ChromaticGhost>
              <ChromaticGhost ref={refs.buildWord} amount={0.35}>build</ChromaticGhost>
              <FlowingWord ref={refs.productsWord}>products</FlowingWord>
            </div>

            {/* Line 2: people actually use. */}
            <div
              ref={refs.peopleLine}
              className="absolute inset-x-0 top-1/2 -translate-y-1/2"
              style={{
                fontWeight: 300,
                fontVariationSettings: '"wght" var(--ka-wght, 320)',
                fontSize: "clamp(54px, 9vw, 150px)",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                fontStyle: "italic",
              }}
            >
              <FlowingWord>people&nbsp;actually&nbsp;use.</FlowingWord>
            </div>

            {/* Line 3: Built across AI, health, and consumer. */}
            <div
              ref={refs.builtAcross}
              className="absolute inset-x-0 top-1/2 -translate-y-1/2"
              style={{
                fontWeight: 300,
                fontVariationSettings: '"wght" var(--ka-wght, 320)',
                fontSize: "clamp(40px, 6vw, 96px)",
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              Built across{" "}
              <span ref={refs.aiWord} style={{ display: "inline-block", color: "#a78bfa", fontWeight: 600 }}>
                AI
              </span>
              ,{" "}
              <span ref={refs.healthWord} style={{ display: "inline-block", color: "#22d3ee", fontWeight: 600 }}>
                health
              </span>
              , and{" "}
              <span ref={refs.consumerWord} style={{ display: "inline-block", color: "#f472b6", fontWeight: 600 }}>
                consumer
              </span>
              .
            </div>

            {/* Line 4: Siddharth Agrawal. — the climax. */}
            <div
              ref={refs.nameLine}
              className="absolute inset-x-0 top-1/2 -translate-y-1/2"
              style={{
                fontWeight: 400,
                fontVariationSettings: '"wght" var(--ka-wght, 360)',
                fontSize: "clamp(64px, 13vw, 220px)",
                letterSpacing: "-0.045em",
                lineHeight: 0.95,
              }}
            >
              <div
                ref={refs.builtBy}
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: "clamp(10px, 1vw, 14px)",
                  fontWeight: 400,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "clamp(20px, 2vw, 36px)",
                }}
              >
                A film built by
              </div>
              <ChromaticGhost amount={0.3}>Siddharth</ChromaticGhost>{" "}
              <ChromaticGhost amount={0.45}>
                <FlowingWord>Agrawal.</FlowingWord>
              </ChromaticGhost>
            </div>
          </div>
        </div>

        {/* Vignette */}
        <div
          ref={refs.vignette}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.95) 100%)",
          }}
        />

        {/* Full-screen white flash overlay (impacts) */}
        <div
          ref={refs.flash}
          className="pointer-events-none absolute inset-0 bg-white"
          style={{ mixBlendMode: "screen" }}
        />

        {/* Grain — subtle film texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: 0.06,
            mixBlendMode: "overlay",
            backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"200\\" height=\\"200\\"><filter id=\\"n\\"><feTurbulence type=\\"fractalNoise\\" baseFrequency=\\"0.9\\" numOctaves=\\"2\\" stitchTiles=\\"stitch\\"/></filter><rect width=\\"100%\\" height=\\"100%\\" filter=\\"url(%23n)\\"/></svg>")',
          }}
        />
      </div>

      {/* Skip / replay UI */}
      {phase === "playing" && (
        <button
          ref={refs.skip}
          onClick={(e) => { e.stopPropagation(); finish(); }}
          className="absolute right-8 top-8 z-10 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-[11px] tracking-[0.2em] text-white/70 backdrop-blur transition-colors hover:border-white/40 hover:text-white"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        >
          SKIP · ESC
        </button>
      )}

      {/* Gate */}
      {showGate && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center text-white">
            <div
              className="text-[10px] tracking-[0.5em] text-white/50 mb-6"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              A FILM
            </div>
            <div
              className="text-[64px] sm:text-[96px] leading-none tracking-[-0.05em]"
              style={{
                fontWeight: 300,
                background: "linear-gradient(135deg, #ffffff 0%, rgba(167,139,250,0.9) 50%, rgba(34,211,238,0.85) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Press to begin
            </div>
            <div
              className="mt-8 text-[11px] tracking-[0.3em] text-white/45"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              ↵ ENTER · OR CLICK ANYWHERE · 22s · WITH SOUND
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Inline helpers ----------------------------------------------------------

const ChromaticGhost = forwardRef<HTMLDivElement, { children: ReactNode; amount?: number; style?: CSSProperties }>(
  function ChromaticGhost({ children, amount = 1, style }, ref) {
    const offset = `calc(var(--ka-split, 0) * ${amount} * 1px)`;
    const ghost: CSSProperties = {
      position: "absolute", inset: 0, pointerEvents: "none",
      mixBlendMode: "screen", willChange: "transform",
    };
    return (
      <div ref={ref} style={{ position: "relative", display: "inline-block", ...style }}>
        <span aria-hidden style={{ ...ghost, color: "#22d3ee", transform: `translate3d(${offset}, 0, 0)` }}>{children}</span>
        <span aria-hidden style={{ ...ghost, color: "#f472b6", transform: `translate3d(calc(${offset} * -1), 0, 0)` }}>{children}</span>
        <span style={{ position: "relative" }}>{children}</span>
      </div>
    );
  },
);

const FlowingWord = forwardRef<HTMLDivElement, { children: ReactNode; style?: CSSProperties }>(
  function FlowingWord({ children, style }, ref) {
    return (
      <div
        ref={ref}
        style={{
          display: "inline-block",
          backgroundImage:
            "linear-gradient(90deg, #a78bfa 0%, #22d3ee 25%, #f472b6 50%, #22d3ee 75%, #a78bfa 100%)",
          backgroundSize: "300% 100%",
          backgroundPositionX: "var(--ka-grad, 0%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          fontWeight: 500,
          fontStyle: "italic",
          willChange: "background-position",
          ...style,
        }}
      >
        {children}
      </div>
    );
  },
);
