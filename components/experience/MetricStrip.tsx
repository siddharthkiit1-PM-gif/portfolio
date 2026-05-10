"use client";

import { useCountUp } from "@/lib/motion/useCountUp";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE = "rgba(255,255,255,0.14)";

const HEADLINE_METRICS = [
  {
    value: "$500K",
    label: "ARR Contributed",
    context: "Market insight signals shipped 0→1 to 30+ enterprise customers",
  },
  {
    value: "+18%",
    label: "Retention Lift",
    context: "From 25+ customer interviews → prioritised onboarding fixes",
  },
  {
    value: "-98%",
    label: "Manual Ops Effort",
    context: "AI-assisted threshold workflow automating Data Ops classification",
  },
] as const;

type TileProps = {
  value: string;
  label: string;
  context: string;
  delayMs: number;
  /** When false, render the value statically (Variant B / reduced motion). */
  animate?: boolean;
};

function MetricTile({ value, label, context, delayMs, animate = true }: TileProps) {
  const { ref, display } = useCountUp<HTMLDivElement>(value, { delayMs });
  return (
    <div className="flex flex-col items-start">
      <div
        ref={animate ? ref : undefined}
        className="text-[clamp(56px,7vw,80px)] leading-none tracking-[-1.5px] text-white"
        style={{
          ...MONO,
          fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {animate ? display : value}
      </div>
      <div
        className="mt-3 text-[10.5px] text-white/55"
        style={{ ...MONO, letterSpacing: "0.28em", textTransform: "uppercase" }}
      >
        {label}
      </div>
      <div
        aria-hidden
        className="mt-4 h-px w-7"
        style={{ background: HAIRLINE }}
      />
      <p className="mt-4 max-w-[320px] text-[13px] leading-snug text-white/55">
        {context}
      </p>
    </div>
  );
}

type Props = {
  /** Set to false to render values statically (Variant B). Default true. */
  animate?: boolean;
};

export function MetricStrip({ animate = true }: Props) {
  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-3">
      {HEADLINE_METRICS.map((m, i) => (
        <MetricTile
          key={m.label}
          value={m.value}
          label={m.label}
          context={m.context}
          delayMs={i * 80}
          animate={animate}
        />
      ))}
    </div>
  );
}
