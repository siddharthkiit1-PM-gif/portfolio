"use client";

import type { RoleDefault } from "@/lib/defaults/experienceRoles";
import { ChapterNumeral } from "./ChapterNumeral";
import { PillarBlock } from "./PillarBlock";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
};

const HAIRLINE = "rgba(255,255,255,0.14)";

type Props = {
  role: RoleDefault;
  index: number;
  /** When false, chapter numeral renders inline (mobile / Variant B). */
  stickyNumeral?: boolean;
};

export function RoleCard({ role, index, stickyNumeral = true }: Props) {
  const meta = [role.title, role.location, role.dates]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();

  return (
    <article className="grid grid-cols-1 gap-6 md:grid-cols-[120px_1fr] md:gap-x-10">
      <div className="md:block">
        <ChapterNumeral index={index} sticky={stickyNumeral} />
      </div>
      <div>
        <h3
          className="text-[clamp(28px,3.5vw,40px)] leading-tight tracking-[-0.5px] text-white"
          style={{ ...SERIF_ITALIC, fontWeight: 500 }}
        >
          {role.company}
        </h3>
        <div
          className="mt-2 text-[11.5px] text-white/55"
          style={{ ...MONO, letterSpacing: "0.18em" }}
        >
          {meta}
        </div>
        <div
          aria-hidden
          className="mt-6 h-px w-full"
          style={{ background: HAIRLINE }}
        />
        {role.pillars?.map((pillar, i) => (
          <PillarBlock key={pillar.label + i} pillar={pillar} isFirst={i === 0} />
        ))}
      </div>
    </article>
  );
}
