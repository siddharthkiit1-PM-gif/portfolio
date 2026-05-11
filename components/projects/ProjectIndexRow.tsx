"use client";

/**
 * ProjectIndexRow — one editorial row on /projects. Hover-only motion:
 * row lifts 1px, hairline brightens, thumbnail scales 1.02, and the
 * title-line gets a faint chromatic split. Reduced-motion drops the lift
 * and scale but keeps the hairline brighten.
 */

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

  return (
    <a
      href={`/projects/${project.slug}`}
      className="group block py-8 transition motion-safe:hover:-translate-y-px"
      style={{ borderBottom: `1px solid ${HAIRLINE_FAINT}` }}
    >
      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[120px_64px_1fr_auto_auto] md:gap-8">
        {/* Thumbnail */}
        <div
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
        </div>

        {/* Year */}
        <div
          className="text-[11px] tabular-nums text-white/55"
          style={{ ...MONO, letterSpacing: "0.18em" }}
        >
          {project.year}
        </div>

        {/* Title + meta */}
        <div className="flex flex-col gap-1.5">
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
        </div>

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

        {/* Arrow */}
        <div className="text-[18px] text-white/55 transition group-hover:text-white">
          &rarr;
        </div>
      </div>
    </a>
  );
}
