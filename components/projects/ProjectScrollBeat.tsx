"use client";

/**
 * ProjectScrollBeat — one featured project's full-bleed scroll beat on
 * the homepage Projects chapter. Two-column on md+, stacked on mobile.
 *
 * Motion verb: image scales 1.02 → 1.0 and lifts 12px over the scroll-
 * through. Owns its own GSAP timeline + ScrollTrigger scrubbed against
 * the section element — deliberately separate from HeroPinController to
 * avoid the desync hazard called out in CLAUDE.md.
 *
 * Reduced-motion: static (no scale tween, no lift).
 *
 * `mediaSide` controls which column the hero image renders on. Variant
 * C in the preview alternates it per beat; Variant A always uses "right".
 */

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { ChapterNumeral } from "@/components/experience/ChapterNumeral";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { ProjectMetadataStrip } from "./ProjectMetadataStrip";

type Props = {
  project: Doc<"projects">;
  index: number;
  mediaSide?: "left" | "right";
  stickyNumeral?: boolean;
};

export function ProjectScrollBeat({
  project,
  index,
  mediaSide = "right",
  stickyNumeral = true,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const titleLine = project.outcome ?? project.title;
  const showProjectEyebrow = Boolean(project.outcome);
  const ctaLabel = project.approach ? "Read case study \u2192" : "View project \u2192";

  const imageUrl = useQuery(
    api.projects.getStorageUrl,
    project.heroImageStorageId ? { storageId: project.heroImageStorageId } : "skip",
  );

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const tween = gsap.fromTo(
        media,
        { scale: 1.02, y: 12 },
        {
          scale: 1.0,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top 80%",
            end: "bottom 30%",
            scrub: 0.5,
          },
        },
      );

      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced]);

  const copy = (
    <div className="flex max-w-[640px] flex-col gap-6">
      <div className="flex items-start gap-6">
        <ChapterNumeral index={index} sticky={stickyNumeral} />
      </div>

      {showProjectEyebrow && (
        <div
          className="text-[10.5px] text-white/55"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          {project.title}
        </div>
      )}

      <h3
        className="text-[clamp(40px,6.5vh,72px)] leading-[1.05] tracking-[-2px] text-white"
        style={{
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
        }}
      >
        <ChromaticText amount={0.35}>
          <FlowingGradientText>{titleLine}</FlowingGradientText>
        </ChromaticText>
      </h3>

      <p className="line-clamp-2 max-w-[560px] text-base leading-[1.55] font-light text-white/75">
        {project.problem}
      </p>

      {project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.slice(0, 5).map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-[3px] text-[10.5px] text-white/70"
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                letterSpacing: "0.06em",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <ProjectMetadataStrip project={project} />

      <a
        href={`/projects/${project.slug}`}
        className="mt-2 inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-medium text-black"
      >
        {ctaLabel}
      </a>
    </div>
  );

  const media = (
    <div
      ref={mediaRef}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl md:aspect-[4/3] lg:aspect-[16/10]"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        background: "rgba(255,255,255,0.02)",
        willChange: reduced ? undefined : "transform",
      }}
    >
      {imageUrl ? (
        // Convex storage URLs are opaque externally — use plain <img>; next/image
        // would require remotePatterns config and gives no measurable win here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={project.heroImageAlt ?? project.title}
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-[clamp(48px,6vw,72px)] text-white/[0.08]"
          style={{
            fontFamily:
              'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
            fontStyle: "italic",
            fontWeight: 300,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
      )}
    </div>
  );

  return (
    <section
      ref={rootRef}
      className="grid grid-cols-1 items-start gap-10 md:grid-cols-12 md:gap-12"
    >
      {mediaSide === "left" ? (
        <>
          <div className="md:col-span-6">{media}</div>
          <div className="md:col-span-6">{copy}</div>
        </>
      ) : (
        <>
          <div className="md:col-span-6">{copy}</div>
          <div className="md:col-span-6">{media}</div>
        </>
      )}
    </section>
  );
}
