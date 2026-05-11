/**
 * ProjectActionCluster — the shared link cluster used beneath a project's
 * title on both the homepage row and the case-study header.
 *
 * Layout decisions (intentional):
 *
 *   • The live URL is the primary CTA — large enough to be unmissable
 *     and obviously clickable. Renders as a white-filled pill with the
 *     Vercel mark on the left, "View live" label, and a corner arrow.
 *     Sized 12–13px so it stands a head above the secondary cluster.
 *
 *   • Secondary links (code, design, walkthrough, PRD) render as small
 *     square icon buttons grouped to the right of the primary CTA.
 *     Each button shows only the brand mark; the human-readable label
 *     is the button's `title` attribute (browser tooltip) and aria-label,
 *     keeping the cluster compact without losing accessibility.
 *
 *   • Buttons only render when their URL is set, so a project with just a
 *     GitHub repo doesn't get four ghost slots.
 *
 * Pure read component — admin edit affordances live in EditableProjectRow.
 */

import * as React from "react";
import {
  ArrowUpRight,
  FigmaMark,
  GithubMark,
  LoomMark,
  PrdDocMark,
  VercelMark,
} from "@/components/icons/BrandIcons";

type Project = {
  liveUrl?: string;
  githubUrl?: string;
  figmaUrl?: string;
  loomUrl?: string;
  prdUrl?: string;
};

type Props = {
  project: Project;
  /** Visual density — "compact" tucks into row width, "spread" gives more padding for detail page. */
  density?: "compact" | "spread";
  align?: "start" | "end";
};

export function ProjectActionCluster({ project, density = "compact", align = "end" }: Props) {
  const hasAny =
    project.liveUrl ||
    project.githubUrl ||
    project.figmaUrl ||
    project.loomUrl ||
    project.prdUrl;
  if (!hasAny) return null;

  const secondaries: { url: string; label: string; node: React.ReactNode }[] = [];
  if (project.githubUrl)
    secondaries.push({
      url: project.githubUrl,
      label: "Source code · GitHub",
      node: <GithubMark size={density === "spread" ? 18 : 16} />,
    });
  if (project.figmaUrl)
    secondaries.push({
      url: project.figmaUrl,
      label: "Design · Figma",
      node: <FigmaMark size={density === "spread" ? 18 : 16} />,
    });
  if (project.loomUrl)
    secondaries.push({
      url: project.loomUrl,
      label: "Walkthrough · Loom",
      node: <LoomMark size={density === "spread" ? 18 : 16} />,
    });
  if (project.prdUrl)
    secondaries.push({
      url: project.prdUrl,
      label: "Spec · PRD",
      node: <PrdDocMark size={density === "spread" ? 18 : 16} />,
    });

  const justify = align === "end" ? "justify-end" : "justify-start";
  const primaryHeight = density === "spread" ? "h-9" : "h-8";
  const primaryText = density === "spread" ? "text-[13px]" : "text-[12.5px]";
  const iconBtn = density === "spread" ? "size-9" : "size-8";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${justify}`}>
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`group/live inline-flex items-center gap-2 rounded-full bg-white px-4 ${primaryHeight} ${primaryText} font-medium tracking-tight text-black transition hover:bg-white/90`}
          aria-label="Open live deployment"
        >
          <VercelMark size={density === "spread" ? 14 : 12} />
          <span>View live</span>
          <ArrowUpRight size={density === "spread" ? 12 : 11} />
        </a>
      )}
      {secondaries.length > 0 && (
        <div
          className="inline-flex items-center gap-1 rounded-full px-1 py-1"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {secondaries.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.label}
              aria-label={s.label}
              className={`inline-flex ${iconBtn} items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white`}
            >
              {s.node}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
