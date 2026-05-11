"use client";

/**
 * Preview-only — three side-by-side variants of the homepage Projects
 * chapter, rendered against the live Convex collection.
 *
 *   A — Sticky-numeral cinematic stack (default)
 *   B — Cinematic stack, numerals scroll with the beat
 *   C — Asymmetric beats, alternating left/right media columns
 *
 * Throwaway. Deleted at graduation in Task 14.
 */

import { ProjectsSection } from "@/components/projects/ProjectsSection";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section
      className="mb-16 overflow-hidden rounded-xl"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="px-6 py-3 text-[11px] text-white/65"
        style={{
          ...MONO,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {label}
      </div>
      {children}
    </section>
  );
}

export function ProjectsPreview() {
  return (
    <main className="min-h-[100dvh] bg-[#05060a] py-12 text-white">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <h1
          className="mb-10 text-[28px] text-white/85"
          style={{
            fontFamily:
              'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
            fontStyle: "italic",
            fontWeight: 300,
          }}
        >
          Projects chapter \u2014 preview
        </h1>

        <Frame label="VARIANT A \u00B7 STICKY NUMERAL CINEMATIC STACK">
          <ProjectsSection stickyNumeral alternateMediaSide={false} />
        </Frame>

        <Frame label="VARIANT B \u00B7 NUMERALS SCROLL WITH BEAT">
          <ProjectsSection stickyNumeral={false} alternateMediaSide={false} />
        </Frame>

        <Frame label="VARIANT C \u00B7 ALTERNATING ASYMMETRIC BEATS">
          <ProjectsSection stickyNumeral alternateMediaSide />
        </Frame>
      </div>
    </main>
  );
}
