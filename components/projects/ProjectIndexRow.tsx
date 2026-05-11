"use client";

/**
 * ProjectIndexRow — one editorial row on /projects. Hover-only motion:
 * row lifts 1px, hairline brightens, thumbnail scales 1.02, and the
 * title-line gets a faint chromatic split. Reduced-motion drops the lift
 * and scale but keeps the hairline brighten.
 *
 * The title block is the primary link to the detail page. Action icons
 * (Live/Code/Figma/Loom) are separate anchors that open in a new tab,
 * so recruiters can jump straight to the artifact without a click-through.
 */

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { ChromaticText } from "@/components/home/ChromaticText";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
  fontWeight: 300,
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Props = {
  project: Doc<"projects">;
  index: number;
};

export function ProjectIndexRow({ project, index }: Props) {
  const titleLine = project.outcome ?? project.title;
  const projectName = project.outcome ? project.title : undefined;
  const metaParts = [project.role, projectName]
    .filter((s): s is string => Boolean(s && s.trim().length > 0))
    .map((s) => s.toUpperCase());

  const imageUrl = useQuery(
    api.projects.getStorageUrl,
    project.heroImageStorageId ? { storageId: project.heroImageStorageId } : "skip",
  );

  const actions: { label: string; url: string }[] = [];
  if (project.liveUrl) actions.push({ label: "LIVE", url: project.liveUrl });
  if (project.githubUrl) actions.push({ label: "CODE", url: project.githubUrl });
  if (project.figmaUrl) actions.push({ label: "FIGMA", url: project.figmaUrl });
  if (project.loomUrl) actions.push({ label: "LOOM", url: project.loomUrl });

  return (
    <div
      className="group block py-8 transition motion-safe:hover:-translate-y-px"
      style={{ borderBottom: `1px solid ${HAIRLINE_FAINT}` }}
    >
      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[120px_64px_1fr_auto_auto_auto] md:gap-8">
        {/* Thumbnail */}
        <Link
          href={`/projects/${project.slug}`}
          className="relative aspect-[120/80] w-full overflow-hidden rounded-md md:w-[120px]"
          style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={project.heroImageAlt ?? project.title}
              className="absolute inset-0 size-full object-cover transition-transform duration-200 motion-safe:group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-[clamp(28px,4vw,36px)] text-white/15"
              style={SERIF_ITALIC}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
          )}
        </Link>

        {/* Year */}
        <div
          className="text-[11px] tabular-nums text-white/55"
          style={{ ...MONO, letterSpacing: "0.18em" }}
        >
          {project.year}
        </div>

        {/* Title + meta — primary link to detail page */}
        <Link href={`/projects/${project.slug}`} className="flex flex-col gap-1.5">
          <div
            className="text-[clamp(20px,2.4vw,28px)] leading-tight text-white"
            style={{
              fontFamily:
                "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
            }}
          >
            <span className="hidden group-hover:inline">
              <ChromaticText amount={0.15}>{titleLine}</ChromaticText>
            </span>
            <span className="group-hover:hidden">{titleLine}</span>
          </div>
          {metaParts.length > 0 && (
            <div
              className="text-[10.5px] text-white/55"
              style={{ ...MONO, letterSpacing: "0.24em" }}
            >
              {metaParts.join(" \u00B7 ")}
            </div>
          )}
        </Link>

        {/* Tech chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {project.techStack.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full px-2 py-[2px] text-[10.5px] text-white/70"
              style={{
                ...MONO,
                letterSpacing: "0.06em",
                border: `1px solid ${HAIRLINE_FAINT}`,
              }}
            >
              {t}
            </span>
          ))}
          {project.techStack.length > 3 && (
            <span
              className="rounded-full px-2 py-[2px] text-[10.5px] text-white/55"
              style={{
                ...MONO,
                letterSpacing: "0.06em",
                border: `1px solid ${HAIRLINE_FAINT}`,
              }}
            >
              +{project.techStack.length - 3}
            </span>
          )}
        </div>

        {/* Inline action links */}
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((a) => (
            <a
              key={a.label}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-2.5 py-[3px] text-[10px] text-white/70 transition hover:text-white hover:bg-white/5"
              style={{
                ...MONO,
                letterSpacing: "0.16em",
                border: `1px solid ${HAIRLINE_FAINT}`,
              }}
            >
              {a.label} &nearr;
            </a>
          ))}
        </div>

        {/* Arrow → detail */}
        <Link
          href={`/projects/${project.slug}`}
          className="text-[18px] text-white/55 transition group-hover:text-white"
          aria-label={`Open ${project.title} detail page`}
        >
          &rarr;
        </Link>
      </div>
    </div>
  );
}
