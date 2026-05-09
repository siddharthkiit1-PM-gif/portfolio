/**
 * ImpactChyron — recruiter-grade scan layer, choreographed into the scroll.
 *
 * Three rows between hairlines. Each row carries one resume-grounded
 * outcome (revenue · retention · leverage). Lives inside the copy column
 * below the CTAs and animates in during the post-climax dwell so the
 * narrative arc reads:
 *
 *   name climax  →  "here are the receipts"  →  CTAs
 *
 * Rows expose `data-impact-row` so HeroPinController can stagger their
 * reveal at the dwell beat (~0.86). For static / reduced-motion users
 * the rows are visible at first paint — gsap.set in HeroPinController
 * only hides them when the cinematic timeline mounts.
 *
 * Sourced verbatim from /Users/siddharthagrawal/.../Siddharth_Agrawal_Resume.pdf:
 *   • $100K ARR · 0 → 1 ← "Launched market insight signals from 0→1
 *     — 30+ enterprise customers, $100K ARR"
 *   • +18% retention ← "Ran 25+ customer interviews … shipped
 *     prioritised fixes that drove an 18% lift in retention"
 *   • 98% ops cut via AI ← "Built AI-assisted threshold workflow …
 *     reduced manual effort by 98%"
 */

import { forwardRef } from "react";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const ROWS: Array<{ value: string; meta: string }> = [
  { value: "$100K ARR", meta: "0 → 1 · Market insight signals" },
  { value: "+18% retention", meta: "25+ customer interviews" },
  { value: "98% ops cut", meta: "AI-assisted workflow" },
];

export const ImpactChyron = forwardRef<HTMLDivElement>(function ImpactChyron(_, ref) {
  return (
    <div
      ref={ref}
      data-impact-chyron
      className="mt-10 max-w-[640px]"
    >
      <div
        className="text-[10px] text-white/45"
        style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
      >
        Selected impact
      </div>
      <div
        aria-hidden
        className="mt-3 h-px w-full"
        style={{ background: "rgba(255,255,255,0.14)" }}
      />
      <ul className="flex flex-col gap-3 py-4 sm:gap-4 sm:py-5">
        {ROWS.map((row) => (
          <li
            key={row.value}
            data-impact-row
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1"
          >
            <span
              className="text-[20px] tracking-tight text-white sm:text-[22px] lg:text-[24px]"
              style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}
            >
              {row.value}
            </span>
            <span
              className="text-[10px] text-white/55 sm:text-[10.5px]"
              style={{
                ...MONO,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {row.meta}
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
        className="mt-3 text-[10px] text-white/45"
        style={{ ...MONO, letterSpacing: "0.28em", textTransform: "uppercase" }}
      >
        6sense · 30+ enterprise customers
      </div>
    </div>
  );
});
