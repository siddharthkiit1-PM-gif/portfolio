# Experience Section — Design Spec

**Date:** 2026-05-10
**Status:** Approved by user, ready for implementation planning
**Owner:** Siddharth Agrawal

---

## Goal

Graduate the Experience strip currently tucked inside the hero pin into its own dedicated, editorial-calm scroll section between Hero and Projects. The section is the recruiter "receipts" page — a hybrid of (1) a three-tile headline metric strip that lands the strongest impact numbers in eight seconds, and (2) three role cards with themed bullet pillars that show breadth and depth across five years of B2B SaaS work.

## Approach Summary

| Axis | Decision |
|---|---|
| Section job | Recruiter receipts: skim-first metric strip → read-second role cards |
| Aesthetic register | Editorial calm — hairlines, serif italic, mono caps, generous whitespace, no chromatic/gradient effects |
| Headline strip | 3 tiles — `$500K ARR contributed`, `+18% retention`, `–98% manual ops` |
| Role-card structure | Themed pillar groups inside each card (Revenue & Growth · Retention & Customer · Data Quality & ML · Operational Leverage), every resume bullet preserved |
| Data model | Convex `experienceRoles` extended with optional `pillars[]` and `location` fields; admin-editable through the existing `/admin/edit` Experience tab |
| Headline strip storage | Hardcoded in `MetricStrip.tsx` as `HEADLINE_METRICS` const. Pragmatic deviation from CLAUDE.md's editable-by-default rule — only 3 stable strings, tightly coupled to section heading copy. Promotion to `siteContent` is a follow-up if it ever needs to be edited without a code commit. |
| Page placement | Replaces `<HeroCaseStudiesPlaceholder />` slot in `app/page.tsx` (first reveal-section after the hero pin) |
| Scroll behavior | Counter-up on metric strip entry + CSS sticky chapter numerals on each role card |
| Hero cleanup | Drop the in-hero `<Experience>` strip + `experienceRef` plumbing from `Hero.tsx` and `HeroPinController.tsx`; delete `components/home/Experience.tsx` |
| Sign-off vehicle | Two variants A/B on a preview route at `app/preview/experience/page.tsx` (per CLAUDE.md). Variant chosen → graduate to `components/experience/` and delete preview file in the same commit. |

## File Structure

```
components/experience/
├── ExperienceSection.tsx        — top-level. Reads experienceRoles via Convex.
│                                  Renders <MetricStrip/> + <RoleCard/> × 3.
│                                  Owns section heading + container layout.
├── MetricStrip.tsx              — 3-tile headline. Defines HEADLINE_METRICS const.
│                                  Uses useCountUp for entry animation.
├── RoleCard.tsx                 — chapter numeral (sticky) + role header + pillars.
│                                  Two-column grid [120px_1fr].
├── PillarBlock.tsx              — one themed group: label + bulleted list.
│                                  Renders bullets, splits inline metrics for accent rendering.
└── ChapterNumeral.tsx           — decorative 01/02/03 (serif italic, white/8%).

lib/motion/
└── useCountUp.ts                — IntersectionObserver-triggered count-up hook.
                                   Parses "$500K" → { prefix:"$", number:500, suffix:"K" }.
                                   Animates 0 → number over 1.2s easeOutCubic.
                                   Respects useReducedMotion (returns final value immediately).

lib/defaults/
└── experienceRoles.ts           — extend EXPERIENCE_ROLE_DEFAULTS with pillars[] and
                                   location. Verbatim resume bullets, organised by pillar.
                                   Headline metric on PM role uses "$500K ARR" (per
                                   user instruction — overrides resume's $100K).

convex/
├── schema.ts                    — extend experienceRoles table:
│                                   + location: v.optional(v.string())
│                                   + pillars: v.optional(v.array(v.object({ label, bullets[] })))
└── experienceRoles.ts           — extend upsert mutation args to accept location + pillars.
                                   list query unchanged (selects all fields).

convex/_generated/                — regenerated and committed (per convex_vercel.md memory:
                                    Vercel does not run convex dev; missing _generated breaks build).

app/admin/edit/                  — extend the existing Experience tab with a pillar editor:
                                   per-role expandable section with add/remove/reorder for
                                   pillars and bullets within each pillar. Bullet rows have
                                   two inputs (text + optional metric).

app/preview/experience/page.tsx  — preview route. Renders 2 variants A/B for sign-off.
                                   Deleted in the same commit that graduates a winner.

app/page.tsx                     — replace <HeroCaseStudiesPlaceholder/> with
                                   <ExperienceSection/> (wrapped in <Reveal/>).

components/home/Hero.tsx         — remove experienceRef, the absolute-positioned
                                   <Experience/> wrapper at top:100%, and the
                                   "relative" wrapper hack (no longer needed once
                                   Experience leaves the hero).
components/home/HeroPinController.tsx — remove experienceRef prop and the dwell-beat
                                   tween at progress 0.84 that revealed the in-hero strip.
components/home/Experience.tsx   — DELETE. Graduated to components/experience/.
```

## Visual Treatment

### Backdrop and container

- Background: `#05060a` (same deep navy as hero — visual continuity with the page).
- Single faint hairline grid: `repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 80px), repeating-linear-gradient(90deg, …)` (re-uses the hero's quiet grid, slightly lower opacity).
- No vignette, no chromatic split, no flowing-gradient text. Editorial calm = visual reset after the hero's cinema.
- Container: `max-w-[1100px] mx-auto px-10 lg:px-10 sm:px-6` (responsive horizontal padding).
- Vertical rhythm: `py-[clamp(96px,14vh,160px)]` so the section breathes on tall displays without crushing on 13" laptops.

### Typography ramp (the editorial calm DNA)

| Role | Family | Size | Weight | Letter-spacing | Color |
|---|---|---|---|---|---|
| Section eyebrow | mono | 10px | 400 | 0.32em uppercase | white/45 |
| Section headline | serif italic | clamp(36px, 5vw, 56px) | 400 | -1px | white |
| Section standfirst | Inter | 17px | 300 | normal | white/65 |
| Metric tile value | mono | clamp(56px, 7vw, 80px) | 500 | -1.5px tabular-nums | white |
| Metric tile label | mono | 10.5px | 400 | 0.28em uppercase | white/55 |
| Metric tile context | Inter | 13px | 400 | normal | white/55 |
| Chapter numeral | serif italic | clamp(96px, 12vw, 144px) | 300 | -3px | white/8% |
| Role company | serif italic | clamp(28px, 3.5vw, 40px) | 500 | -0.5px | white |
| Role meta | mono | 11.5px | 400 | 0.18em uppercase | white/55 |
| Pillar label | mono | 10.5px | 500 | 0.32em uppercase | white/65 |
| Bullet text | Inter | 15.5px | 300 | normal, 1.55 leading | white/85 |
| Bullet inline metric | mono | 15.5px | 600 | tabular-nums | white |

**Font stacks** (already wired in the project):
- mono: `ui-monospace, SFMono-Regular, Menlo, monospace`
- serif: `ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif`
- Inter: `var(--font-inter), ui-sans-serif, system-ui, sans-serif`

### Layouts

**Section heading block:**
```
EXPERIENCE                                            2020 — NOW   ← mono, white/45
─────────────────────────────────────────────────────────────────  ← hairline
Five years. One thesis.                                            ← serif italic, white
Engineer → BA → PM. Each role compounded the last.                 ← Inter, white/65
```
Eyebrow uses `flex items-baseline justify-between` — left side is `EXPERIENCE`, right side is `2020 — NOW`.

**Metric strip:**
- 3-column CSS grid, equal widths, `gap-x-12 gap-y-8`.
- Each tile is left-aligned, four lines vertical:
  1. Value (mono tabular nums, clamp 56–80px) — e.g. `$500K`
  2. Label (mono uppercase 10.5px) — e.g. `ARR CONTRIBUTED`
  3. 1px hairline at 28% width, white/14
  4. Context (Inter 13px) — e.g. `Market insight signals shipped 0→1 to 30+ enterprise customers`
- No card chrome / no border / no background. Editorial-magazine, not dashboard.

**Role card:**
- Two-column CSS grid: `grid-cols-[120px_1fr] gap-x-10`.
- Left column: chapter numeral (sticky `position: sticky; top: 96px`).
- Right column structure:
  ```
  6sense Insights                                              ← serif italic
  PRODUCT MANAGER · BANGALORE · JUL 2024 — PRESENT             ← mono caps
  ──────────────────────────────────────────────────────────   ← hairline
  REVENUE & GROWTH                                             ← pillar label
   ‣ Bullet 1 with $500K ARR inline metric.                    ← Inter + mono accent
  RETENTION & CUSTOMER RESEARCH                                ← pillar label
   ‣ …
   ‣ …
  …
  ```
- 16px gap between bullets within a pillar; 32px gap between pillars.
- Each pillar label has a 1px hairline above it, except the first (which has the role-header hairline).
- Bullets render as `<li>` with a small `‣` glyph or hairline marker; choose at implementation time based on visual weight (the implementer + frontend-design skill will pick).

**Sticky chapter numeral mechanism.**
- Pure CSS: `position: sticky; top: 96px` on the numeral wrapper inside the left column.
- Numeral travels with the viewport while inside its parent role card; releases when the next card overtakes it (browser handles this automatically).
- No JS required for the sticky behavior itself — only the counter-up needs JS.

### Mobile (< 768px)

- Metric strip stacks vertically: 3 full-width tiles, value size reduces to `clamp(44px, 11vw, 64px)`.
- Role card collapses to single column.
- Chapter numeral becomes a top-of-card decoration: 64px serif italic at white/12, **not sticky** (viewport too short for sticky to feel calm; it would scroll-jam).
- Pillar blocks stay the same — pillar label row, bullets below.
- Container padding shrinks to `px-6`.

### Counter-up reveal

- Trigger: IntersectionObserver, fires when the metric strip's bounding box intersects 60% of the viewport.
- Parsing: `useCountUp` accepts a value string and parses `{ prefix?, number, suffix? }`:
  - `"$500K"` → `{ prefix:"$", number:500, suffix:"K" }`
  - `"+18%"` → `{ prefix:"+", number:18, suffix:"%" }`
  - `"-98%"` → `{ prefix:"-", number:98, suffix:"%" }`
- Animation: `0 → number` over 1200ms with `easeOutCubic`. Render `${prefix}${currentValue}${suffix}` each frame.
- Stagger: 80ms between tiles (tile 0 fires at 0ms, tile 1 at 80ms, tile 2 at 160ms).
- Reduced-motion: returns final value immediately, no animation. Uses existing `useReducedMotion` hook.
- Once-only: the observer disconnects after the first intersection; scrolling away and back does not re-trigger.

## Data Model

### Convex schema additions

```ts
// convex/schema.ts
experienceRoles: defineTable({
  order: v.number(),
  dates: v.string(),
  company: v.string(),
  title: v.string(),
  metric: v.string(),
  outcome: v.optional(v.string()),
  // NEW
  location: v.optional(v.string()),
  pillars: v.optional(v.array(v.object({
    label: v.string(),
    bullets: v.array(v.object({
      text: v.string(),
      metric: v.optional(v.string()),
    })),
  }))),
  updatedAt: v.number(),
})
  .index("by_order", ["order"])
  .index("by_company_dates", ["company", "dates"]),
```

Both `location` and `pillars` are optional so existing rows in the production Convex DB continue to validate without a backfill. Components fall back to `EXPERIENCE_ROLE_DEFAULTS` when the Convex query returns rows missing these fields.

### `convex/experienceRoles.ts` `upsert` mutation

Extends the args object to accept the new optional fields and writes them through unchanged. `list`, `remove`, `reorder` mutations are unchanged.

### Defaults file content (`lib/defaults/experienceRoles.ts`)

Three roles, with verbatim resume bullets organised by pillar. The legacy top-line `metric` field is **no longer rendered** by the new RoleCard (the new design surfaces metrics inline within bullets via `pillars[].bullets[].metric`). The field stays in the schema and defaults so existing rows in production Convex remain valid and the existing `/admin/edit` Experience tab form continues to work without a breaking change. **PM role's `metric` is bumped to `"$500K ARR"` per user instruction** — both as a defensive update for the unused field and to keep defaults consistent with the new headline strip.

```ts
export const EXPERIENCE_ROLE_DEFAULTS = [
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
] as const;
```

### `HEADLINE_METRICS` const (`MetricStrip.tsx`)

```ts
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
```

### Section heading copy

Stored as four `siteContent` slots (free copy, follows the existing editable-by-default pattern):

| Slot | Fallback |
|---|---|
| `experience.eyebrowLeft` | `EXPERIENCE` |
| `experience.eyebrowRight` | `2020 — NOW` |
| `experience.headline` | `Five years. One thesis.` |
| `experience.standfirst` | `Engineer → BA → PM. Each role compounded the last.` |

Rendered through `<EditableText page="home" slot="experience.…" fallback="…" />` so the in-page admin bar can edit them inline, same as hero copy.

## Admin Editor Extensions

`/admin/edit` already has an Experience tab that lists `experienceRoles` rows with editable `dates`, `company`, `title`, `metric`, `outcome`. Extend it:

1. Add a `location` text input alongside the existing fields.
2. Add an expandable "Pillars" section per role:
   - List of pillar blocks. Each block has:
     - Label input (text)
     - List of bullet rows, each with: text input (textarea) + optional metric input (text)
     - Add bullet button at the bottom of each pillar
     - Reorder controls (up/down) on each bullet
     - Delete bullet button on each bullet
   - Add pillar button below the list
   - Reorder controls (up/down) on each pillar
   - Delete pillar button on each pillar
3. Save button (existing) submits the full role object including `pillars[]` to `experienceRoles.upsert`.

Form state managed with React state in the existing tab component; submit calls the existing Convex mutation pattern.

## Counter-up Implementation (`useCountUp`)

```ts
// lib/motion/useCountUp.ts (sketch)
type CountUpResult = {
  ref: RefObject<HTMLElement>;     // attach to the element to observe
  display: string;                 // current display string, e.g. "$237K" mid-animation
};

function useCountUp(
  value: string,         // e.g. "$500K"
  options?: {
    durationMs?: number; // default 1200
    delayMs?: number;    // default 0
  }
): CountUpResult;
```

Internal: parses `value` with a regex into `{ prefix, number, suffix }`. On first intersection (>= 60% visible), starts a `requestAnimationFrame` loop that interpolates `0 → number` with `easeOutCubic`, formats with `Math.round` each frame, returns `${prefix}${current}${suffix}`. Disconnects observer after firing. Reduced-motion users: returns `value` directly, no animation.

`MetricStrip.tsx` invokes `useCountUp` once per tile with staggered `delayMs: i * 80`.

## Preview Route + Sign-off Flow

`app/preview/experience/page.tsx` renders **two variants on the same page**, framed and labelled, per CLAUDE.md.

**Variant A — Recommended.** Everything specified above:
- Metric strip with counter-up on entry.
- Role cards with sticky chapter numerals (`top: 96px`).
- Full pillar density, all defaults bullets.

**Variant B — Quieter alt.** Same content, motion stripped:
- Metric strip values fade in (no counter-up).
- Chapter numerals stay static at the top of each card (no sticky).
- Otherwise identical typography and layout.

The preview page wraps each variant in a labelled frame block with a header like `VARIANT A — STICKY + COUNTER-UP` so the user can compare side-by-side at real fidelity. Both variants share the same Convex query (so editing a bullet in `/admin/edit` updates both).

After user picks A or B (or asks for a third), the implementer:
1. Promotes the chosen variant's component code into `components/experience/` (replacing any preview-only inline code with the canonical sub-components: `MetricStrip`, `RoleCard`, `PillarBlock`, `ChapterNumeral`).
2. Wires `app/page.tsx` to render `<ExperienceSection/>` in place of `<HeroCaseStudiesPlaceholder/>`.
3. Removes the in-hero `<Experience/>` strip + `experienceRef` plumbing from `Hero.tsx` and `HeroPinController.tsx`.
4. Deletes `components/home/Experience.tsx`.
5. Deletes `app/preview/experience/page.tsx`.
6. All in the same commit, so the preview file never lingers.

## Hero Cleanup (Same Plan)

When Experience graduates out of the hero, these edits land in the same plan:

- `components/home/Hero.tsx`:
  - Drop the `experienceRef = useRef<HTMLDivElement>(null)` declaration.
  - Drop the `<div className="absolute left-0 right-0 top-full"><Experience ref={experienceRef} /></div>` wrapper at the bottom of the copy column.
  - The wrapping `<div className="relative max-w-[640px]">` can drop the `relative` (no longer anchoring an absolutely-positioned child); revert to `<div className="max-w-[640px]">`.
  - Drop `experienceRef={experienceRef as React.RefObject<HTMLElement>}` from the `<HeroPinController/>` props.
  - Remove the `import { Experience } from "./Experience"` line.

- `components/home/HeroPinController.tsx`:
  - Drop `experienceRef` from the `Props` type.
  - Drop the `gsap.set(p.experienceRef.current, { opacity: 0 })` initial state.
  - Drop the `tl.to(p.experienceRef.current, { opacity: 1, duration: 0.10 }, 0.84)` tween.

- `components/home/Experience.tsx`: **delete**.

This cleanup is testable — after it lands, scrolling the live hero should leave the CTAs and recruiter rail in place, with no Experience strip beneath. The new section appears as the next reveal-block when the user scrolls past the pin.

## Page Composition After

```tsx
// app/page.tsx (after)
<>
  <CinematicIntro />
  <Hero />
  <Reveal>
    <ExperienceSection />              {/* NEW — replaces HeroCaseStudiesPlaceholder */}
  </Reveal>
  <Reveal>
    <ProjectGridPlaceholder />          {/* unchanged for now */}
  </Reveal>
  <Reveal>
    <AboutPreviewPlaceholder />         {/* unchanged for now */}
  </Reveal>
  <Reveal>
    <ContactCTA />                       {/* unchanged for now */}
  </Reveal>
</>
```

`<HeroCaseStudiesPlaceholder/>` (and its file) is deleted in the same commit since it has no other callers.

## Migration Order (rough — full bite-sized plan comes from writing-plans)

1. Convex schema additions + `_generated/` regenerate + commit (must come first, Vercel needs it for build).
2. Defaults file extension with verbatim resume content.
3. `useCountUp` hook (TDD: parser tests + intersection-trigger test).
4. `ChapterNumeral`, `PillarBlock`, `RoleCard`, `MetricStrip` components, in dependency order.
5. `ExperienceSection` top-level wiring.
6. Preview route at `app/preview/experience/page.tsx` rendering both variants.
7. **User picks A or B at this gate.**
8. Graduate to `app/page.tsx`, delete `HeroCaseStudiesPlaceholder`, delete `components/home/Experience.tsx`, drop in-hero refs from `Hero.tsx` + `HeroPinController.tsx`, delete preview file. Single commit.
9. Admin editor extension for pillars (last because the section can render from defaults indefinitely; admin edits are a follow-up convenience).
10. Build, push, Vercel auto-deploys.

## Out of Scope (deliberately deferred)

- Projects section (next brainstorm).
- Contact section with Calendly integration (next brainstorm after projects).
- Headline metric strip admin-editability (flagged as a small follow-up if/when needed).
- Education / GrowthX / certifications surfacing — user dropped this from the Experience footer; will be considered separately during About-section work if at all.
- Animation choreography beyond counter-up + sticky numerals (no per-bullet stagger, no parallax, no scroll-snap — editorial calm by design).

## Success Criteria

The section ships when:

1. The preview route shows both variants A and B at production aesthetic quality (frontend-design skill review passes).
2. User picks a variant from the preview and approves graduation.
3. Live homepage shows: metric strip with counter-up on first scroll into view, three role cards with sticky chapter numerals on desktop and stacked layout on phone, hero pin no longer contains the Experience strip.
4. `/admin/edit` Experience tab can add/edit/remove pillars and bullets, and the live page reflects edits within Convex's reactive update window.
5. Build is green on Vercel and Lighthouse performance is not regressed beyond ±2 points from the current homepage baseline.
