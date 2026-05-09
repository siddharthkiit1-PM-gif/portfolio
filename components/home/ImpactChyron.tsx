/**
 * ImpactChyron — recruiter-grade scan layer.
 *
 * Two mono lines between hairlines. Top line carries the three headline
 * numbers (revenue · retention · leverage); bottom line answers
 * "where & at what scope". Every figure is sourced verbatim from the
 * resume so the chyron passes a recruiter sniff test on its own — the
 * "no-interview-still-convinced" test.
 *
 * Intentionally calm: no chromatic split, no gradient flow, no scroll-
 * driven choreography. The cinematic copy is the show; this is the
 * exec-summary chyron underneath.
 *
 * Sourced from /Users/siddharthagrawal/.../Siddharth_Agrawal_Resume.pdf:
 *   • $100K ARR · 0 → 1 ← "Launched market insight signals from 0→1
 *     — 30+ enterprise customers, $100K ARR"
 *   • +18% RETENTION  ← "Ran 25+ customer interviews … shipped
 *     prioritised fixes that drove an 18% lift in retention"
 *   • 98% OPS CUT VIA AI ← "Built AI-assisted threshold workflow …
 *     reduced manual effort by 98%"
 */

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

export function ImpactChyron() {
  return (
    <div className="flex h-full w-full items-center">
      <div className="w-full max-w-[440px]">
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
        <ul className="flex flex-col gap-4 py-5">
          <li className="flex items-baseline justify-between gap-6">
            <span
              className="text-[18px] tracking-tight text-white sm:text-[20px] lg:text-[22px]"
              style={{
                fontVariantNumeric: "tabular-nums",
                fontWeight: 500,
              }}
            >
              $100K ARR
            </span>
            <span
              className="text-right text-[10px] text-white/55"
              style={{
                ...MONO,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              0 → 1 · Market insight signals
            </span>
          </li>
          <li className="flex items-baseline justify-between gap-6">
            <span
              className="text-[18px] tracking-tight text-white sm:text-[20px] lg:text-[22px]"
              style={{
                fontVariantNumeric: "tabular-nums",
                fontWeight: 500,
              }}
            >
              +18% retention
            </span>
            <span
              className="text-right text-[10px] text-white/55"
              style={{
                ...MONO,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              25+ customer interviews
            </span>
          </li>
          <li className="flex items-baseline justify-between gap-6">
            <span
              className="text-[18px] tracking-tight text-white sm:text-[20px] lg:text-[22px]"
              style={{
                fontVariantNumeric: "tabular-nums",
                fontWeight: 500,
              }}
            >
              98% ops cut
            </span>
            <span
              className="text-right text-[10px] text-white/55"
              style={{
                ...MONO,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              AI-assisted workflow
            </span>
          </li>
        </ul>
        <div
          aria-hidden
          className="h-px w-full"
          style={{ background: "rgba(255,255,255,0.14)" }}
        />
        <div
          className="mt-4 text-[10px] text-white/45"
          style={{ ...MONO, letterSpacing: "0.28em", textTransform: "uppercase" }}
        >
          6sense · 30+ enterprise customers
        </div>
      </div>
    </div>
  );
}
