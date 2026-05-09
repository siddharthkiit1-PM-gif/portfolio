/**
 * Experience — compact career arc, choreographed into the hero dwell beat.
 *
 * Replaces ImpactChyron in the left copy column. Three single-line rows so
 * the whole block stays within the pinned viewport: dates · company · role
 * · headline metric. Editorial serif on company names + tabular nums on
 * metrics gives it a printed-CV feel that pairs with the Inter headline
 * stack above without competing.
 *
 * Rows expose `data-experience-row` so HeroPinController staggers their
 * reveal at the dwell beat (~0.86). Container starts hidden via gsap.set
 * in the controller; static / reduced-motion users see rows from first
 * paint because the controller never mounts.
 *
 * Sourced verbatim from /Users/siddharthagrawal/.../Siddharth_Agrawal_Resume.pdf:
 *   • 6sense PM 2024–•   "$100K ARR"        — market insight signals 0→1
 *   • 6sense BA 2022–24  "+18% retention"   — 25+ customer interviews
 *   • Accenture SE 2020–22 "98% ops cut"    — AI-assisted threshold workflow
 */

import { forwardRef } from "react";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
};

type Role = {
  dates: string;
  company: string;
  title: string;
  metric: string;
};

const ROLES: Role[] = [
  {
    dates: "2024 — Now",
    company: "6sense",
    title: "Product Manager",
    metric: "$100K ARR · 0 → 1",
  },
  {
    dates: "2022 — 24",
    company: "6sense",
    title: "Business Analyst",
    metric: "+18% retention",
  },
  {
    dates: "2020 — 22",
    company: "Accenture",
    title: "SE · AT&T",
    metric: "98% ops cut via AI",
  },
];

export const Experience = forwardRef<HTMLDivElement>(function Experience(_, ref) {
  return (
    <div ref={ref} data-experience className="mt-8 max-w-[640px]">
      <div className="flex items-baseline justify-between">
        <div
          className="text-[10px] text-white/45"
          style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
        >
          Experience
        </div>
        <div
          className="text-[10px] text-white/35"
          style={{ ...MONO, letterSpacing: "0.28em", textTransform: "uppercase" }}
        >
          2020 — Now
        </div>
      </div>

      <div
        aria-hidden
        className="mt-2.5 h-px w-full"
        style={{ background: "rgba(255,255,255,0.14)" }}
      />

      <ul className="flex flex-col">
        {ROLES.map((role, i) => (
          <li
            key={`${role.company}-${role.dates}`}
            data-experience-row
            className="grid grid-cols-[88px_1fr_auto] items-baseline gap-x-4 py-2.5"
            style={{
              borderBottom:
                i < ROLES.length - 1
                  ? "1px solid rgba(255,255,255,0.06)"
                  : "none",
            }}
          >
            <span
              className="text-[10.5px] text-white/45"
              style={{
                ...MONO,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {role.dates}
            </span>

            <span className="flex flex-wrap items-baseline gap-x-2">
              <span
                className="text-[17px] tracking-tight text-white"
                style={{ ...SERIF, fontWeight: 500, fontStyle: "italic" }}
              >
                {role.company}
              </span>
              <span
                className="text-[12.5px] text-white/65"
                style={{ letterSpacing: "0.02em" }}
              >
                · {role.title}
              </span>
            </span>

            <span
              className="text-[11px] text-white"
              style={{
                ...MONO,
                letterSpacing: "0.04em",
                fontVariantNumeric: "tabular-nums",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "999px",
                padding: "3px 9px",
                whiteSpace: "nowrap",
              }}
            >
              {role.metric}
            </span>
          </li>
        ))}
      </ul>

      <div
        aria-hidden
        className="h-px w-full"
        style={{ background: "rgba(255,255,255,0.14)" }}
      />

      <div
        className="mt-2 text-[10px] text-white/40"
        style={{ ...MONO, letterSpacing: "0.28em", textTransform: "uppercase" }}
      >
        KIIT University · B.Tech IT · 2016 — 2020
      </div>
    </div>
  );
});
