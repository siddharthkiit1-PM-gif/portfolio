# Experience Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Graduate the in-hero Experience strip into its own editorial-calm scroll section between Hero and Projects — a 3-tile metric strip (with counter-up reveal) above three role cards (with sticky chapter numerals and themed pillar bullets), all editable through Convex + the existing `/admin/edit` Experience tab.

**Architecture:** New `components/experience/` directory with five focused files (`ExperienceSection`, `MetricStrip`, `RoleCard`, `PillarBlock`, `ChapterNumeral`) plus a `useCountUp` hook in `lib/motion/`. Convex `experienceRoles` extended with optional `location` + `pillars[]` fields (no migration needed; existing rows still validate). Sign-off lands through a side-by-side A/B preview at `app/preview/experience/page.tsx` per CLAUDE.md, then the winner graduates and the in-hero strip is removed in a single commit.

**Tech Stack:** Next.js 16 App Router, Convex, React 19, Tailwind, Vitest + jsdom + @testing-library/react, IntersectionObserver, CSS `position: sticky` (no GSAP/JS for sticky behavior), existing `useReducedMotion` hook.

**Reference spec:** `docs/superpowers/specs/2026-05-10-experience-section-design.md` (read it before starting Task 1).

---

## Task 1: Extend Convex `experienceRoles` schema with `location` + `pillars[]`

**Files:**
- Modify: `convex/schema.ts`
- Auto-regenerate: `convex/_generated/api.d.ts`, `convex/_generated/dataModel.d.ts`, `convex/_generated/server.d.ts` (commit them — Vercel does not run `convex dev`)

- [ ] **Step 1: Add the new optional fields to the `experienceRoles` table**

Open `convex/schema.ts` and replace the `experienceRoles: defineTable({ … })` block with:

```ts
  experienceRoles: defineTable({
    order: v.number(),
    dates: v.string(),
    company: v.string(),
    title: v.string(),
    metric: v.string(),
    outcome: v.optional(v.string()),
    // Optional so existing rows in production Convex continue to validate
    // without a backfill. Components fall back to EXPERIENCE_ROLE_DEFAULTS
    // when the live row is missing these.
    location: v.optional(v.string()),
    pillars: v.optional(
      v.array(
        v.object({
          label: v.string(),
          bullets: v.array(
            v.object({
              text: v.string(),
              metric: v.optional(v.string()),
            }),
          ),
        }),
      ),
    ),
    updatedAt: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_company_dates", ["company", "dates"]),
```

- [ ] **Step 2: Regenerate Convex types**

Run: `npx convex codegen`
Expected: re-emits files under `convex/_generated/` with the new field types reachable from `Doc<"experienceRoles">`.

- [ ] **Step 3: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors. (Existing readers don't reference the new fields, and they're optional, so nothing else changes shape yet.)

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/_generated
git commit -m "feat(convex): add optional location + pillars to experienceRoles"
```

---

## Task 2: Extend `experienceRoles.upsert` mutation + `seed.ts` to carry the new fields

**Files:**
- Modify: `convex/experienceRoles.ts`
- Modify: `convex/seed.ts`

- [ ] **Step 1: Extend the `upsert` args + handler**

Replace the `upsert` export in `convex/experienceRoles.ts` with:

```ts
export const upsert = mutation({
  args: {
    id: v.optional(v.id("experienceRoles")),
    order: v.number(),
    dates: v.string(),
    company: v.string(),
    title: v.string(),
    metric: v.string(),
    outcome: v.optional(v.string()),
    location: v.optional(v.string()),
    pillars: v.optional(
      v.array(
        v.object({
          label: v.string(),
          bullets: v.array(
            v.object({
              text: v.string(),
              metric: v.optional(v.string()),
            }),
          ),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    if (args.id) {
      await ctx.db.patch(args.id, {
        order: args.order,
        dates: args.dates,
        company: args.company,
        title: args.title,
        metric: args.metric,
        outcome: args.outcome,
        location: args.location,
        pillars: args.pillars,
        updatedAt: now,
      });
      return args.id;
    }
    return ctx.db.insert("experienceRoles", {
      order: args.order,
      dates: args.dates,
      company: args.company,
      title: args.title,
      metric: args.metric,
      outcome: args.outcome,
      location: args.location,
      pillars: args.pillars,
      updatedAt: now,
    });
  },
});
```

- [ ] **Step 2: Update `seedExperienceRoles` to write the new fields**

In `convex/seed.ts`, replace the `ctx.db.insert("experienceRoles", {…})` call inside `seedExperienceRoles` with:

```ts
      await ctx.db.insert("experienceRoles", {
        order: i,
        dates: role.dates,
        company: role.company,
        title: role.title,
        metric: role.metric,
        outcome: role.outcome,
        location: role.location,
        pillars: role.pillars as unknown as
          | { label: string; bullets: { text: string; metric?: string }[] }[]
          | undefined,
        updatedAt: Date.now(),
      });
```

(`as unknown as …` is only needed because `EXPERIENCE_ROLE_DEFAULTS` is `as const` in Task 3; if TS types line up natively after Task 3 you can drop the cast.)

- [ ] **Step 3: Regenerate Convex types and typecheck**

Run: `npx convex codegen && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add convex/experienceRoles.ts convex/seed.ts convex/_generated
git commit -m "feat(convex): pass location + pillars through experienceRoles upsert + seed"
```

---

## Task 3: Extend `EXPERIENCE_ROLE_DEFAULTS` with verbatim resume content

**Files:**
- Modify: `lib/defaults/experienceRoles.ts`

- [ ] **Step 1: Replace the file contents**

Overwrite `lib/defaults/experienceRoles.ts` with:

```ts
/**
 * Shared defaults for the Experience block on the home page.
 *
 * Used in two places:
 *   • `components/experience/ExperienceSection.tsx` — first-paint / empty-DB
 *     fallback so the section renders correctly before the Convex query
 *     resolves (or against a clean DB with no rows).
 *   • `convex/seed.ts`'s `seedExperienceRoles` — idempotent seed that mirrors
 *     these literals so a freshly-seeded DB renders identically to a clean
 *     DB with no rows.
 *
 * Lives at the top-level `lib/` (not under `convex/`) so both Convex's TS
 * compiler and the Next.js client can import it; Convex doesn't expose
 * arbitrary paths to the client and vice versa.
 *
 * The PM role's `metric` string is `"$500K ARR"` per direct user instruction —
 * this overrides the resume's $100K figure and keeps defaults consistent with
 * the headline metric strip in `MetricStrip.tsx`.
 */

export type RoleBullet = {
  text: string;
  metric?: string;
};

export type RolePillar = {
  label: string;
  bullets: RoleBullet[];
};

export type RoleDefault = {
  order: number;
  dates: string;
  company: string;
  title: string;
  location?: string;
  metric: string;
  outcome?: string;
  pillars?: RolePillar[];
};

export const EXPERIENCE_ROLE_DEFAULTS: RoleDefault[] = [
  {
    order: 0,
    dates: "2024 — Now",
    company: "6sense Insights",
    title: "Product Manager",
    location: "Bangalore",
    metric: "$500K ARR",
    outcome: "Market insight signals 0→1, 30+ enterprise customers",
    pillars: [
      {
        label: "Revenue & Growth",
        bullets: [
          {
            text: "Launched market insight signals 0→1 — 30+ enterprise customers, $500K ARR; owned full lifecycle from customer discovery through data pipeline design to production.",
            metric: "$500K ARR",
          },
        ],
      },
      {
        label: "Retention & Customer Research",
        bullets: [
          {
            text: "Ran 25+ customer interviews to map onboarding and discovery drop-offs; shipped prioritised fixes that drove an 18% lift in retention.",
            metric: "+18%",
          },
          {
            text: "Mapped early churn triggers (D30/D60/D90) with analytics; shipped targeted in-product journeys that closed drop-off gaps and improved early engagement.",
          },
          {
            text: "Collaborated with sales and CS to gather enterprise feedback on signal accuracy; translated findings into a data quality backlog that reduced customer-reported data issues by 40%.",
            metric: "-40%",
          },
        ],
      },
      {
        label: "Data Quality & ML",
        bullets: [
          {
            text: "Rebuilt technographic job-level classification with the data science team using ML models; improved signal accuracy by 85%+ and restored user trust in core search and discovery experiences.",
            metric: "+85%",
          },
          {
            text: "Built historical jobs framework improving technographic data freshness and coverage by 72%, reducing signal staleness and lifting CSAT by 20%.",
            metric: "+72%",
          },
          {
            text: "Integrated external data sources across product areas, expanding technographic signal coverage by 32% and improving reliability of enterprise-facing experiences.",
            metric: "+32%",
          },
        ],
      },
      {
        label: "Operational Leverage",
        bullets: [
          {
            text: "Built AI-assisted threshold workflow automating classification decisions for the Data Ops team — reduced manual effort by 98%, enabling signal processing to scale without adding headcount.",
            metric: "-98%",
          },
          {
            text: "Revamped SI App information architecture using customer-driven research; improved feature discoverability by 30% across high-density technographic data views.",
            metric: "+30%",
          },
        ],
      },
    ],
  },
  {
    order: 1,
    dates: "2022 — 2024",
    company: "6sense Insights",
    title: "Business Analyst",
    location: "Bangalore",
    metric: "+18% retention",
    outcome: "Internal CMS + churn analysis, earned PM transition",
    pillars: [
      {
        label: "Internal Tooling",
        bullets: [
          {
            text: "Launched internal CMS for technographics data — gave ops direct control over signal quality, reduced visible error rate by 98%, and cut escalation tickets by 60%.",
            metric: "-98%",
          },
        ],
      },
      {
        label: "Competitive & Roadmap",
        bullets: [
          {
            text: "Benchmarked technographic data assets against competing platforms on coverage, accuracy, and freshness; gaps identified shaped 3 major roadmap priorities.",
          },
        ],
      },
      {
        label: "Churn & UX",
        bullets: [
          {
            text: "Analysed data accuracy to reduce technographic and psychographic churn by 27%; iterated on product based on user feedback, cutting bounce rate by 18%.",
            metric: "-27%",
          },
        ],
      },
    ],
  },
  {
    order: 2,
    dates: "2020 — 2022",
    company: "Accenture",
    title: "Software Engineer",
    location: "Pune",
    metric: "AT&T platform",
    outcome: "Backend services for high-traffic consumer web",
    pillars: [
      {
        label: "Backend Engineering",
        bullets: [
          {
            text: "Built and maintained backend services and APIs for AT&T's high-traffic consumer web platform (phones & devices); improved system stability and reduced production incidents.",
          },
        ],
      },
      {
        label: "Quality & Release",
        bullets: [
          {
            text: "Collaborated with QA and product teams to debug, ship fixes, and support feature releases; reduced post-release defects through root cause analysis.",
          },
        ],
      },
    ],
  },
];
```

- [ ] **Step 2: Verify TS still compiles (consumers of `RoleDefault` still satisfy the new shape)**

Run: `npx tsc --noEmit`
Expected: 0 errors. (`components/home/Experience.tsx` reads only `order/dates/company/title/metric` — all still present and required.)

- [ ] **Step 3: Commit**

```bash
git add lib/defaults/experienceRoles.ts
git commit -m "feat(defaults): add full pillar bullets + locations to experience roles"
```

---

## Task 4: `useCountUp` parser — TDD failing test

**Files:**
- Create: `lib/motion/useCountUp.test.tsx`

- [ ] **Step 1: Write the failing parser test**

Create `lib/motion/useCountUp.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { parseCountUpValue } from "./useCountUp";

describe("parseCountUpValue", () => {
  it("parses a plain integer", () => {
    expect(parseCountUpValue("500")).toEqual({
      prefix: "",
      number: 500,
      suffix: "",
    });
  });

  it("parses a $-prefixed K-suffixed value", () => {
    expect(parseCountUpValue("$500K")).toEqual({
      prefix: "$",
      number: 500,
      suffix: "K",
    });
  });

  it("parses a +-prefixed % value", () => {
    expect(parseCountUpValue("+18%")).toEqual({
      prefix: "+",
      number: 18,
      suffix: "%",
    });
  });

  it("parses a --prefixed % value", () => {
    expect(parseCountUpValue("-98%")).toEqual({
      prefix: "-",
      number: 98,
      suffix: "%",
    });
  });

  it("falls back to numberless display when no digits are present", () => {
    expect(parseCountUpValue("AT&T platform")).toEqual({
      prefix: "AT&T platform",
      number: 0,
      suffix: "",
    });
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx vitest run lib/motion/useCountUp.test.tsx`
Expected: FAIL — `parseCountUpValue` not defined / module not found.

---

## Task 5: `useCountUp` parser — implementation

**Files:**
- Create: `lib/motion/useCountUp.ts`

- [ ] **Step 1: Implement the parser**

Create `lib/motion/useCountUp.ts`:

```ts
"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "./useReducedMotion";

export type CountUpParts = {
  /** Non-numeric leading characters, e.g. "$" or "+" or "-". */
  prefix: string;
  /** The integer value to count up to. */
  number: number;
  /** Non-numeric trailing characters, e.g. "K" or "%". */
  suffix: string;
};

/**
 * Splits a display value like `"$500K"` into `{ prefix, number, suffix }`.
 * If no digits are present the entire string is returned as `prefix` and
 * `number` is 0 — the caller can then decide to skip the count animation.
 */
export function parseCountUpValue(value: string): CountUpParts {
  const match = value.match(/^([^\d]*)(\d+)(.*)$/);
  if (!match) {
    return { prefix: value, number: 0, suffix: "" };
  }
  return {
    prefix: match[1],
    number: parseInt(match[2], 10),
    suffix: match[3],
  };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export type UseCountUpOptions = {
  /** Animation duration in ms. Default 1200. */
  durationMs?: number;
  /** Delay before the animation starts (after first intersection). Default 0. */
  delayMs?: number;
  /** Intersection ratio that triggers the animation. Default 0.6. */
  threshold?: number;
};

export type UseCountUpResult<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  /** Current display string, e.g. "$237K" mid-animation. */
  display: string;
};

/**
 * IntersectionObserver-triggered count-up. Returns a ref to attach to the
 * element being observed and the current `display` string. Fires once on
 * first intersection and disconnects afterwards. Reduced-motion users skip
 * the animation and see the final value immediately.
 */
export function useCountUp<T extends HTMLElement = HTMLElement>(
  value: string,
  options: UseCountUpOptions = {},
): UseCountUpResult<T> {
  const { durationMs = 1200, delayMs = 0, threshold = 0.6 } = options;
  const reduced = useReducedMotion();
  const ref = useRef<T | null>(null);
  const parts = parseCountUpValue(value);

  // When reduced motion is on, or the value contains no digits, render the
  // final string immediately and skip the observer entirely.
  const skipAnimation = reduced || parts.number === 0;
  const [display, setDisplay] = useState<string>(() =>
    skipAnimation ? value : `${parts.prefix}0${parts.suffix}`,
  );

  useEffect(() => {
    if (skipAnimation) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    let startTimeoutId: number | undefined;
    let started = false;
    const finalDisplay = `${parts.prefix}${parts.number}${parts.suffix}`;

    const start = () => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startedAt;
        const t = Math.min(1, elapsed / durationMs);
        const current = Math.round(easeOutCubic(t) * parts.number);
        setDisplay(`${parts.prefix}${current}${parts.suffix}`);
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          setDisplay(finalDisplay);
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started) {
            started = true;
            observer.disconnect();
            startTimeoutId = window.setTimeout(start, delayMs);
            return;
          }
        }
      },
      { threshold },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (startTimeoutId !== undefined) window.clearTimeout(startTimeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
    // value, durationMs, delayMs, threshold are stable per-mount in our
    // call sites; intentionally excluding them keeps the animation from
    // restarting on parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipAnimation]);

  return { ref, display };
}
```

- [ ] **Step 2: Run the parser tests to confirm they pass**

Run: `npx vitest run lib/motion/useCountUp.test.tsx`
Expected: PASS — 5/5 tests pass.

- [ ] **Step 3: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/motion/useCountUp.ts lib/motion/useCountUp.test.tsx
git commit -m "feat(motion): add useCountUp hook with IntersectionObserver trigger"
```

---

## Task 6: `ChapterNumeral` component

**Files:**
- Create: `components/experience/ChapterNumeral.tsx`

- [ ] **Step 1: Implement the component**

Create `components/experience/ChapterNumeral.tsx`:

```tsx
"use client";

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
  fontWeight: 300,
};

type Props = {
  /** Zero-based index; rendered as a 2-digit string ("01", "02", "03"). */
  index: number;
  /** When true, the numeral is sticky inside its parent (desktop). */
  sticky?: boolean;
};

export function ChapterNumeral({ index, sticky = false }: Props) {
  const label = String(index + 1).padStart(2, "0");
  return (
    <div
      aria-hidden
      className={
        sticky
          ? // Sticky only on md+. On mobile the section flows single-column
            // and viewport is too short for sticky to feel calm — it would
            // scroll-jam. Mobile renders the numeral as a static top-of-card
            // decoration at a smaller size + paler tone.
            "text-[64px] leading-none tracking-[-2px] text-white/[0.12] md:sticky md:top-24 md:text-[clamp(96px,12vw,144px)] md:tracking-[-3px] md:text-white/[0.08]"
          : "text-[64px] leading-none tracking-[-2px] text-white/[0.12]"
      }
      style={SERIF_ITALIC}
    >
      {label}
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/experience/ChapterNumeral.tsx
git commit -m "feat(experience): add ChapterNumeral decorative component"
```

---

## Task 7: `PillarBlock` component

**Files:**
- Create: `components/experience/PillarBlock.tsx`

- [ ] **Step 1: Implement the component**

Create `components/experience/PillarBlock.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/experience/PillarBlock.tsx
git commit -m "feat(experience): add PillarBlock with bullet + inline metric rendering"
```

---

## Task 8: `RoleCard` component

**Files:**
- Create: `components/experience/RoleCard.tsx`

- [ ] **Step 1: Implement the component**

Create `components/experience/RoleCard.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/experience/RoleCard.tsx
git commit -m "feat(experience): add RoleCard with sticky numeral + pillar list"
```

---

## Task 9: `MetricStrip` component (with counter-up)

**Files:**
- Create: `components/experience/MetricStrip.tsx`

- [ ] **Step 1: Implement the component**

Create `components/experience/MetricStrip.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/experience/MetricStrip.tsx
git commit -m "feat(experience): add MetricStrip with counter-up reveal"
```

---

## Task 10: `ExperienceSection` top-level wiring

**Files:**
- Create: `components/experience/ExperienceSection.tsx`

- [ ] **Step 1: Implement the section**

Create `components/experience/ExperienceSection.tsx`:

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableText } from "@/components/editable/EditableText";
import {
  EXPERIENCE_ROLE_DEFAULTS,
  type RoleDefault,
} from "@/lib/defaults/experienceRoles";
import { MetricStrip } from "./MetricStrip";
import { RoleCard } from "./RoleCard";

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
  /** When false, disables counter-up + sticky numerals (Variant B). */
  animate?: boolean;
};

export function ExperienceSection({ animate = true }: Props) {
  const roles = useQuery(api.experienceRoles.list);
  const data: RoleDefault[] =
    roles && roles.length > 0
      ? roles.map((r) => ({
          order: r.order,
          dates: r.dates,
          company: r.company,
          title: r.title,
          location: r.location,
          metric: r.metric,
          outcome: r.outcome,
          pillars: r.pillars,
        }))
      : EXPERIENCE_ROLE_DEFAULTS;

  // Each row falls back to its defaults entry for `pillars` if the live row
  // doesn't have any (so existing production rows still surface bullets).
  const rolesForRender: RoleDefault[] = data.map((live) => {
    if (live.pillars && live.pillars.length > 0) return live;
    const fallback = EXPERIENCE_ROLE_DEFAULTS.find(
      (d) => d.company === live.company && d.dates === live.dates,
    );
    return fallback ? { ...live, pillars: fallback.pillars } : live;
  });

  return (
    <section className="relative overflow-hidden bg-[#05060a] py-[clamp(96px,14vh,160px)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 80px), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 80px)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[1100px] px-6 sm:px-6 lg:px-10">
        <header>
          <div
            className="flex items-baseline justify-between text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            <EditableText
              page="home"
              slot="experience.eyebrowLeft"
              fallback="EXPERIENCE"
              as="span"
              singleLine
            />
            <EditableText
              page="home"
              slot="experience.eyebrowRight"
              fallback="2020 — NOW"
              as="span"
              singleLine
            />
          </div>
          <div
            aria-hidden
            className="mt-4 h-px w-full"
            style={{ background: HAIRLINE }}
          />
          <h2
            className="mt-8 text-[clamp(36px,5vw,56px)] leading-[1.05] tracking-[-1px] text-white"
            style={{ ...SERIF_ITALIC, fontWeight: 400 }}
          >
            <EditableText
              page="home"
              slot="experience.headline"
              fallback="Five years. One thesis."
              as="span"
              singleLine
            />
          </h2>
          <p className="mt-4 max-w-[640px] text-[17px] font-light leading-[1.5] text-white/65">
            <EditableText
              page="home"
              slot="experience.standfirst"
              fallback="Engineer → BA → PM. Each role compounded the last."
              as="span"
            />
          </p>
        </header>

        <div className="mt-[clamp(48px,8vh,96px)]">
          <MetricStrip animate={animate} />
        </div>

        <div className="mt-[clamp(64px,10vh,120px)] flex flex-col gap-[clamp(48px,8vh,96px)]">
          {rolesForRender.map((role, i) => (
            <RoleCard
              key={`${role.company}-${role.dates}`}
              role={role}
              index={i}
              stickyNumeral={animate}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/experience/ExperienceSection.tsx
git commit -m "feat(experience): add ExperienceSection top-level with Convex wiring"
```

---

## Task 11: A/B preview route at `app/preview/experience/page.tsx`

**Files:**
- Create: `app/preview/experience/page.tsx`

- [ ] **Step 1: Implement the preview page**

Create `app/preview/experience/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Smoke-test the route locally**

Run: `npm run dev` (in a separate terminal) and visit `http://localhost:3000/preview/experience`. Expected: both variants render, metric strip on Variant A counts up on first scroll into view, chapter numerals on Variant A stick to `top: 96px` while their parent role card scrolls past, Variant B shows static values + numerals.

- [ ] **Step 4: Commit**

```bash
git add app/preview/experience/page.tsx
git commit -m "feat(preview): add A/B preview route for Experience section"
```

- [ ] **Step 5: STOP and surface the preview URL to the user**

After the commit lands, surface to the user (the controller agent, not a subagent message):

> "Preview ready at `/preview/experience`. Variant A = sticky numerals + counter-up. Variant B = static. Which one ships?"

**Do not proceed to Task 12 until the user picks a variant.** If the user requests aesthetic adjustments before picking, treat that as a follow-up task on this plan and re-loop the preview commit.

---

## Task 12: Graduate winner + delete preview + delete in-hero strip + page wiring (single commit)

**Pre-requisite:** User picked Variant A or Variant B in Task 11. Capture the choice before this task starts. This task assumes the user picked **Variant A** (the spec's recommended). If they picked Variant B, replace `animate={true}` with `animate={false}` in Step 2 below.

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/home/Hero.tsx`
- Modify: `components/home/HeroPinController.tsx`
- Delete: `app/preview/experience/page.tsx`
- Delete: `components/home/Experience.tsx`
- Delete: `components/home/HeroCaseStudiesPlaceholder.tsx` (and any imports)

- [ ] **Step 1: Confirm `HeroCaseStudiesPlaceholder` has no other callers**

Run: `git grep -n "HeroCaseStudiesPlaceholder"` (or use the IDE Grep tool)
Expected: only `app/page.tsx` and the file itself reference it. If anything else does, leave the file in place and just remove the import from `app/page.tsx`.

- [ ] **Step 2: Wire `<ExperienceSection>` into `app/page.tsx`**

Replace `app/page.tsx` with:

```tsx
import { Hero } from "@/components/home/Hero";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import { ProjectGridPlaceholder } from "@/components/home/ProjectGridPlaceholder";
import { AboutPreviewPlaceholder } from "@/components/home/AboutPreviewPlaceholder";
import { ContactCTA } from "@/components/home/ContactCTA";
import { Reveal } from "@/components/scroll/Reveal";
import { CinematicIntro } from "@/components/cinematic/CinematicIntro";

export default function HomePage() {
  return (
    <>
      <CinematicIntro />
      <Hero />
      <Reveal>
        <ExperienceSection animate={true} />
      </Reveal>
      <Reveal>
        <ProjectGridPlaceholder />
      </Reveal>
      <Reveal>
        <AboutPreviewPlaceholder />
      </Reveal>
      <Reveal>
        <ContactCTA />
      </Reveal>
    </>
  );
}
```

- [ ] **Step 3: Drop `<Experience>` from `Hero.tsx`**

In `components/home/Hero.tsx`:

1. Remove the `import { Experience } from "./Experience";` line.
2. Remove `const experienceRef = useRef<HTMLDivElement>(null);` (the line declaring `experienceRef`).
3. Replace the wrapping `<div className="relative max-w-[640px]">` with `<div className="max-w-[640px]">`.
4. Delete the entire block:

```tsx
      <div className="absolute left-0 right-0 top-full">
        <Experience ref={experienceRef} />
      </div>
```

5. Remove the `experienceRef={experienceRef as React.RefObject<HTMLElement>}` line from the `<HeroPinController …/>` call.
6. Remove the comment block above the `<div className="relative max-w-[640px]">` wrapper that explains the absolute-positioning hack (lines 51–57 in the current file). The cleanup makes the comment stale.

- [ ] **Step 4: Drop `experienceRef` from `HeroPinController.tsx`**

Open `components/home/HeroPinController.tsx`. Make these edits:

1. Remove `experienceRef` from the `Props` type.
2. Remove the `experienceRef` parameter from any destructure of `Props`.
3. Remove the `gsap.set(p.experienceRef.current, { opacity: 0 })` initial-state line (if present — check the file).
4. Remove the `tl.to(p.experienceRef.current, { opacity: 1, duration: 0.10 }, 0.84)` tween (if present).

If the references are gated behind `data-experience-row` selectors instead of a single ref, also remove those selector queries.

- [ ] **Step 5: Delete the in-hero Experience component**

Run: `rm components/home/Experience.tsx`

- [ ] **Step 6: Delete the preview file**

Run: `rm app/preview/experience/page.tsx`

(If the directory `app/preview/experience` is now empty, also `rmdir app/preview/experience`. Leave `app/preview/` intact.)

- [ ] **Step 7: Delete `HeroCaseStudiesPlaceholder` if confirmed unused**

If Step 1 confirmed no other callers:

```bash
rm components/home/HeroCaseStudiesPlaceholder.tsx
```

- [ ] **Step 8: Verify TS compiles + tests pass**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 0 TS errors, all tests pass.

- [ ] **Step 9: Smoke-test locally**

Run: `npm run dev` and visit `http://localhost:3000`. Expected:
- Hero pins as before; CTA pills + recruiter rail in place; **no Experience strip beneath CTAs**.
- Scrolling past the pin reveals the new ExperienceSection: heading, metric strip (counts up on entry), three role cards (chapter numerals stick at `top: 96px` while each card scrolls past).
- `/preview/experience` returns 404.

- [ ] **Step 10: Commit (single commit, all changes together)**

```bash
git add app/page.tsx \
        components/home/Hero.tsx \
        components/home/HeroPinController.tsx
git rm components/home/Experience.tsx \
       app/preview/experience/page.tsx \
       components/home/HeroCaseStudiesPlaceholder.tsx
git commit -m "feat(experience): graduate section to home; remove in-hero strip"
```

(If `HeroCaseStudiesPlaceholder.tsx` had other callers per Step 1, drop it from the `git rm` line.)

---

## Task 13: Extend `/admin/edit` Experience tab with pillar editor

**Files:**
- Modify: `components/admin/AdminEditorRoles.tsx`

- [ ] **Step 1: Read the existing tab to understand its state shape**

Read `components/admin/AdminEditorRoles.tsx` end-to-end. Note where the form state is held, how a row is loaded, how the `upsert` mutation is called. Mirror those patterns when adding the pillar editor.

- [ ] **Step 2: Add a `location` text input next to the existing `dates`/`company`/`title`/`metric`/`outcome` fields**

The input wires into the same row-level form state object the existing inputs use, and the `onSave` handler passes `location` into the existing `upsert` call.

- [ ] **Step 3: Add the pillar editor block per role**

Below the existing fields (and above the per-row Save button) add a section with this structure (sketch — adapt to existing patterns):

```tsx
<details className="mt-4">
  <summary className="cursor-pointer text-sm text-white/70">
    Pillars ({pillars.length})
  </summary>
  <div className="mt-3 flex flex-col gap-4">
    {pillars.map((p, pi) => (
      <div key={pi} className="rounded border border-white/10 p-3">
        <input
          value={p.label}
          onChange={(e) => updatePillarLabel(pi, e.target.value)}
          className="w-full rounded bg-black/40 px-2 py-1 text-sm"
          placeholder="Pillar label, e.g. Revenue & Growth"
        />
        <ul className="mt-2 flex flex-col gap-2">
          {p.bullets.map((b, bi) => (
            <li key={bi} className="flex flex-col gap-1">
              <textarea
                value={b.text}
                onChange={(e) => updateBulletText(pi, bi, e.target.value)}
                className="w-full rounded bg-black/40 px-2 py-1 text-sm"
                rows={2}
                placeholder="Bullet text"
              />
              <input
                value={b.metric ?? ""}
                onChange={(e) => updateBulletMetric(pi, bi, e.target.value)}
                className="w-1/2 rounded bg-black/40 px-2 py-1 text-xs"
                placeholder="Inline metric (optional, e.g. +18%)"
              />
              <div className="flex gap-1 text-xs">
                <button type="button" onClick={() => moveBullet(pi, bi, -1)}>↑</button>
                <button type="button" onClick={() => moveBullet(pi, bi, +1)}>↓</button>
                <button type="button" onClick={() => removeBullet(pi, bi)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => addBullet(pi)} className="mt-2 text-xs">
          + Add bullet
        </button>
        <div className="mt-2 flex gap-1 text-xs">
          <button type="button" onClick={() => movePillar(pi, -1)}>↑ Pillar</button>
          <button type="button" onClick={() => movePillar(pi, +1)}>↓ Pillar</button>
          <button type="button" onClick={() => removePillar(pi)}>Delete pillar</button>
        </div>
      </div>
    ))}
    <button type="button" onClick={addPillar} className="text-xs">
      + Add pillar
    </button>
  </div>
</details>
```

The handler functions (`addPillar`, `addBullet`, `updatePillarLabel`, `updateBulletText`, `updateBulletMetric`, `moveBullet`, `movePillar`, `removePillar`, `removeBullet`) operate on a `pillars` slice of the row's form state. Each calls `setRow` (or whatever the existing setter is) with the next pillars array. Submit on the existing per-row Save button passes `pillars` along to the `upsert` mutation.

- [ ] **Step 4: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Smoke-test locally**

Sign in as an admin, visit `/admin/edit`, switch to the Experience tab. Expected: each row shows a `Pillars (N)` expandable. Open it, edit a pillar label or bullet metric, click Save, then visit `/`. The live Experience section should reflect the edit within Convex's reactive update window (~200ms).

- [ ] **Step 6: Commit**

```bash
git add components/admin/AdminEditorRoles.tsx
git commit -m "feat(admin): pillar editor for experience roles"
```

---

## Task 14: Build, push, verify Vercel deploy

**Files:** none (deployment task).

- [ ] **Step 1: Run the full build locally**

Run: `npm run build`
Expected: clean Next.js production build, 0 TS errors, 0 lint errors. If lint warns, fix before pushing.

- [ ] **Step 2: Run all tests one last time**

Run: `npx vitest run`
Expected: all tests pass.

- [ ] **Step 3: Push to `main`**

Run: `git push origin main`
Expected: push succeeds. Vercel auto-deploys from GitHub (per `deployment_workflow.md` memory — never manual `vercel deploy`).

- [ ] **Step 4: Watch the Vercel deployment to READY**

Run: `vercel inspect <latest-deployment-url>` (or use the Vercel MCP `list_deployments` → `get_deployment` tools).
Expected: status `READY`. If it errors, read the deployment build logs and surface to the user.

- [ ] **Step 5: Surface final verdict**

Report to the user:
- Live URL.
- Confirmation that the Experience section renders below the hero with the metric strip + role cards.
- Confirmation that `/admin/edit` Experience tab can edit pillars.
- Any deferred follow-ups (the spec's "Out of Scope" section: Projects, Contact + Calendly, headline metric editability).

---

## Out of Scope

- Projects section (next brainstorm).
- Contact section with Calendly integration (brainstorm after Projects).
- Headline metric strip → `siteContent` slots (deferred follow-up; flagged in spec).
- Education / GrowthX / certifications (dropped during brainstorming).
- Animation choreography beyond counter-up + sticky numerals.

## Success Criteria

1. Preview route at `/preview/experience` shows both variants A and B at production aesthetic quality.
2. User picks a variant; chosen variant graduates into the live homepage.
3. Live homepage shows: metric strip with counter-up on first scroll into view, three role cards with sticky chapter numerals on desktop and stacked layout on phone, hero pin no longer contains the Experience strip.
4. `/admin/edit` Experience tab can add/edit/remove pillars and bullets; live page reflects edits within Convex's reactive update window.
5. Vercel build is green; Lighthouse performance not regressed beyond ±2 points from current baseline.
