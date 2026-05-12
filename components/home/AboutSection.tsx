"use client";

/**
 * AboutSection — graduated from /preview/about Variant C.
 *
 * The "Builder ledger" — an `ABOUT.md` document rendered as a section.
 * Doc header with version + maintainer + live status, then four code-block
 * sections (`// who.ts`, `// venn.svg`, `// process.ts`, `// receipts.ts`).
 * Venn is a dashed technical drawing with construction lines between
 * centers and coordinate ticks; process is a monospace function-signature
 * table; receipts are a tabular metric ledger.
 *
 * Maximum "PM who codes" flex — leans on monospace + tabular numerals +
 * SVG construction geometry rather than the chromatic/gradient primitives.
 *
 * Per CLAUDE.md every user-facing string is wrapped in `<EditableText>` so
 * the admin can rewrite copy in place. Venn axis labels are HTML overlays
 * on top of the SVG so each one is reachable; the coordinate ticks inside
 * the SVG are structural (part of the technical drawing) and stay literal.
 */

import { EditableText } from "@/components/editable/EditableText";

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
/*  Slot tables                                                               */
/* -------------------------------------------------------------------------- */

type Metric = { slot: string; value: string; label: string; note: string };

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
  defaultBody: string;
  color: string;
};

const VENN_AXES: VennAxis[] = [
  {
    slot: "user",
    defaultLabel: "USER",
    defaultBody: "Personas, JTBD, eight buyer interviews — not eighty dashboards.",
    color: "#a78bfa",
  },
  {
    slot: "business",
    defaultLabel: "BUSINESS",
    defaultBody: "Owned the revenue line. Owned the retention number. Owned the ops bill.",
    color: "#22d3ee",
  },
  {
    slot: "technology",
    defaultLabel: "TECHNOLOGY",
    defaultBody:
      "2 yrs backend before PM. Three AI products shipped solo in 2026. Engineering disagreements are short.",
    color: "#f472b6",
  },
];

type ProcessStep = {
  slot: string;
  n: string;
  defaultLabel: string;
  defaultBody: string;
  defaultFn: string;
};

const PROCESS: ProcessStep[] = [
  {
    slot: "step1",
    n: "01",
    defaultLabel: "WHY",
    defaultBody:
      "Find the problem that hurts. Not the one you can spec — the one users won't shut up about.",
    defaultFn: "locateProblem()",
  },
  {
    slot: "step2",
    n: "02",
    defaultLabel: "USER",
    defaultBody:
      "Talk to the people. What they're doing instead is the spec. Ignore the loud feature requests.",
    defaultFn: "mapJTBD()",
  },
  {
    slot: "step3",
    n: "03",
    defaultLabel: "ATOMIZE",
    defaultBody:
      "Strip the problem to its smallest unit. The thing that, if true, makes the rest fall in.",
    defaultFn: "breakdown(problem)",
  },
  {
    slot: "step4",
    n: "04",
    defaultLabel: "SHIP",
    defaultBody:
      "Build the thinnest slice that proves the thesis. Before the slide deck is ready.",
    defaultFn: "thinnest_slice()",
  },
  {
    slot: "step5",
    n: "05",
    defaultLabel: "MEASURE",
    defaultBody:
      "Watch what users do, not what they say. Rewrite the next spec from the data.",
    defaultFn: "observe()",
  },
];

/* -------------------------------------------------------------------------- */
/*  Section backdrop                                                          */
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
    >
      <SectionBackdrop />

      <div className="relative mx-auto max-w-[1080px] px-6 sm:px-6 lg:px-10">
        {/* Doc header */}
        <div
          className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b pb-4 text-[11px] text-white/55"
          style={{ ...MONO, borderColor: HAIRLINE }}
        >
          <span className="text-white/85">
            <EditableText
              page="home"
              slot="about.doc.title"
              fallback="ABOUT.md"
              as="span"
              singleLine
            />
          </span>
          <span aria-hidden>·</span>
          <span>
            <EditableText
              page="home"
              slot="about.doc.version"
              fallback="v.2026.05.12"
              as="span"
              singleLine
            />
          </span>
          <span aria-hidden>·</span>
          <span>
            <EditableText
              page="home"
              slot="about.doc.maintainer"
              fallback="maintained by sa@"
              as="span"
              singleLine
            />
          </span>
          <span className="ml-auto text-emerald-400/80">
            <EditableText
              page="home"
              slot="about.doc.status"
              fallback="● live"
              as="span"
              singleLine
            />
          </span>
        </div>

        {/* Title */}
        <h2
          className="mt-10 max-w-[760px] text-[40px] leading-[1.05] tracking-[-1px] text-white lg:text-[clamp(44px,5.4vw,60px)] lg:tracking-[-1.5px]"
          style={{
            fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 300,
          }}
        >
          <EditableText
            page="home"
            slot="about.headline"
            fallback="A working history of a PM at the intersection."
            as="span"
          />
        </h2>

        {/* who.ts */}
        <CodeBlock commentSlot="about.who.comment" commentFallback="who.ts">
          <p className="mt-3 max-w-[680px] text-[15px] leading-[1.65] text-white/85">
            <EditableText
              page="home"
              slot="about.who.body"
              fallback="I'm Siddharth Agrawal. PM at 6sense, owning technographics and market insights. 12 products shipped, 3 from zero, 3 AI products shipped solo in 2026 (Thalify · EvalForge · Rapido). Started as a backend engineer in 2018; switched to PM in 2022. The PM Venn diagram isn't a claim I make — it's the shape of my résumé."
              as="span"
            />
          </p>
        </CodeBlock>

        {/* venn.svg */}
        <CodeBlock commentSlot="about.venn.comment" commentFallback="venn.svg">
          <div className="mt-3 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
            <VennDiagram />
            <div className="space-y-5">
              <CornerNote
                color={VENN_AXES[0].color}
                tokenSlot="about.venn.user.token"
                tokenFallback="user"
                bodySlot="about.venn.user.body"
                bodyFallback={VENN_AXES[0].defaultBody}
              />
              <CornerNote
                color={VENN_AXES[1].color}
                tokenSlot="about.venn.business.token"
                tokenFallback="business"
                bodySlot="about.venn.business.body"
                bodyFallback={VENN_AXES[1].defaultBody}
              />
              <CornerNote
                color={VENN_AXES[2].color}
                tokenSlot="about.venn.technology.token"
                tokenFallback="technology"
                bodySlot="about.venn.technology.body"
                bodyFallback={VENN_AXES[2].defaultBody}
              />
              <CornerNote
                color="#ffffff"
                tokenSlot="about.venn.intersection.token"
                tokenFallback="intersection"
                bodySlot="about.venn.intersection.body"
                bodyFallback="Where I work."
                mono
              />
            </div>
          </div>
        </CodeBlock>

        {/* process.ts */}
        <CodeBlock commentSlot="about.process.comment" commentFallback="process.ts">
          <ProcessFlow />
        </CodeBlock>

        {/* receipts.ts */}
        <CodeBlock commentSlot="about.receipts.comment" commentFallback="receipts.ts">
          <MetricStrip />
        </CodeBlock>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  CodeBlock — `// filename.ext` comment marker above each section            */
/* -------------------------------------------------------------------------- */

function CodeBlock({
  commentSlot,
  commentFallback,
  children,
}: {
  commentSlot: string;
  commentFallback: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-14">
      <div
        className="text-[12px] text-violet-300/85"
        style={{ ...MONO, letterSpacing: "0.02em" }}
      >
        <span aria-hidden>// </span>
        <EditableText
          page="home"
          slot={commentSlot}
          fallback={commentFallback}
          as="span"
          singleLine
        />
      </div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CornerNote — glow-dot + uppercase token + body paragraph                  */
/* -------------------------------------------------------------------------- */

function CornerNote({
  color,
  tokenSlot,
  tokenFallback,
  bodySlot,
  bodyFallback,
  mono = false,
}: {
  color: string;
  tokenSlot: string;
  tokenFallback: string;
  bodySlot: string;
  bodyFallback: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center pt-1">
        <span
          className="size-2.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 12px ${color}80` }}
          aria-hidden
        />
        <div
          className="mt-2 w-px flex-1"
          style={{ background: HAIRLINE_FAINT, minHeight: 12 }}
          aria-hidden
        />
      </div>
      <div className="flex-1">
        <div
          className="text-[11px] text-white/55"
          style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
        >
          <EditableText
            page="home"
            slot={tokenSlot}
            fallback={tokenFallback}
            as="span"
            singleLine
          />
        </div>
        <p
          className={[
            "mt-1 text-[14px] leading-[1.55] text-white/85",
            mono ? "text-white" : "",
          ].join(" ")}
          style={mono ? MONO : undefined}
        >
          <EditableText page="home" slot={bodySlot} fallback={bodyFallback} as="span" />
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ProcessFlow — table with monospace function signatures                    */
/* -------------------------------------------------------------------------- */

function ProcessFlow() {
  return (
    <div
      className="mt-3 overflow-hidden rounded-md border"
      style={{ borderColor: HAIRLINE_FAINT }}
    >
      <div
        className="grid grid-cols-[60px_minmax(0,1fr)_180px] border-b px-4 py-2 text-[10px] text-white/45"
        style={{
          ...MONO,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          borderColor: HAIRLINE_FAINT,
        }}
      >
        <span>step</span>
        <span>behavior</span>
        <span>signature</span>
      </div>
      {PROCESS.map((step, i) => (
        <div
          key={step.slot}
          className="grid grid-cols-[60px_minmax(0,1fr)_180px] items-baseline gap-4 px-4 py-4"
          style={{
            ...(i < PROCESS.length - 1
              ? { borderBottom: `1px solid ${HAIRLINE_FAINT}` }
              : {}),
            background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)",
          }}
        >
          <div className="text-white/75" style={{ ...MONO, ...TABULAR, fontSize: 13 }}>
            {step.n}
          </div>
          <div>
            <div
              className="text-[12px] text-violet-300/90"
              style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              <EditableText
                page="home"
                slot={`about.${step.slot}.label`}
                fallback={step.defaultLabel}
                as="span"
                singleLine
              />
            </div>
            <p className="mt-1 max-w-[520px] text-[14px] leading-[1.55] text-white/85">
              <EditableText
                page="home"
                slot={`about.${step.slot}.body`}
                fallback={step.defaultBody}
                as="span"
              />
            </p>
          </div>
          <div className="text-[12px] text-cyan-200/75" style={MONO}>
            <EditableText
              page="home"
              slot={`about.${step.slot}.fn`}
              fallback={step.defaultFn}
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
/*  MetricStrip — tabular receipts ledger                                     */
/* -------------------------------------------------------------------------- */

function MetricStrip() {
  return (
    <div
      className="mt-3 overflow-hidden rounded-md border"
      style={{ borderColor: HAIRLINE_FAINT }}
    >
      <div
        className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] border-b px-4 py-2 text-[10px] text-white/45"
        style={{
          ...MONO,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          borderColor: HAIRLINE_FAINT,
        }}
      >
        <span>metric</span>
        <span className="text-right">value</span>
        <span>context</span>
      </div>
      {METRICS.map((m, i) => (
        <div
          key={m.slot}
          className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] items-baseline gap-4 px-4 py-4"
          style={
            i < METRICS.length - 1
              ? { borderBottom: `1px solid ${HAIRLINE_FAINT}` }
              : undefined
          }
        >
          <div className="text-[14px] text-white/85">
            <EditableText
              page="home"
              slot={`about.${m.slot}.label`}
              fallback={m.label}
              as="span"
              singleLine
            />
          </div>
          <div
            className="text-right text-[22px] text-white"
            style={{
              ...TABULAR,
              fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
              letterSpacing: "-0.5px",
            }}
          >
            <EditableText
              page="home"
              slot={`about.${m.slot}.value`}
              fallback={m.value}
              as="span"
              singleLine
            />
          </div>
          <div className="text-[12px] text-white/55" style={MONO}>
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
/*  VennDiagram — dashed technical drawing                                    */
/*  SVG owns circles, construction lines between centers, centroid marker,    */
/*  and decorative coordinate ticks. HTML overlays carry the three editable   */
/*  axis labels (USER · BUSINESS · TECHNOLOGY).                               */
/* -------------------------------------------------------------------------- */

const CIRCLES = {
  user: { cx: 215, cy: 195, r: 115, color: "#a78bfa" },
  business: { cx: 385, cy: 195, r: 115, color: "#22d3ee" },
  technology: { cx: 300, cy: 340, r: 115, color: "#f472b6" },
};

// Axis label anchors expressed as % of the SVG viewBox (600 × 500) so the
// HTML overlays line up with the SVG at any container size.
// USER label sits above its circle (cy − r − padding), and so on.
const LABEL_ANCHORS = {
  user: { left: `${(CIRCLES.user.cx / 600) * 100}%`, top: `${((CIRCLES.user.cy - CIRCLES.user.r - 18) / 500) * 100}%` },
  business: { left: `${(CIRCLES.business.cx / 600) * 100}%`, top: `${((CIRCLES.business.cy - CIRCLES.business.r - 18) / 500) * 100}%` },
  technology: { left: `${(CIRCLES.technology.cx / 600) * 100}%`, top: `${((CIRCLES.technology.cy + CIRCLES.technology.r + 14) / 500) * 100}%` },
};

function VennDiagram() {
  return (
    <div className="relative mt-3 w-full max-w-[520px]" style={{ aspectRatio: "600 / 500" }}>
      <svg
        viewBox="0 0 600 500"
        className="absolute inset-0 block h-full w-full"
        aria-label="PM Venn diagram — User, Business, Technology"
      >
        {/* Faint technical grid */}
        <defs>
          <pattern id="vennGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
          </pattern>
        </defs>
        <rect x="0" y="0" width="600" height="500" fill="url(#vennGrid)" />

        {/* Construction lines connecting circle centers */}
        <g stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} strokeDasharray="2 3">
          <line x1={CIRCLES.user.cx} y1={CIRCLES.user.cy} x2={CIRCLES.business.cx} y2={CIRCLES.business.cy} />
          <line x1={CIRCLES.user.cx} y1={CIRCLES.user.cy} x2={CIRCLES.technology.cx} y2={CIRCLES.technology.cy} />
          <line x1={CIRCLES.business.cx} y1={CIRCLES.business.cy} x2={CIRCLES.technology.cx} y2={CIRCLES.technology.cy} />
        </g>

        {/* Circle center markers + coordinate ticks (structural, kept literal) */}
        {[CIRCLES.user, CIRCLES.business, CIRCLES.technology].map((c) => (
          <g key={`${c.cx}-${c.cy}`}>
            <circle cx={c.cx} cy={c.cy} r={2} fill={c.color} />
            <text
              x={c.cx + 8}
              y={c.cy - 6}
              fill="rgba(255,255,255,0.5)"
              fontSize={9}
              style={{ ...MONO, letterSpacing: "0.05em" }}
            >
              ({c.cx},{c.cy})
            </text>
          </g>
        ))}

        {/* Circles — dashed strokes, low-alpha fill */}
        <circle
          cx={CIRCLES.user.cx}
          cy={CIRCLES.user.cy}
          r={CIRCLES.user.r}
          fill={CIRCLES.user.color}
          fillOpacity={0.06}
          stroke={CIRCLES.user.color}
          strokeOpacity={0.7}
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <circle
          cx={CIRCLES.business.cx}
          cy={CIRCLES.business.cy}
          r={CIRCLES.business.r}
          fill={CIRCLES.business.color}
          fillOpacity={0.06}
          stroke={CIRCLES.business.color}
          strokeOpacity={0.7}
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <circle
          cx={CIRCLES.technology.cx}
          cy={CIRCLES.technology.cy}
          r={CIRCLES.technology.r}
          fill={CIRCLES.technology.color}
          fillOpacity={0.06}
          stroke={CIRCLES.technology.color}
          strokeOpacity={0.7}
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* Centroid marker (PM) */}
        <circle cx={300} cy={243} r={4} fill="white" stroke="black" strokeWidth={1} />
        <text
          x={300}
          y={228}
          textAnchor="middle"
          fill="white"
          fontSize={10}
          style={{ ...MONO, letterSpacing: "0.18em" }}
        >
          PM
        </text>
        <text
          x={300}
          y={262}
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize={9}
          style={MONO}
        >
          (300,243)
        </text>
      </svg>

      {/* HTML overlay labels (editable) */}
      <VennAxisLabel
        anchor={LABEL_ANCHORS.user}
        color={CIRCLES.user.color}
        slot="about.venn.user.label"
        fallback={VENN_AXES[0].defaultLabel}
      />
      <VennAxisLabel
        anchor={LABEL_ANCHORS.business}
        color={CIRCLES.business.color}
        slot="about.venn.business.label"
        fallback={VENN_AXES[1].defaultLabel}
      />
      <VennAxisLabel
        anchor={LABEL_ANCHORS.technology}
        color={CIRCLES.technology.color}
        slot="about.venn.technology.label"
        fallback={VENN_AXES[2].defaultLabel}
      />
    </div>
  );
}

function VennAxisLabel({
  anchor,
  color,
  slot,
  fallback,
}: {
  anchor: { left: string; top: string };
  color: string;
  slot: string;
  fallback: string;
}) {
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
      style={{ left: anchor.left, top: anchor.top }}
    >
      <div
        className="text-[11px]"
        style={{ ...MONO, color, letterSpacing: "0.2em", textTransform: "uppercase" }}
      >
        <EditableText page="home" slot={slot} fallback={fallback} as="span" singleLine />
      </div>
    </div>
  );
}
