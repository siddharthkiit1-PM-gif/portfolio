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
 *   • GitHub and PRD are promoted to labeled pills that mirror the
 *     "View live" treatment — brand mark + readable label + corner
 *     arrow — but render as outlined ghost pills so the live CTA
 *     keeps visual primacy. "View on GitHub" and "Read the PRD".
 *
 *   • Figma and Loom stay as compact icon-only buttons grouped after
 *     the labeled pills, since the brand mark alone reads clearly and
 *     keeps the cluster from sprawling.
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

  const labeledIconSize = density === "spread" ? 14 : 12;
  const iconOnlySize = density === "spread" ? 18 : 16;

  const labeled: { url: string; label: string; node: React.ReactNode }[] = [];
  if (project.githubUrl)
    labeled.push({
      url: project.githubUrl,
      label: "View on GitHub",
      node: <GithubMark size={labeledIconSize} />,
    });
  if (project.prdUrl)
    labeled.push({
      url: project.prdUrl,
      label: "Read the PRD",
      node: <PrdDocMark size={labeledIconSize} />,
    });

  const iconOnly: { url: string; label: string; node: React.ReactNode }[] = [];
  if (project.figmaUrl)
    iconOnly.push({
      url: project.figmaUrl,
      label: "Design · Figma",
      node: <FigmaMark size={iconOnlySize} />,
    });
  if (project.loomUrl)
    iconOnly.push({
      url: project.loomUrl,
      label: "Walkthrough · Loom",
      node: <LoomMark size={iconOnlySize} />,
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
      {labeled.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className={`inline-flex items-center gap-2 rounded-full px-4 ${primaryHeight} ${primaryText} font-medium tracking-tight text-white/85 transition hover:bg-white/10 hover:text-white`}
          style={{ border: "1px solid rgba(255,255,255,0.14)" }}
        >
          {l.node}
          <span>{l.label}</span>
          <ArrowUpRight size={density === "spread" ? 12 : 11} />
        </a>
      ))}
      {iconOnly.length > 0 && (
        <div
          className="inline-flex items-center gap-1 rounded-full px-1 py-1"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {iconOnly.map((s) => (
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
