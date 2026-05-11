"use client";

/**
 * ProjectsSection — homepage cinematic chapter.
 *
 * Slots into app/page.tsx in place of <ProjectGridPlaceholder/>. Reads
 * api.projects.listFeatured for the beats and api.projects.list for the
 * "See all N projects →" link count.
 *
 * Chapter chrome (eyebrows, headline, standfirst) is editable via
 * EditableText slots under page="home", slot="projects.*". The index-
 * link label is rendered through EditableCountLabel because the {count}
 * substitution requires a per-render transform that EditableText does
 * not provide; admin still edits it via /admin/edit Copy tab.
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableText } from "@/components/editable/EditableText";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { tiptapToPlainText, type TiptapNode } from "@/lib/content/tiptapJson";
import { ProjectScrollBeat } from "./ProjectScrollBeat";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE = "rgba(255,255,255,0.14)";

type Props = {
  /** Variant C alternates media side per beat; default is always-right. */
  alternateMediaSide?: boolean;
  /** When false, chapter numerals scroll with the beat (Variant B). */
  stickyNumeral?: boolean;
};

export function ProjectsSection({
  alternateMediaSide = false,
  stickyNumeral = true,
}: Props) {
  const featured = useQuery(api.projects.listFeatured);
  const all = useQuery(api.projects.list);

  return (
    <section className="relative overflow-hidden bg-[#05060a] py-[clamp(96px,14vh,160px)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 80px), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 80px)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[1100px] px-6 sm:px-6 lg:px-10">
        <header>
          <div
            className="flex items-baseline justify-between text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            <EditableText
              page="home"
              slot="projects.eyebrowLeft"
              fallback="PROJECTS · 2022 — 2026"
              as="span"
              singleLine
            />
            <EditableText
              page="home"
              slot="projects.eyebrowRight"
              fallback=""
              as="span"
              singleLine
            />
          </div>
          <div aria-hidden className="mt-4 h-px w-full" style={{ background: HAIRLINE }} />
          <h2
            className="mt-8 text-[clamp(40px,6vw,64px)] leading-[1.05] tracking-[-2px] text-white"
            style={{
              fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            <ChromaticText amount={0.35}>
              <FlowingGradientText>
                <EditableText
                  page="home"
                  slot="projects.headline"
                  fallback="Selected work, in detail."
                  as="span"
                  singleLine
                />
              </FlowingGradientText>
            </ChromaticText>
          </h2>
          <p className="mt-4 max-w-[560px] text-[17px] leading-[1.5] font-light text-white/65">
            <EditableText
              page="home"
              slot="projects.standfirst"
              fallback="A small set of products I led, designed, or built — each with the problem, the people, and the result."
              as="span"
            />
          </p>
        </header>

        <div className="mt-[clamp(64px,10vh,120px)] flex flex-col gap-[clamp(96px,14vh,160px)]">
          {featured === undefined ? null : featured.length === 0 ? (
            <p className="text-[14px] text-white/55">Featured projects coming soon.</p>
          ) : (
            featured.map((p, i) => (
              <ProjectScrollBeat
                key={p._id}
                project={p}
                index={i}
                stickyNumeral={stickyNumeral}
                mediaSide={
                  alternateMediaSide && i % 2 === 1 ? "left" : "right"
                }
              />
            ))
          )}
        </div>

        <div className="mt-[clamp(64px,10vh,120px)]">
          <div aria-hidden className="h-px w-full" style={{ background: HAIRLINE }} />
          <div className="mt-6 flex justify-end">
            <a
              href="/projects"
              className="text-[12px] text-white/70 transition hover:text-white"
              style={{ ...MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
            >
              <EditableCountLabel count={all ? all.length : null} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function EditableCountLabel({ count }: { count: number | null }) {
  const row = useQuery(api.siteContent.get, {
    page: "home",
    slot: "projects.indexLinkLabel",
  });
  const FALLBACK = "See all {count} projects \u2192";
  let source = FALLBACK;
  if (row?.valueJson != null) {
    try {
      const json = JSON.parse(row.valueJson) as TiptapNode;
      source = tiptapToPlainText(json);
    } catch {
      source = FALLBACK;
    }
  }
  const display = source.replace("{count}", count === null ? "\u2026" : String(count));
  return <span>{display}</span>;
}
