"use client";

/**
 * ProjectNarrative — Approach + Outcome blocks rendered on the
 * /projects/[slug] detail page when `approach` is set. Hero metric
 * counts up via the existing useCountUp hook (IntersectionObserver,
 * threshold 0.3, respects useReducedMotion).
 *
 * Section labels (APPROACH, OUTCOME) are static chrome, not editable.
 */

import type { Doc } from "@/convex/_generated/dataModel";
import { useCountUp } from "@/lib/motion/useCountUp";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE = "rgba(255,255,255,0.14)";

type Props = {
  project: Pick<
    Doc<"projects">,
    "approach" | "outcomeNarrative" | "heroMetricValue" | "heroMetricLabel"
  >;
};

export function ProjectNarrative({ project }: Props) {
  if (!project.approach) return null;

  return (
    <div className="mt-[clamp(48px,8vh,96px)] flex flex-col gap-[clamp(40px,7vh,80px)]">
      <NarrativeBlock label="APPROACH" body={project.approach} />
      {(project.outcomeNarrative ||
        (project.heroMetricValue && project.heroMetricLabel)) && (
        <div className="flex flex-col gap-6">
          <SectionLabel>OUTCOME</SectionLabel>
          {project.heroMetricValue && project.heroMetricLabel && (
            <HeroMetric
              value={project.heroMetricValue}
              label={project.heroMetricLabel}
            />
          )}
          {project.outcomeNarrative && (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-white/80">
              {project.outcomeNarrative}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NarrativeBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>{label}</SectionLabel>
      <p className="whitespace-pre-wrap text-base leading-relaxed text-white/80">
        {body}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[10px] text-white/45"
        style={{
          ...MONO,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </div>
      <div aria-hidden className="mt-2 h-px w-full" style={{ background: HAIRLINE }} />
    </div>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  const { ref, display } = useCountUp<HTMLDivElement>(value, { threshold: 0.3 });
  return (
    <div className="flex flex-col gap-2 pb-6" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
      <div
        ref={ref}
        className="text-[clamp(56px,7vw,80px)] leading-none tracking-[-2px] tabular-nums text-white"
        style={{ ...MONO, fontWeight: 500 }}
      >
        {display}
      </div>
      <div
        className="text-[11px] text-white/55"
        style={{
          ...MONO,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}
