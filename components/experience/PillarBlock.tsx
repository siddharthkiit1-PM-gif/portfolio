"use client";

import type { RolePillar } from "@/lib/defaults/experienceRoles";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE = "rgba(255,255,255,0.10)";

type Props = {
  pillar: RolePillar;
  /** When true, omits the top hairline (used for the first pillar in a card). */
  isFirst?: boolean;
};

export function PillarBlock({ pillar, isFirst = false }: Props) {
  return (
    <section className={isFirst ? "mt-6" : "mt-8 pt-8"}
      style={!isFirst ? { borderTop: `1px solid ${HAIRLINE}` } : undefined}
    >
      <h4
        className="text-[10.5px] text-white/65"
        style={{
          ...MONO,
          fontWeight: 500,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
        }}
      >
        {pillar.label}
      </h4>
      <ul className="mt-4 flex flex-col gap-4">
        {pillar.bullets.map((bullet, i) => (
          <li
            key={i}
            className="flex gap-3 text-[15.5px] font-light leading-[1.55] text-white/85"
          >
            <span aria-hidden className="mt-[10px] block size-1 shrink-0 rounded-full bg-white/40" />
            <span>
              {bullet.metric ? (
                <>
                  <span
                    className="mr-1.5 text-white"
                    style={{ ...MONO, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                  >
                    {bullet.metric}
                  </span>
                  {bullet.text}
                </>
              ) : (
                bullet.text
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
