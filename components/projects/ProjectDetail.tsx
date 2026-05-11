"use client";

/**
 * ProjectDetail — body of /projects/[slug]. Reads api.projects.getBySlug
 * for this row and api.projects.list for prev/next neighbor resolution.
 *
 * Reading order, top to bottom:
 *
 *   1. Eyebrow (kind · year · role)
 *   2. Title (chromatic + flowing gradient)
 *   3. Tagline standfirst (italic serif — the one-breath pitch)
 *   4. Original title beneath when an `outcome` headline is used
 *   5. Action cluster (Vercel · GitHub · Figma · Loom · PRD)
 *   6. Hero image
 *   7. 3- or 4-up fact sheet (Problem · Goal · Users · Value)
 *   8. Narrative blocks (approach, outcome) via ProjectNarrative
 *   9. "What I learned" reflection block when `learnings` is set
 *  10. Prev / next neighbor nav
 */

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { ProjectNarrative } from "./ProjectNarrative";
import { ProjectActionCluster } from "./ProjectActionCluster";
import { neighbors } from "@/lib/projects/neighbors";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
};

const HAIRLINE = "rgba(255,255,255,0.14)";
const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Props = { slug: string };

export function ProjectDetail({ slug }: Props) {
  const project = useQuery(api.projects.getBySlug, { slug });
  const all = useQuery(api.projects.list);

  const heroUrl = useQuery(
    api.projects.getStorageUrl,
    project && project.heroImageStorageId
      ? { storageId: project.heroImageStorageId }
      : "skip",
  );

  const [heroLoaded, setHeroLoaded] = useState(false);
  useEffect(() => {
    setHeroLoaded(true);
  }, []);

  if (project === undefined) return null; // still loading
  if (project === null) notFound();

  const titleLine = project.outcome ?? project.title;
  const kind = project.approach ? "CASE STUDY" : "PROJECT";
  const eyebrowParts = [kind, project.year, project.role].filter(
    (s): s is string => Boolean(s && s.trim().length > 0),
  );

  const { prev, next } = neighbors(all ?? [], slug);

  return (
    <main className="relative min-h-[100dvh] bg-[#05060a] py-[clamp(64px,10vh,120px)] text-white">
      <div className="mx-auto w-full max-w-[920px] px-6">
        <a
          href="/projects"
          className="text-[11px] text-white/55 transition hover:text-white"
          style={{ ...MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
        >
          &larr; All projects
        </a>

        <header className="mt-10">
          <div
            className="text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            {eyebrowParts.join(" \u00B7 ")}
          </div>
          <h1
            className="mt-6 text-[clamp(40px,7vh,80px)] leading-[1.02] tracking-[-2.5px] text-white"
            style={{ ...SERIF_ITALIC, fontWeight: 500 }}
          >
            <ChromaticText amount={0.25}>
              <FlowingGradientText>{titleLine}</FlowingGradientText>
            </ChromaticText>
          </h1>
          {project.tagline && (
            <p
              className="mt-5 max-w-[680px] text-[clamp(18px,2vw,22px)] leading-[1.4] text-white/85"
              style={{ ...SERIF_ITALIC, fontWeight: 300 }}
            >
              {project.tagline}
            </p>
          )}
          {project.outcome && (
            <p
              className="mt-3 text-[12px] text-white/45"
              style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              Originally shipped as · {project.title}
            </p>
          )}

          <div className="mt-7">
            <ProjectActionCluster project={project} density="spread" align="start" />
          </div>

          {project.techStack.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {project.techStack.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-[3px] text-[10.5px] text-white/70"
                  style={{
                    ...MONO,
                    letterSpacing: "0.06em",
                    border: `1px solid ${HAIRLINE_FAINT}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div aria-hidden className="mt-9 h-px w-full" style={{ background: HAIRLINE }} />
        </header>

        {heroUrl && (
          <div
            className="mt-[clamp(40px,7vh,80px)] aspect-[16/10] w-full overflow-hidden rounded-2xl"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroUrl}
              alt={project.heroImageAlt ?? project.title}
              className={`size-full object-cover transition-opacity duration-700 motion-reduce:opacity-100 ${
                heroLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="eager"
            />
          </div>
        )}

        <div
          className={`mt-[clamp(48px,8vh,96px)] grid grid-cols-1 gap-8 ${
            project.goal ? "md:grid-cols-4" : "md:grid-cols-3"
          }`}
        >
          <FactBlock label="PROBLEM" body={project.problem} />
          {project.goal && <FactBlock label="GOAL" body={project.goal} />}
          <FactBlock label="HOW WE SOLVE IT" body={project.value} />
          <FactBlock label="WHO WE SOLVE IT FOR" body={project.users} />
        </div>

        <ProjectNarrative project={project} />

        {project.learnings && project.learnings.trim().length > 0 && (
          <section className="mt-[clamp(56px,9vh,108px)]">
            <div
              className="text-[10px] text-white/45"
              style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
            >
              What I learned
            </div>
            <div aria-hidden className="mt-2 h-px w-full" style={{ background: HAIRLINE }} />
            <p className="mt-6 max-w-[680px] whitespace-pre-wrap text-[17px] leading-[1.65] font-light text-white/85">
              {project.learnings}
            </p>
          </section>
        )}

        <footer className="mt-[clamp(64px,10vh,120px)]">
          <div aria-hidden className="h-px w-full" style={{ background: HAIRLINE }} />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <NavLink
              direction="prev"
              href={prev ? `/projects/${prev.slug}` : null}
              label={prev ? truncate(prev.outcome ?? prev.title, 40) : null}
            />
            <NavLink
              direction="next"
              href={next ? `/projects/${next.slug}` : null}
              label={next ? truncate(next.outcome ?? next.title, 40) : null}
            />
          </div>
          <div className="mt-8 text-center">
            <a
              href="/projects"
              className="text-[11px] text-white/55 transition hover:text-white"
              style={{ ...MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
            >
              See all projects &rarr;
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FactBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div
        className="text-[10px] text-white/45"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div aria-hidden className="mt-2 h-px w-full" style={{ background: HAIRLINE }} />
      <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-white/80">
        {body}
      </p>
    </div>
  );
}

function NavLink({
  direction,
  href,
  label,
}: {
  direction: "prev" | "next";
  href: string | null;
  label: string | null;
}) {
  if (!href || !label) return <div />;
  const align = direction === "prev" ? "text-left" : "text-right";
  return (
    <a href={href} className={`${align} block transition opacity-80 hover:opacity-100`}>
      <div
        className="text-[10px] text-white/45"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
        }}
      >
        {direction === "prev" ? "\u2190 Previous project" : "Next project \u2192"}
      </div>
      <div className="mt-2 text-[16px] text-white">{label}</div>
    </a>
  );
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "\u2026";
}
