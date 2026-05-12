"use client";

/**
 * AboutSection — Variant A (polished).
 *
 * The "Receipts first" cinematic continuation of the hero. Chromatic eyebrow,
 * a two-line headline with a flowing-gradient pull-word, a lede paragraph,
 * a four-tile receipts strip with chromatic numerals, then a two-column
 * split — three-circle PM Venn (User · Business · Technology) on the left,
 * five-step first-principles ladder on the right — closed by an italic
 * serif punctuation line that re-anchors the year.
 *
 * Polish layer (vs. the original Variant A graduation):
 *   • RECEIPTS eyebrow with chromatic dot above the metric strip so it reads
 *     as its own editorial beat rather than a sub-result of the lede.
 *   • Cagan-risk italic-serif kickers under each Venn axis label
 *     (desirability · viability · feasibility) — the PM lens, made literal.
 *   • A second-line italic serif "here." under the centroid callout — the
 *     editorial punctuation that B used, ported back into A's filled-circle
 *     stage so the centroid earns its weight without losing the chromatic
 *     RGB-screen look that's A's signature.
 *   • Closing italic serif sentence "Built this way since 2018." right-
 *     aligned under a hairline rule, acting as the section's full stop.
 *
 * Per CLAUDE.md every user-facing string is wrapped in `<EditableText>` so
 * the admin can rewrite copy in place. Metric tiles, Venn axis labels, and
 * process steps each have their own slot under the `about.*` namespace.
 *
 * The Venn diagram is intentionally split: SVG owns the three filled
 * circles (mix-blend-screen RGB), the centroid marker, and the connector
 * to the callout; HTML overlays carry every label so each one is reachable
 * by `<EditableText>`.
 *
 * Variant B (Editorial · first-principles magazine essay) is preserved at
 * the bottom of this file as line-commented code so we can swap back by
 * uncommenting and replacing the export. See the marker block.
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

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
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
  defaultRisk: string;
  defaultSub: string;
  color: string;
};

const VENN_AXES: VennAxis[] = [
  {
    slot: "user",
    defaultLabel: "USER",
    defaultRisk: "desirability",
    defaultSub: "buyer + end-user",
    color: "#a78bfa",
  },
  {
    slot: "business",
    defaultLabel: "BUSINESS",
    defaultRisk: "viability",
    defaultSub: "revenue · retention",
    color: "#22d3ee",
  },
  {
    slot: "technology",
    defaultLabel: "TECHNOLOGY",
    defaultRisk: "feasibility",
    defaultSub: "I ship the code",
    color: "#f472b6",
  },
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
        {/* Chapter marker — chromatic eyebrow */}
        <div
          className="flex items-center gap-3 text-[10px] text-white/45"
          style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
        >
          <span className="h-px w-8" style={{ background: HAIRLINE }} aria-hidden />
          <ChromaticText amount={0.4}>
            <EditableText
              page="home"
              slot="about.eyebrow"
              fallback="About"
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
            fallback="5 years in software. 3.5 as a PM. 2 as a backend engineer before that. 3 AI products shipped solo in 2026. The intersection of user, business, and technology isn't a slide for me — it's a workbench I've been at since 2022."
            as="span"
          />
        </p>

        {/* RECEIPTS strip — own editorial beat */}
        <div className="mt-14">
          <SubsectionEyebrow slot="about.receipts.eyebrow" fallback="Receipts · 04 metrics" />
          <div className="mt-6">
            <MetricStrip />
          </div>
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

        {/* Closing punctuation — italic serif, right-aligned under hairline */}
        <div className="mt-20">
          <div className="h-px w-full" style={{ background: HAIRLINE_FAINT }} aria-hidden />
          <p
            className="mt-6 text-right text-[18px] text-white/65 lg:text-[20px]"
            style={{ ...SERIF_ITALIC, fontWeight: 400 }}
          >
            <EditableText
              page="home"
              slot="about.closing"
              fallback="Built this way since 2022."
              as="span"
              singleLine
            />
          </p>
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
      {/* Ambient bloom backdrop — atmospheric color behind the stage */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 45%, rgba(167,139,250,0.10) 0%, rgba(34,211,238,0.05) 35%, transparent 75%)",
          filter: "blur(20px)",
        }}
      />

      {/* Animation keyframes — gated by prefers-reduced-motion */}
      <style>{`
        @keyframes ka-venn-breathe-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-1.5px, -1px); }
        }
        @keyframes ka-venn-breathe-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(1.5px, -1px); }
        }
        @keyframes ka-venn-breathe-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(0, 2px); }
        }
        @keyframes ka-venn-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ka-venn-halo {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08); }
        }
        .ka-venn-breathe-1,
        .ka-venn-breathe-2,
        .ka-venn-breathe-3,
        .ka-venn-orbit,
        .ka-venn-halo {
          transform-box: fill-box;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: no-preference) {
          .ka-venn-breathe-1 { animation: ka-venn-breathe-1 8s ease-in-out infinite; }
          .ka-venn-breathe-2 { animation: ka-venn-breathe-2 9s ease-in-out infinite; }
          .ka-venn-breathe-3 { animation: ka-venn-breathe-3 10s ease-in-out infinite; }
          .ka-venn-orbit { animation: ka-venn-orbit 30s linear infinite; }
          .ka-venn-halo { animation: ka-venn-halo 3.5s ease-in-out infinite; }
        }
      `}</style>

      <svg
        viewBox="0 0 600 500"
        className="absolute inset-0 block h-full w-full"
        aria-label="PM Venn diagram — User, Business, Technology"
      >
        <defs>
          {/* Radial gradient fills — bright core fading to a soft edge so the
              intersections bloom under mix-blend-screen without flat seams. */}
          <radialGradient id="ka-venn-user-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={VENN_AXES[0].color} stopOpacity="0.55" />
            <stop offset="70%" stopColor={VENN_AXES[0].color} stopOpacity="0.42" />
            <stop offset="100%" stopColor={VENN_AXES[0].color} stopOpacity="0.08" />
          </radialGradient>
          <radialGradient id="ka-venn-business-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={VENN_AXES[1].color} stopOpacity="0.55" />
            <stop offset="70%" stopColor={VENN_AXES[1].color} stopOpacity="0.42" />
            <stop offset="100%" stopColor={VENN_AXES[1].color} stopOpacity="0.08" />
          </radialGradient>
          <radialGradient id="ka-venn-technology-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={VENN_AXES[2].color} stopOpacity="0.55" />
            <stop offset="70%" stopColor={VENN_AXES[2].color} stopOpacity="0.42" />
            <stop offset="100%" stopColor={VENN_AXES[2].color} stopOpacity="0.08" />
          </radialGradient>
          {/* Centroid halo — white core fading to transparent */}
          <radialGradient id="ka-venn-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* === Technical filigree (very faint, behind circles) === */}
        {/* Centroid crosshair — horizontal + vertical axes through (300, 243) */}
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" fill="none">
          <line x1="0" y1="243" x2="600" y2="243" strokeDasharray="2 5" />
          <line x1="300" y1="0" x2="300" y2="500" strokeDasharray="2 5" />
        </g>

        {/* Corner registration ticks — technical-drawing frame */}
        <g stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" fill="none">
          <path d="M 6 18 L 6 6 L 18 6" />
          <path d="M 594 18 L 594 6 L 582 6" />
          <path d="M 6 482 L 6 494 L 18 494" />
          <path d="M 594 482 L 594 494 L 582 494" />
        </g>

        {/* Registration "+" marks at each circle center */}
        <g stroke="rgba(255,255,255,0.28)" strokeWidth="0.75">
          <line x1="209" y1="195" x2="221" y2="195" />
          <line x1="215" y1="189" x2="215" y2="201" />
          <line x1="379" y1="195" x2="391" y2="195" />
          <line x1="385" y1="189" x2="385" y2="201" />
          <line x1="294" y1="340" x2="306" y2="340" />
          <line x1="300" y1="334" x2="300" y2="346" />
        </g>

        {/* === Circles — radial-gradient fills with hairline edge stroke,
               blended via mix-blend-screen and individually "breathing" === */}
        <g style={{ mixBlendMode: "screen" }}>
          <g className="ka-venn-breathe-1">
            <circle
              cx={CIRCLES.user.cx}
              cy={CIRCLES.user.cy}
              r={CIRCLES.user.r}
              fill="url(#ka-venn-user-fill)"
            />
            <circle
              cx={CIRCLES.user.cx}
              cy={CIRCLES.user.cy}
              r={CIRCLES.user.r}
              fill="none"
              stroke={VENN_AXES[0].color}
              strokeOpacity="0.55"
              strokeWidth="0.75"
            />
          </g>
          <g className="ka-venn-breathe-2">
            <circle
              cx={CIRCLES.business.cx}
              cy={CIRCLES.business.cy}
              r={CIRCLES.business.r}
              fill="url(#ka-venn-business-fill)"
            />
            <circle
              cx={CIRCLES.business.cx}
              cy={CIRCLES.business.cy}
              r={CIRCLES.business.r}
              fill="none"
              stroke={VENN_AXES[1].color}
              strokeOpacity="0.55"
              strokeWidth="0.75"
            />
          </g>
          <g className="ka-venn-breathe-3">
            <circle
              cx={CIRCLES.technology.cx}
              cy={CIRCLES.technology.cy}
              r={CIRCLES.technology.r}
              fill="url(#ka-venn-technology-fill)"
            />
            <circle
              cx={CIRCLES.technology.cx}
              cy={CIRCLES.technology.cy}
              r={CIRCLES.technology.r}
              fill="none"
              stroke={VENN_AXES[2].color}
              strokeOpacity="0.55"
              strokeWidth="0.75"
            />
          </g>
        </g>

        {/* === Centroid (the protagonist) === */}
        {/* Outer pulsing halo */}
        <circle
          cx="300"
          cy="243"
          r="28"
          fill="url(#ka-venn-halo)"
          className="ka-venn-halo"
        />
        {/* Slowly orbiting dashed ring */}
        <g className="ka-venn-orbit" style={{ transformOrigin: "300px 243px" }}>
          <circle
            cx="300"
            cy="243"
            r="20"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.75"
            strokeDasharray="2 3"
          />
        </g>
        {/* Solid inner ring */}
        <circle
          cx="300"
          cy="243"
          r="12"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1"
        />
        {/* Chromatic core — RGB-split echo of the ChromaticText primitive */}
        <g style={{ mixBlendMode: "screen" }}>
          <circle cx="298.5" cy="243" r="3" fill="#22d3ee" />
          <circle cx="301.5" cy="243" r="3" fill="#f472b6" />
        </g>
        <circle cx="300" cy="243" r="3" fill="#ffffff" />

        {/* === Connector to "WHERE I WORK" callout === */}
        <line
          x1="300"
          y1="271"
          x2="300"
          y2="286"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="0.75"
          strokeDasharray="2 2"
        />
        <circle cx="300" cy="286" r="2" fill="rgba(255,255,255,0.8)" />
      </svg>

      {/* HTML label overlays */}
      <VennAxisLabel
        anchor={LABEL_ANCHORS.user}
        color={VENN_AXES[0].color}
        labelSlot="about.venn.user.label"
        labelFallback={VENN_AXES[0].defaultLabel}
        riskSlot="about.venn.user.risk"
        riskFallback={VENN_AXES[0].defaultRisk}
        subSlot="about.venn.user.sub"
        subFallback={VENN_AXES[0].defaultSub}
      />
      <VennAxisLabel
        anchor={LABEL_ANCHORS.business}
        color={VENN_AXES[1].color}
        labelSlot="about.venn.business.label"
        labelFallback={VENN_AXES[1].defaultLabel}
        riskSlot="about.venn.business.risk"
        riskFallback={VENN_AXES[1].defaultRisk}
        subSlot="about.venn.business.sub"
        subFallback={VENN_AXES[1].defaultSub}
      />
      <VennAxisLabel
        anchor={LABEL_ANCHORS.technology}
        color={VENN_AXES[2].color}
        labelSlot="about.venn.technology.label"
        labelFallback={VENN_AXES[2].defaultLabel}
        riskSlot="about.venn.technology.risk"
        riskFallback={VENN_AXES[2].defaultRisk}
        subSlot="about.venn.technology.sub"
        subFallback={VENN_AXES[2].defaultSub}
      />

      {/* Center callout — the punchline + italic serif punctuation */}
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
        <div
          className="mt-1 text-[14px] text-white/85"
          style={{ ...SERIF_ITALIC, fontWeight: 400 }}
        >
          <EditableText
            page="home"
            slot="about.venn.centerPunctuation"
            fallback="here."
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
  riskSlot,
  riskFallback,
  subSlot,
  subFallback,
}: {
  anchor: { left: string; top: string; align: "start" | "middle" | "end" };
  color: string;
  labelSlot: string;
  labelFallback: string;
  riskSlot: string;
  riskFallback: string;
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
      {/* Uppercase axis label — chromatic-tinted */}
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
      {/* Cagan risk — italic serif */}
      <div
        className="mt-0.5 text-[11px] text-white/65"
        style={{ ...SERIF_ITALIC, fontWeight: 400 }}
      >
        <EditableText page="home" slot={riskSlot} fallback={riskFallback} as="span" singleLine />
      </div>
      {/* Sub — mono */}
      <div
        className="mt-0.5 text-[10px] text-white/45"
        style={{ ...MONO, letterSpacing: "0.08em" }}
      >
        <EditableText page="home" slot={subSlot} fallback={subFallback} as="span" singleLine />
      </div>
    </div>
  );
}

/* ==========================================================================
 * VARIANT B (commented — preserved for easy swap-back)
 * --------------------------------------------------------------------------
 * The Editorial · first-principles magazine-essay variant. To swap back:
 *   1. Uncomment the block below (remove the leading `// ` from each line)
 *   2. Delete or rename the AboutSection export above
 *   3. The export at the bottom of the uncommented block becomes the new
 *      active component
 *
 * (The block below is purely commented source — it does not execute.)
 * ==========================================================================
 */

// "use client";
// 
// /**
//  * AboutSection — graduated from /preview/about Variant B.
//  *
//  * The "Editorial · first-principles" direction. Reads like a magazine
//  * essay rather than a product page:
//  *   • Display serif headline (ui-serif "New York")
//  *   • Italic serif sub-question right under it
//  *   • Two-column body — narrative lede on the left with inline bold
//  *     tabular metrics, FIG. 01 Venn diagram on the right
//  *   • FIG. 02 process ladder — serif-italic step labels paired with
//  *     monospace function-style markers and a longer body paragraph each
//  *   • FIG. 03 receipts table — four metrics in a tabular ledger
//  *
//  * The Venn uses Marty Cagan's three risks (desirability / viability /
//  * feasibility) as the editorial annotation, with Technology (= I ship
//  * the code) carrying the weight that separates this PM from the field.
//  *
//  * Per CLAUDE.md every user-facing string is wrapped in `<EditableText>`
//  * so the admin can rewrite copy in place. The Venn axis labels are
//  * rendered as HTML overlays on top of the SVG so each is reachable.
//  */
// 
// import { EditableText } from "@/components/editable/EditableText";
// 
// /* -------------------------------------------------------------------------- */
// /*  Shared tokens                                                             */
// /* -------------------------------------------------------------------------- */
// 
// const MONO: React.CSSProperties = {
//   fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
// };
// 
// const SERIF: React.CSSProperties = {
//   fontFamily:
//     'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
// };
// 
// const SERIF_ITALIC: React.CSSProperties = {
//   ...SERIF,
//   fontStyle: "italic",
// };
// 
// const TABULAR: React.CSSProperties = {
//   fontVariantNumeric: "tabular-nums",
// };
// 
// const HAIRLINE = "rgba(255,255,255,0.14)";
// const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";
// 
// /* -------------------------------------------------------------------------- */
// /*  Slot tables                                                               */
// /* -------------------------------------------------------------------------- */
// 
// type Metric = { slot: string; value: string; label: string; note: string };
// 
// const METRICS: Metric[] = [
//   {
//     slot: "metric1",
//     value: "$500K",
//     label: "ARR shipped from zero",
//     note: "6sense signals product",
//   },
//   {
//     slot: "metric2",
//     value: "+18%",
//     label: "Retention lift",
//     note: "flagship product",
//   },
//   {
//     slot: "metric3",
//     value: "−98%",
//     label: "Manual ops time",
//     note: "AI workflow I shipped",
//   },
//   {
//     slot: "metric4",
//     value: "3",
//     label: "AI products solo in 2026",
//     note: "Thalify · EvalForge · Rapido",
//   },
// ];
// 
// type VennAxis = {
//   slot: "user" | "business" | "technology";
//   defaultLabel: string;
//   defaultRisk: string;
//   defaultSub: string;
//   color: string;
// };
// 
// const VENN_AXES: VennAxis[] = [
//   {
//     slot: "user",
//     defaultLabel: "USER",
//     defaultRisk: "desirability —",
//     defaultSub: "buyer + end-user",
//     color: "#a78bfa",
//   },
//   {
//     slot: "business",
//     defaultLabel: "BUSINESS",
//     defaultRisk: "— viability",
//     defaultSub: "revenue · retention",
//     color: "#22d3ee",
//   },
//   {
//     slot: "technology",
//     defaultLabel: "TECHNOLOGY",
//     defaultRisk: "feasibility",
//     defaultSub: "I ship the code",
//     color: "#f472b6",
//   },
// ];
// 
// type ProcessStep = {
//   slot: string;
//   n: string;
//   defaultLabel: string;
//   defaultBody: string;
// };
// 
// const PROCESS: ProcessStep[] = [
//   {
//     slot: "step1",
//     n: "01",
//     defaultLabel: "why",
//     defaultBody:
//       "Find the problem that hurts. Not the one you can spec — the one users won't shut up about.",
//   },
//   {
//     slot: "step2",
//     n: "02",
//     defaultLabel: "user",
//     defaultBody:
//       "Talk to the people. What they're doing instead is the spec. Ignore the loud feature requests.",
//   },
//   {
//     slot: "step3",
//     n: "03",
//     defaultLabel: "atomize",
//     defaultBody:
//       "Strip the problem to its smallest unit. The thing that, if true, makes the rest fall in.",
//   },
//   {
//     slot: "step4",
//     n: "04",
//     defaultLabel: "ship",
//     defaultBody:
//       "Build the thinnest slice that proves the thesis. Before the slide deck is ready.",
//   },
//   {
//     slot: "step5",
//     n: "05",
//     defaultLabel: "measure",
//     defaultBody:
//       "Watch what users do, not what they say. Rewrite the next spec from the data.",
//   },
// ];
// 
// /* -------------------------------------------------------------------------- */
// /*  Section backdrop                                                          */
// /* -------------------------------------------------------------------------- */
// 
// function SectionBackdrop() {
//   return (
//     <>
//       <div
//         aria-hidden
//         className="pointer-events-none absolute inset-0"
//         style={{
//           background:
//             "radial-gradient(ellipse at 70% 35%, rgba(64,132,200,0.10) 0%, rgba(64,132,200,0.03) 35%, transparent 65%)",
//         }}
//       />
//       <div
//         aria-hidden
//         className="pointer-events-none absolute inset-0"
//         style={{
//           backgroundImage:
//             "repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 80px), repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 80px)",
//         }}
//       />
//     </>
//   );
// }
// 
// /* -------------------------------------------------------------------------- */
// /*  AboutSection                                                              */
// /* -------------------------------------------------------------------------- */
// 
// export function AboutSection() {
//   return (
//     <section
//       id="about"
//       className="relative isolate overflow-hidden bg-[#05060a] py-[clamp(96px,14vh,160px)] text-white scroll-mt-24"
//     >
//       <SectionBackdrop />
// 
//       <div className="relative mx-auto max-w-[1100px] px-6 sm:px-6 lg:px-10">
//         {/* Chapter marker */}
//         <div className="flex items-center gap-4 text-[10px] text-white/45">
//           <span style={{ ...MONO, letterSpacing: "0.32em" }}>
//             <EditableText
//               page="home"
//               slot="about.chapter"
//               fallback="CHAPTER 02"
//               as="span"
//               singleLine
//             />
//           </span>
//           <span className="h-px w-10" style={{ background: HAIRLINE }} aria-hidden />
//           <span style={{ ...MONO, letterSpacing: "0.32em" }}>
//             <EditableText
//               page="home"
//               slot="about.eyebrow"
//               fallback="FROM FIRST PRINCIPLES"
//               as="span"
//               singleLine
//             />
//           </span>
//         </div>
// 
//         {/* Serif headline */}
//         <h2
//           className="mt-8 max-w-[820px] text-[48px] leading-[1.02] tracking-[-1px] text-white sm:text-[68px] lg:text-[clamp(56px,7vw,92px)]"
//           style={{ ...SERIF, fontWeight: 400 }}
//         >
//           <EditableText
//             page="home"
//             slot="about.headline"
//             fallback="Every product starts with one question."
//             as="span"
//           />
//         </h2>
// 
//         {/* Italic serif sub-question */}
//         <p
//           className="mt-5 max-w-[640px] text-[20px] leading-[1.35] text-white/70 lg:text-[24px]"
//           style={{ ...SERIF_ITALIC, fontWeight: 400 }}
//         >
//           <EditableText
//             page="home"
//             slot="about.subheadline"
//             fallback="Why is this broken, and who has been waiting for someone to fix it?"
//             as="span"
//           />
//         </p>
// 
//         {/* Two-column body — narrative lede + FIG. 01 Venn */}
//         <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
//           <div className="max-w-[560px]">
//             <p
//               className="text-[16px] leading-[1.7] text-white/85 lg:text-[17.5px]"
//               style={TABULAR}
//             >
//               <EditableText
//                 page="home"
//                 slot="about.lede1"
//                 fallback="I'm a PM who codes. Three and a half years writing PRDs for B2B SaaS — two years before that writing the backend the PRDs were aimed at. I don't translate between product and engineering; I think in both."
//                 as="span"
//               />
//             </p>
//             <p
//               className="mt-5 text-[16px] leading-[1.7] text-white/85 lg:text-[17.5px]"
//               style={TABULAR}
//             >
//               <EditableText
//                 page="home"
//                 slot="about.lede2.before"
//                 fallback="The reason most products miss isn't strategy — it's that nobody walked the problem down to its atoms. So I do that first. The signals product I owned at 6sense went "
//                 as="span"
//               />
//               <strong className="text-white" style={TABULAR}>
//                 <EditableText
//                   page="home"
//                   slot="about.lede2.metric1"
//                   fallback="$0 → $500K"
//                   as="span"
//                   singleLine
//                 />
//               </strong>
//               <EditableText
//                 page="home"
//                 slot="about.lede2.mid1"
//                 fallback=" ARR because the spec started with eight buyer interviews and ended in one sentence. Retention lifted "
//                 as="span"
//               />
//               <strong className="text-white" style={TABULAR}>
//                 <EditableText
//                   page="home"
//                   slot="about.lede2.metric2"
//                   fallback="+18%"
//                   as="span"
//                   singleLine
//                 />
//               </strong>
//               <EditableText
//                 page="home"
//                 slot="about.lede2.mid2"
//                 fallback=" the same way. Manual ops dropped "
//                 as="span"
//               />
//               <strong className="text-white" style={TABULAR}>
//                 <EditableText
//                   page="home"
//                   slot="about.lede2.metric3"
//                   fallback="−98%"
//                   as="span"
//                   singleLine
//                 />
//               </strong>
//               <EditableText
//                 page="home"
//                 slot="about.lede2.after"
//                 fallback={
//                   " with an AI workflow I shipped end-to-end — and three AI products went live solo in 2026 because the bar between “spec” and “ship” is, for me, a few days of code."
//                 }
//                 as="span"
//               />
//             </p>
//           </div>
// 
//           {/* FIG. 01 — Venn */}
//           <div className="self-start">
//             <FigureLabel slot="about.venn.figLabel" fallback="FIG. 01 — THE INTERSECTION" />
//             <VennDiagram />
//           </div>
//         </div>
// 
//         {/* FIG. 02 — first-principles ladder */}
//         <div className="mt-20">
//           <FigureLabel slot="about.process.figLabel" fallback="FIG. 02 — THE LADDER" />
//           <h3
//             className="mt-2 max-w-[640px] text-[28px] leading-[1.1] tracking-[-0.4px] text-white lg:text-[36px]"
//             style={{ ...SERIF, fontWeight: 400 }}
//           >
//             <EditableText
//               page="home"
//               slot="about.process.headline"
//               fallback="How I walk the problem to its atoms."
//               as="span"
//             />
//           </h3>
//           <ProcessFlow />
//         </div>
// 
//         {/* FIG. 03 — receipts table */}
//         <div className="mt-20">
//           <FigureLabel slot="about.receipts.figLabel" fallback="FIG. 03 — THE RECEIPTS" />
//           <MetricStrip />
//         </div>
//       </div>
//     </section>
//   );
// }
// 
// /* -------------------------------------------------------------------------- */
// /*  FigureLabel — monospace "FIG. NN — TITLE" stamp                           */
// /* -------------------------------------------------------------------------- */
// 
// function FigureLabel({ slot, fallback }: { slot: string; fallback: string }) {
//   return (
//     <div
//       className="text-[10px] text-white/45"
//       style={{ ...MONO, letterSpacing: "0.32em" }}
//     >
//       <EditableText page="home" slot={slot} fallback={fallback} as="span" singleLine />
//     </div>
//   );
// }
// 
// /* -------------------------------------------------------------------------- */
// /*  ProcessFlow — magazine-style step ladder                                  */
// /* -------------------------------------------------------------------------- */
// 
// function ProcessFlow() {
//   return (
//     <ol className="mt-10 space-y-0">
//       {PROCESS.map((step, i) => (
//         <li
//           key={step.slot}
//           className="grid grid-cols-[64px_minmax(0,1fr)] gap-6 border-t py-6 lg:grid-cols-[80px_220px_minmax(0,1fr)] lg:gap-8"
//           style={{
//             borderColor: HAIRLINE_FAINT,
//             ...(i === PROCESS.length - 1
//               ? { borderBottom: `1px solid ${HAIRLINE_FAINT}` }
//               : {}),
//           }}
//         >
//           {/* Serif numeral */}
//           <div
//             className="text-[36px] leading-none text-white/30 lg:text-[44px]"
//             style={{ ...SERIF, ...TABULAR, fontWeight: 400 }}
//           >
//             {step.n}
//           </div>
//           {/* Italic serif label */}
//           <div
//             className="text-[16px] text-white lg:text-[18px]"
//             style={{ ...SERIF_ITALIC, fontWeight: 400 }}
//           >
//             <span className="text-white/55" aria-hidden>
//               →{" "}
//             </span>
//             <EditableText
//               page="home"
//               slot={`about.${step.slot}.label`}
//               fallback={step.defaultLabel}
//               as="span"
//               singleLine
//             />
//           </div>
//           {/* Body paragraph */}
//           <p className="max-w-[560px] text-[15px] leading-[1.55] text-white/75">
//             <EditableText
//               page="home"
//               slot={`about.${step.slot}.body`}
//               fallback={step.defaultBody}
//               as="span"
//             />
//           </p>
//         </li>
//       ))}
//     </ol>
//   );
// }
// 
// /* -------------------------------------------------------------------------- */
// /*  MetricStrip — magazine endnote ledger                                     */
// /* -------------------------------------------------------------------------- */
// 
// function MetricStrip() {
//   return (
//     <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
//       {METRICS.map((m, i) => (
//         <div
//           key={m.slot}
//           className={[
//             "relative pt-6",
//             // First three rows on mobile get a top hairline; on desktop every
//             // tile gets one to read as a continuous endnote strip.
//             i === 0 ? "" : "",
//           ].join(" ")}
//           style={{ borderTop: `1px solid ${HAIRLINE_FAINT}` }}
//         >
//           {/* Tabular-num display value */}
//           <div
//             className="text-[44px] leading-none text-white lg:text-[52px]"
//             style={{
//               ...TABULAR,
//               fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
//               fontWeight: 300,
//               letterSpacing: "-1.5px",
//             }}
//           >
//             <EditableText
//               page="home"
//               slot={`about.${m.slot}.value`}
//               fallback={m.value}
//               as="span"
//               singleLine
//             />
//           </div>
//           {/* Italic serif label */}
//           <div
//             className="mt-3 text-[15px] leading-snug text-white/85"
//             style={{ ...SERIF_ITALIC, fontWeight: 400 }}
//           >
//             <EditableText
//               page="home"
//               slot={`about.${m.slot}.label`}
//               fallback={m.label}
//               as="span"
//               singleLine
//             />
//           </div>
//           {/* Mono caption */}
//           <div
//             className="mt-1.5 text-[10px] text-white/45"
//             style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
//           >
//             <EditableText
//               page="home"
//               slot={`about.${m.slot}.note`}
//               fallback={m.note}
//               as="span"
//               singleLine
//             />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }
// 
// /* -------------------------------------------------------------------------- */
// /*  VennDiagram — outline-only circles + editorial annotation pairs           */
// /*                                                                            */
// /*  SVG owns the three circles, the dashed pointers to the centroid, and     */
// /*  the centroid marker + serif-italic "here." callout. HTML overlays carry  */
// /*  every editable label so admin can rewrite each in place.                 */
// /* -------------------------------------------------------------------------- */
// 
// const CIRCLES = {
//   user: { cx: 215, cy: 195, r: 115 },
//   business: { cx: 385, cy: 195, r: 115 },
//   technology: { cx: 300, cy: 340, r: 115 },
// };
// 
// // Anchors expressed as % of the SVG viewBox (600×500) so the HTML overlays
// // stay aligned with the SVG geometry at any container width.
// function pct(x: number, y: number) {
//   return { left: `${(x / 600) * 100}%`, top: `${(y / 500) * 100}%` };
// }
// 
// const ANCHORS = {
//   // Inside-circle uppercase axis labels
//   userLabel: pct(CIRCLES.user.cx, CIRCLES.user.cy - 18),
//   businessLabel: pct(CIRCLES.business.cx, CIRCLES.business.cy - 18),
//   technologyLabel: pct(CIRCLES.technology.cx, CIRCLES.technology.cy + 22),
//   // Outside-corner Cagan-risk annotations (serif italic + mono sub)
//   userAnnotation: { left: "12%", top: "20%", align: "left" as const },
//   businessAnnotation: { left: "88%", top: "20%", align: "right" as const },
//   technologyAnnotation: { left: "50%", top: "93%", align: "center" as const },
// };
// 
// function VennDiagram() {
//   return (
//     <div className="relative mt-3 w-full max-w-[420px]" style={{ aspectRatio: "600 / 500" }}>
//       <svg
//         viewBox="0 0 600 500"
//         className="absolute inset-0 block h-full w-full"
//         aria-label="PM Venn diagram — User, Business, Technology"
//       >
//         {/* Outline-only circles */}
//         <circle
//           cx={CIRCLES.user.cx}
//           cy={CIRCLES.user.cy}
//           r={CIRCLES.user.r}
//           fill="none"
//           stroke="rgba(255,255,255,0.55)"
//           strokeWidth={1}
//         />
//         <circle
//           cx={CIRCLES.business.cx}
//           cy={CIRCLES.business.cy}
//           r={CIRCLES.business.r}
//           fill="none"
//           stroke="rgba(255,255,255,0.55)"
//           strokeWidth={1}
//         />
//         <circle
//           cx={CIRCLES.technology.cx}
//           cy={CIRCLES.technology.cy}
//           r={CIRCLES.technology.r}
//           fill="none"
//           stroke="rgba(255,255,255,0.55)"
//           strokeWidth={1}
//         />
// 
//         {/* Dashed pointers from the three outside corners toward the centroid */}
//         <line
//           x1={120}
//           y1={120}
//           x2={210}
//           y2={170}
//           stroke="rgba(255,255,255,0.3)"
//           strokeWidth={0.75}
//           strokeDasharray="2 3"
//         />
//         <line
//           x1={480}
//           y1={120}
//           x2={390}
//           y2={170}
//           stroke="rgba(255,255,255,0.3)"
//           strokeWidth={0.75}
//           strokeDasharray="2 3"
//         />
//         <line
//           x1={300}
//           y1={450}
//           x2={300}
//           y2={400}
//           stroke="rgba(255,255,255,0.3)"
//           strokeWidth={0.75}
//           strokeDasharray="2 3"
//         />
// 
//         {/* Centroid point + connector to the "here." callout */}
//         <circle cx={300} cy={243} r={3} fill="white" />
//         <line
//           x1={300}
//           y1={243}
//           x2={345}
//           y2={260}
//           stroke="rgba(255,255,255,0.5)"
//           strokeWidth={0.75}
//         />
//       </svg>
// 
//       {/* HTML overlays — inside-circle uppercase labels */}
//       <VennLabel
//         anchor={ANCHORS.userLabel}
//         slot="about.venn.user.label"
//         fallback={VENN_AXES[0].defaultLabel}
//       />
//       <VennLabel
//         anchor={ANCHORS.businessLabel}
//         slot="about.venn.business.label"
//         fallback={VENN_AXES[1].defaultLabel}
//       />
//       <VennLabel
//         anchor={ANCHORS.technologyLabel}
//         slot="about.venn.technology.label"
//         fallback={VENN_AXES[2].defaultLabel}
//       />
// 
//       {/* HTML overlays — outside-corner Cagan annotations */}
//       <VennAnnotation
//         anchor={ANCHORS.userAnnotation}
//         riskSlot="about.venn.user.risk"
//         riskFallback={VENN_AXES[0].defaultRisk}
//         subSlot="about.venn.user.sub"
//         subFallback={VENN_AXES[0].defaultSub}
//       />
//       <VennAnnotation
//         anchor={ANCHORS.businessAnnotation}
//         riskSlot="about.venn.business.risk"
//         riskFallback={VENN_AXES[1].defaultRisk}
//         subSlot="about.venn.business.sub"
//         subFallback={VENN_AXES[1].defaultSub}
//       />
//       <VennAnnotation
//         anchor={ANCHORS.technologyAnnotation}
//         riskSlot="about.venn.technology.risk"
//         riskFallback={VENN_AXES[2].defaultRisk}
//         subSlot="about.venn.technology.sub"
//         subFallback={VENN_AXES[2].defaultSub}
//       />
// 
//       {/* "here." callout near the centroid */}
//       <div
//         className="pointer-events-none absolute"
//         style={{
//           left: `${(355 / 600) * 100}%`,
//           top: `${(263 / 500) * 100}%`,
//           transform: "translateY(-50%)",
//         }}
//       >
//         <span
//           className="text-[14px] text-white"
//           style={{ ...SERIF_ITALIC, fontWeight: 400 }}
//         >
//           <EditableText
//             page="home"
//             slot="about.venn.center"
//             fallback="here."
//             as="span"
//             singleLine
//           />
//         </span>
//       </div>
//     </div>
//   );
// }
// 
// function VennLabel({
//   anchor,
//   slot,
//   fallback,
// }: {
//   anchor: { left: string; top: string };
//   slot: string;
//   fallback: string;
// }) {
//   return (
//     <div
//       className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
//       style={{ left: anchor.left, top: anchor.top }}
//     >
//       <span
//         className="text-[11px] text-white/85"
//         style={{ ...MONO, letterSpacing: "0.2em" }}
//       >
//         <EditableText page="home" slot={slot} fallback={fallback} as="span" singleLine />
//       </span>
//     </div>
//   );
// }
// 
// function VennAnnotation({
//   anchor,
//   riskSlot,
//   riskFallback,
//   subSlot,
//   subFallback,
// }: {
//   anchor: { left: string; top: string; align: "left" | "right" | "center" };
//   riskSlot: string;
//   riskFallback: string;
//   subSlot: string;
//   subFallback: string;
// }) {
//   const transformX =
//     anchor.align === "left" ? "0%" : anchor.align === "right" ? "-100%" : "-50%";
//   const textAlign =
//     anchor.align === "left" ? "left" : anchor.align === "right" ? "right" : "center";
//   return (
//     <div
//       className="pointer-events-none absolute"
//       style={{
//         left: anchor.left,
//         top: anchor.top,
//         transform: `translate(${transformX}, -50%)`,
//         textAlign,
//       }}
//     >
//       <div
//         className="text-[11px] text-white/55"
//         style={{ ...SERIF_ITALIC, fontWeight: 400 }}
//       >
//         <EditableText page="home" slot={riskSlot} fallback={riskFallback} as="span" singleLine />
//       </div>
//       <div
//         className="mt-0.5 text-[10px] text-white/50"
//         style={{ ...MONO, letterSpacing: "0.08em" }}
//       >
//         <EditableText page="home" slot={subSlot} fallback={subFallback} as="span" singleLine />
//       </div>
//     </div>
//   );
// }
