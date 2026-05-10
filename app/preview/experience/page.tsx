/**
 * THROWAWAY PREVIEW — sign-off route only.
 *
 * Renders both candidate variants of the Experience section side-by-side at
 * production aesthetic quality so the user can pick one. Once the variant is
 * chosen, this file is deleted in the same commit that graduates the section
 * into `app/page.tsx`. Per CLAUDE.md.
 */

import { ExperienceSection } from "@/components/experience/ExperienceSection";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

function VariantFrame({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-white/10">
      <div
        className="bg-black px-6 py-6 text-[11px] text-white/55"
        style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
      >
        <div className="text-white">{label}</div>
        <div className="mt-1 text-white/45">{description}</div>
      </div>
      {children}
    </div>
  );
}

export default function ExperiencePreviewPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="px-6 py-10">
        <h1
          className="text-[20px] text-white"
          style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
        >
          Experience Section · Preview
        </h1>
        <p className="mt-2 max-w-[640px] text-sm text-white/55">
          Two candidate variants of the Experience section, rendered at production
          fidelity. Pick one — the chosen variant graduates into the live homepage
          and this file gets deleted.
        </p>
      </header>

      <VariantFrame
        label="Variant A — Sticky + Counter-up"
        description="Chapter numerals follow scroll inside each card. Metric strip counts up on entry."
      >
        <ExperienceSection animate={true} />
      </VariantFrame>

      <VariantFrame
        label="Variant B — Static (quieter alt)"
        description="Numerals fixed at the top of each card. Metric values render statically."
      >
        <ExperienceSection animate={false} />
      </VariantFrame>
    </main>
  );
}
