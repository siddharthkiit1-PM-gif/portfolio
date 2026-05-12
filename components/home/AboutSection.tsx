"use client";

/**
 * AboutSection — graduated from /preview/about Variant A.
 *
 * The "Receipts first" cinematic continuation: chromatic eyebrow, headline
 * with a flowing-gradient pull-word, lede prose, a four-tile metric strip
 * that leads the proof, then a two-column split — three-circle PM Venn
 * (User · Business · Technology) on the left, five-step first-principles
 * ladder on the right.
 *
 * Per CLAUDE.md every user-facing string is wrapped in `<EditableText>` so
 * the admin can rewrite copy in place. Metric tiles, Venn axis labels, and
 * process steps each have their own slot under the `about.*` namespace.
 *
 * The Venn diagram is intentionally split: SVG owns the three circles, the
 * mix-blend RGB screen, and the centroid marker; HTML overlays carry every
 * label so each one is reachable by `<EditableText>`.
 */

import { EditableText } from "@/components/editable/EditableText";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";

/* -------------------------------------------------------------------------- */
/*  Shared tokens                                                             */
/* -------------------------------------------------------------------------- */

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const TABULAR: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
};

const HAIRLINE = "rgba(255,255,255,0.14)";
const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

/* -------------------------------------------------------------------------- */
/*  Slot tables — slot ids + fallbacks live next to where they render so the  */
/*  defaults are obvious when editing.                                        */
/* -------------------------------------------------------------------------- */

type Metric = {
  slot: string;
  value: string;
  label: string;
  note: string;
};

const METRICS: Metric[] = [
  {
    slot: "metric1",
    value: "$500K",
    label: "ARR shipped from zero",
    note: "6sense signals product",
  },
  {
    slot: "metric2",
    value: "+18%",
    label: "Retention lift",
    note: "flagship product",
  },
  {
    slot: "metric3",
    value: "−98%",
    label: "Manual ops time",
    note: "AI workflow I shipped",
  },
  {
    slot: "metric4",
    value: "3",
    label: "AI products solo in 2026",
    note: "Thalify · EvalForge · Rapido",
  },
];

type VennAxis = {
  slot: "user" | "business" | "technology";
  defaultLabel: string;
  defaultSub: string;
  color: string;
};

const VENN_AXES: VennAxis[] = [
  { slot: "user", defaultLabel: "USER", defaultSub: "buyer + end-user", color: "#a78bfa" },
  { slot: "business", defaultLabel: "BUSINESS", defaultSub: "revenue · retention · efficiency", color: "#22d3ee" },
  { slot: "technology", defaultLabel: "TECHNOLOGY", defaultSub: "I ship the code", color: "#f472b6" },
];

type ProcessStep = {
  slot: string;
  n: string;
  defaultLabel: string;
  defaultBody: string;
};

const PROCESS: ProcessStep[] = [
  {
    slot: "step1",
    n: "01",
    defaultLabel: "WHY",
    defaultBody:
      "Find the problem that hurts. Not the one you can spec — the one users won't shut up about.",
  },
  {
    slot: "step2",
    n: "02",
    defaultLabel: "USER",
    defaultBody:
      "Talk to the people. What they're doing instead is the spec. Ignore the loud feature requests.",
  },
  {
    slot: "step3",
    n: "03",
    defaultLabel: "ATOMIZE",
    defaultBody:
      "Strip the problem to its smallest unit. The thing that, if true, makes the rest fall in.",
  },
  {
    slot: "step4",
    n: "04",
    defaultLabel: "SHIP",
    defaultBody:
      "Build the thinnest slice that proves the thesis. Before the slide deck is ready.",
  },
  {
    slot: "step5",
    n: "05",
    defaultLabel: "MEASURE",
    defaultBody:
      "Watch what users do, not what they say. Rewrite the next spec from the data.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Section backdrop — radial vignette + faint grid (matches Hero/Experience) */
/* -------------------------------------------------------------------------- */

function SectionBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 70% 35%, rgba(64,132,200,0.10) 0%, rgba(64,132,200,0.03) 35%, transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 80px), repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 80px)",
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  AboutSection                                                              */
/* -------------------------------------------------------------------------- */

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative isolate overflow-hidden bg-[#05060a] py-[clamp(96px,14vh,160px)] text-white scroll-mt-24"
      style={
        {
          // Non-zero defaults so the chromatic + gradient primitives show
          // outside the hero timeline. Hero drives these dynamically; this
          // section is static.
          ["--ka-split" as string]: "0.55",
          ["--ka-grad" as string]: "55%",
        } as React.CSSProperties
      }
    >
      <SectionBackdrop />

      <div className="relative mx-auto max-w-[1180px] px-6 sm:px-6 lg:px-10">
        {/* Chapter marker */}
        <div
          className="flex items-center gap-3 text-[10px] text-white/45"
          style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
        >
          <span className="h-px w-8" style={{ background: HAIRLINE }} aria-hidden />
          <ChromaticText amount={0.4}>
            <EditableText
              page="home"
              slot="about.eyebrow"
              fallback="About · Chapter 02"
              as="span"
              singleLine
            />
          </ChromaticText>
        </div>

        {/* Headline */}
        <h2
          className="mt-5 max-w-[860px] text-[40px] leading-[1.04] tracking-[-1.5px] text-white sm:text-[56px] lg:text-[clamp(48px,6vw,72px)] lg:tracking-[-2.5px]"
          style={{
            fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 300,
          }}
        >
          <EditableText
            page="home"
            slot="about.headline.line1.before"
            fallback="The PM "
            as="span"
            singleLine
          />
          <em className="not-italic" style={{ fontWeight: 500 }}>
            <FlowingGradientText>
              <EditableText
                page="home"
                slot="about.headline.line1.pull"
                fallback="Venn diagram"
                as="span"
                singleLine
              />
            </FlowingGradientText>
          </em>
          <EditableText
            page="home"
            slot="about.headline.line1.after"
            fallback="."
            as="span"
            singleLine
          />
          <br />
          <EditableText
            page="home"
            slot="about.headline.line2"
            fallback="Mine isn't a claim — it's a working history."
            as="span"
            singleLine
          />
        </h2>

        {/* Lede */}
        <p
          className="mt-6 max-w-[700px] text-base leading-[1.55] text-white/75 lg:text-[17px]"
          style={TABULAR}
        >
          <EditableText
            page="home"
            slot="about.lede"
            fallback="5 years in software. 3.5 as a PM. 2 as a backend engineer before that. 3 AI products shipped solo in 2026. The intersection of user, business, and technology isn't a slide for me — it's a workbench I've been at since 2018."
            as="span"
          />
        </p>

        {/* Metric strip — leads the proof */}
        <div className="mt-12">
          <MetricStrip />
        </div>

        {/* Venn + process: two-column on desktop, stacked on mobile */}
        <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <SubsectionEyebrow slot="about.venn.eyebrow" fallback="The intersection · 03 axes" />
            <VennDiagram />
          </div>
          <div>
            <SubsectionEyebrow slot="about.process.eyebrow" fallback="How I work · 05 steps" />
            <h3
              className="mt-3 max-w-[420px] text-[26px] leading-[1.1] tracking-[-0.5px] text-white lg:text-[32px]"
              style={{
                fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
                fontWeight: 300,
              }}
            >
              <EditableText
                page="home"
                slot="about.process.headline.before"
                fallback="I don't start with a roadmap. "
                as="span"
                singleLine
              />
              <em className="not-italic" style={{ fontWeight: 500 }}>
                <FlowingGradientText>
                  <EditableText
                    page="home"
                    slot="about.process.headline.pull"
                    fallback="I start with the why."
                    as="span"
                    singleLine
                  />
                </FlowingGradientText>
              </em>
            </h3>
            <ProcessFlow />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SubsectionEyebrow                                                         */
/* -------------------------------------------------------------------------- */

function SubsectionEyebrow({ slot, fallback }: { slot: string; fallback: string }) {
  return (
    <div
      className="flex items-center gap-3 text-[10px] text-white/50"
      style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
    >
      <span className="size-1.5 rounded-full bg-violet-400" aria-hidden />
      <EditableText page="home" slot={slot} fallback={fallback} as="span" singleLine />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  MetricStrip — four-tile receipts row                                      */
/* -------------------------------------------------------------------------- */

function MetricStrip() {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-0">
      {METRICS.map((m, i) => (
        <div
          key={m.slot}
          className={["relative px-0 lg:px-6", i > 0 ? "lg:border-l" : ""].join(" ")}
          style={i > 0 ? { borderColor: HAIRLINE_FAINT } : undefined}
        >
          <div
            className="text-[40px] leading-none text-white lg:text-[52px]"
            style={{
              ...TABULAR,
              fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 300,
              letterSpacing: "-1.5px",
            }}
          >
            <ChromaticText amount={0.5}>
              <EditableText
                page="home"
                slot={`about.${m.slot}.value`}
                fallback={m.value}
                as="span"
                singleLine
              />
            </ChromaticText>
          </div>
          <div className="mt-3 text-[13px] leading-snug text-white/80">
            <EditableText
              page="home"
              slot={`about.${m.slot}.label`}
              fallback={m.label}
              as="span"
              singleLine
            />
          </div>
          <div
            className="mt-1 text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            <EditableText
              page="home"
              slot={`about.${m.slot}.note`}
              fallback={m.note}
              as="span"
              singleLine
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ProcessFlow — numbered first-principles ladder                            */
/* -------------------------------------------------------------------------- */

function ProcessFlow() {
  return (
    <ol className="mt-6 space-y-5">
      {PROCESS.map((step, i) => (
        <li key={step.slot} className="relative flex gap-5">
          {/* Index gutter */}
          <div className="flex flex-col items-center">
            <div
              className="flex size-9 items-center justify-center rounded-full border text-[12px] text-white/85"
              style={{
                ...MONO,
                ...TABULAR,
                borderColor: HAIRLINE,
                background: "rgba(255,255,255,0.025)",
              }}
            >
              {step.n}
            </div>
            {i < PROCESS.length - 1 && (
              <div
                className="mt-1 w-px flex-1"
                style={{ background: HAIRLINE_FAINT, minHeight: 36 }}
                aria-hidden
              />
            )}
          </div>
          {/* Content */}
          <div className="flex-1 pb-2">
            <div className="text-[11px] tracking-[0.3em] text-violet-300/90" style={MONO}>
              <EditableText
                page="home"
                slot={`about.${step.slot}.label`}
                fallback={step.defaultLabel}
                as="span"
                singleLine
              />
            </div>
            <p className="mt-1.5 max-w-[520px] text-[14.5px] leading-[1.5] text-white/85">
              <EditableText
                page="home"
                slot={`about.${step.slot}.body`}
                fallback={step.defaultBody}
                as="span"
              />
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/*  VennDiagram                                                               */
/*  SVG renders the three filled circles + centroid marker; HTML overlays     */
/*  carry every textual label so each is editable via `<EditableText>`.      */
/* -------------------------------------------------------------------------- */

const CIRCLES = {
  user: { cx: 215, cy: 195, r: 115 },
  business: { cx: 385, cy: 195, r: 115 },
  technology: { cx: 300, cy: 340, r: 115 },
};

// Label anchors expressed as % of the SVG viewBox (600×500) so HTML overlays
// align with the SVG regardless of container size.
const LABEL_ANCHORS = {
  user: { left: "22.5%", top: "20%", align: "start" as const },
  business: { left: "77.5%", top: "20%", align: "end" as const },
  technology: { left: "50%", top: "92%", align: "middle" as const },
  center: { left: "50%", top: "59%", align: "middle" as const },
};

function VennDiagram() {
  return (
    <div className="relative mt-5 w-full max-w-[560px]" style={{ aspectRatio: "600 / 500" }}>
      <svg
        viewBox="0 0 600 500"
        className="absolute inset-0 block h-full w-full"
        aria-label="PM Venn diagram — User, Business, Technology"
      >
        <g style={{ mixBlendMode: "screen" }}>
          <circle
            cx={CIRCLES.user.cx}
            cy={CIRCLES.user.cy}
            r={CIRCLES.user.r}
            fill={VENN_AXES[0].color}
            fillOpacity={0.42}
          />
          <circle
            cx={CIRCLES.business.cx}
            cy={CIRCLES.business.cy}
            r={CIRCLES.business.r}
            fill={VENN_AXES[1].color}
            fillOpacity={0.42}
          />
          <circle
            cx={CIRCLES.technology.cx}
            cy={CIRCLES.technology.cy}
            r={CIRCLES.technology.r}
            fill={VENN_AXES[2].color}
            fillOpacity={0.42}
          />
        </g>

        {/* Centroid marker */}
        <circle cx={300} cy={243} r={5} fill="#ffffff" />
        <circle cx={300} cy={243} r={14} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />

        {/* Connector from centroid to the "WHERE I WORK" callout below it */}
        <line x1={300} y1={257} x2={300} y2={282} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
      </svg>

      {/* HTML label overlays */}
      <VennAxisLabel
        anchor={LABEL_ANCHORS.user}
        color={VENN_AXES[0].color}
        labelSlot="about.venn.user.label"
        labelFallback={VENN_AXES[0].defaultLabel}
        subSlot="about.venn.user.sub"
        subFallback={VENN_AXES[0].defaultSub}
      />
      <VennAxisLabel
        anchor={LABEL_ANCHORS.business}
        color={VENN_AXES[1].color}
        labelSlot="about.venn.business.label"
        labelFallback={VENN_AXES[1].defaultLabel}
        subSlot="about.venn.business.sub"
        subFallback={VENN_AXES[1].defaultSub}
      />
      <VennAxisLabel
        anchor={LABEL_ANCHORS.technology}
        color={VENN_AXES[2].color}
        labelSlot="about.venn.technology.label"
        labelFallback={VENN_AXES[2].defaultLabel}
        subSlot="about.venn.technology.sub"
        subFallback={VENN_AXES[2].defaultSub}
      />

      {/* Center callout — the punchline */}
      <div
        className="pointer-events-none absolute -translate-x-1/2 text-center"
        style={{
          left: LABEL_ANCHORS.center.left,
          top: LABEL_ANCHORS.center.top,
        }}
      >
        <div
          className="text-[11px] text-white"
          style={{ ...MONO, letterSpacing: "0.22em", textTransform: "uppercase" }}
        >
          <EditableText
            page="home"
            slot="about.venn.center"
            fallback="Where I work"
            as="span"
            singleLine
          />
        </div>
      </div>
    </div>
  );
}

function VennAxisLabel({
  anchor,
  color,
  labelSlot,
  labelFallback,
  subSlot,
  subFallback,
}: {
  anchor: { left: string; top: string; align: "start" | "middle" | "end" };
  color: string;
  labelSlot: string;
  labelFallback: string;
  subSlot: string;
  subFallback: string;
}) {
  // Translate the SVG text-anchor semantics to HTML transform so the labels
  // hang off the circles the same way the SVG <text> did.
  const transformX =
    anchor.align === "start" ? "0%" : anchor.align === "end" ? "-100%" : "-50%";
  const textAlign =
    anchor.align === "start" ? "left" : anchor.align === "end" ? "right" : "center";
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: anchor.left,
        top: anchor.top,
        transform: `translate(${transformX}, -50%)`,
        textAlign,
      }}
    >
      <div
        className="text-[11px]"
        style={{
          ...MONO,
          color,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          filter: `drop-shadow(0 0 8px ${color}40)`,
        }}
      >
        <EditableText page="home" slot={labelSlot} fallback={labelFallback} as="span" singleLine />
      </div>
      <div
        className="mt-1 text-[10px] text-white/55"
        style={{ ...MONO, letterSpacing: "0.08em" }}
      >
        <EditableText page="home" slot={subSlot} fallback={subFallback} as="span" singleLine />
      </div>
    </div>
  );
}
