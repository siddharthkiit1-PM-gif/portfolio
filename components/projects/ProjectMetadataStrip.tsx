"use client";

/**
 * ProjectMetadataStrip — the small horizontal row of link icons that
 * appears beneath the title on both the homepage Projects chapter beats
 * and on the /projects/[slug] detail header. Each icon renders only when
 * the corresponding URL is set. Hairline above the strip.
 */

import type { Doc } from "@/convex/_generated/dataModel";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Props = {
  project: Pick<Doc<"projects">, "liveUrl" | "githubUrl" | "figmaUrl" | "loomUrl">;
  /** Optional inline tech-stack chip row rendered after the icons. */
  techStack?: string[];
};

export function ProjectMetadataStrip({ project, techStack }: Props) {
  const links: { label: string; url: string }[] = [];
  if (project.liveUrl) links.push({ label: "LIVE", url: project.liveUrl });
  if (project.githubUrl) links.push({ label: "CODE", url: project.githubUrl });
  if (project.figmaUrl) links.push({ label: "FIGMA", url: project.figmaUrl });
  if (project.loomUrl) links.push({ label: "LOOM", url: project.loomUrl });

  if (links.length === 0 && (!techStack || techStack.length === 0)) return null;

  return (
    <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${HAIRLINE_FAINT}` }}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10.5px] text-white/70 transition hover:text-white"
            style={{ ...MONO, letterSpacing: "0.28em" }}
          >
            {l.label} &nearr;
          </a>
        ))}
      </div>
      {techStack && techStack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {techStack.map((t) => (
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
    </div>
  );
}
