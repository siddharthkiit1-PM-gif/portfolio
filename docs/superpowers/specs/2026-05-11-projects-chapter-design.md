# Projects Chapter — Design Spec

**Date:** 2026-05-11
**Status:** Approved by user, ready for implementation planning
**Owner:** Siddharth Agrawal

---

## Goal

Build the Projects chapter — three surfaces backed by one Convex collection — so every shipped project and case study has a permanent home with its own URL, and the homepage gets a cinematic featured-projects beat between Experience and Contact.

- **Homepage** Projects chapter (cinematic vertical stack, 3–4 featured projects).
- **`/projects`** editorial-table index (every project + case study).
- **`/projects/[slug]`** per-project detail page (fact sheet + optional case-study narrative).

All content is admin-editable through a new "Projects" tab in `/admin/edit`. Convex reactivity pushes admin edits live without a rebuild. Initial seed ships 1–2 placeholder rows; the user fills real content through the admin tab.

## Approach Summary

| Axis | Decision |
|---|---|
| Surfaces | Homepage chapter + `/projects` index + `/projects/[slug]` detail |
| Data model | One Convex `projects` table; projects and case studies share the schema, narrative fields optional |
| Title-line | `outcome` field (emergent.sh outcome-led pattern) if present, else `title`. Project name renders as the eyebrow / subtitle. |
| Featured selection | `featured: boolean` flag on each row; controlled in admin |
| Homepage register | Full cinema — chromatic + flowing-gradient titles, sticky chapter numerals, scroll-tied media scale per beat |
| `/projects` register | Restrained — hover-only motion, faint chromatic on hover, hairline separators |
| `/projects/[slug]` register | Almost static — hero image opacity fade-in on mount, count-up on optional hero metric |
| Media | Single hero image per project via Convex `_storage` (id stored on row). Video deferred. |
| Tech stack | Freeform `string[]` chips per project. No predefined taxonomy. |
| Slug | Auto-generated from title; editable in admin; uniqueness validated on save |
| Order | Admin-controlled via reorder buttons; no drag-to-reorder at v1 |
| Sign-off vehicle | Preview route at `app/preview/projects/page.tsx` (per CLAUDE.md), then graduate winner to production and delete preview in the same commit |
| Hero cleanup | None — Projects slot replaces the existing `<ProjectGridPlaceholder />` in `app/page.tsx` |
| Auth boundary | Public Convex reads (`list`, `listFeatured`, `getBySlug`). Admin-only writes (`upsert`, `delete`) guarded by `requireAdmin(ctx)`. |

---

## File Structure

```
components/projects/
├── ProjectsSection.tsx          — homepage cinematic stack. Reads listFeatured.
│                                  Renders <ProjectScrollBeat/> × N + chapter close.
├── ProjectScrollBeat.tsx        — one featured project's full-bleed scroll beat.
│                                  Two-column md+, stacked mobile. Owns its own
│                                  ScrollTrigger for the media scale tween.
├── ProjectsIndex.tsx            — /projects editorial table. Reads list().
│                                  Renders header shell + <ProjectIndexRow/> × N.
├── ProjectIndexRow.tsx          — one row in the editorial table. Hover-only motion.
├── ProjectDetail.tsx            — /projects/[slug] page body. Reads getBySlug().
│                                  Owns header + hero image + fact sheet +
│                                  conditional narrative + prev/next nav.
├── ProjectMetadataStrip.tsx     — shared icon row: GitHub / Live / Figma + tech chips.
└── ProjectNarrative.tsx         — shared: Approach + Outcome blocks with hero metric.
                                   Used only on detail page; only renders when approach set.

app/
├── page.tsx                     — replace <ProjectGridPlaceholder/> with
│                                  <Reveal><ProjectsSection/></Reveal>.
├── projects/
│   ├── page.tsx                 — renders <ProjectsIndex/>. Static metadata + SEO.
│   └── [slug]/page.tsx          — generateMetadata via getBySlug; renders <ProjectDetail/>.
└── preview/projects/page.tsx    — A/B/C preview route, deleted at graduation.

convex/
├── schema.ts                    — add `projects` table (see Convex Schema section).
├── projects.ts                  — list / listFeatured / getBySlug / upsert / delete.
└── seed.ts                      — extend with 1–2 minimal placeholder rows so the
                                   surfaces don't 404 at launch.

components/admin/
└── AdminEditorProjects.tsx      — 4th tab in /admin/edit. CRUD + reorder + upload.

app/admin/edit/page.tsx          — wire the new 4th tab into the admin shell.

lib/defaults/
└── projects.ts                  — PROJECT_DEFAULTS constant (1–2 placeholders),
                                   shape-matched to the Convex row.
```

`useCountUp` (already at `lib/motion/useCountUp.ts`) is reused unchanged for the optional hero-metric count-up on the detail page. `ChapterNumeral` (already at `components/experience/ChapterNumeral.tsx`) is reused unchanged for the sticky chapter numerals on the homepage Projects chapter — kept in its current path; imported across chapter boundaries.

---

## Convex Schema

```ts
projects: defineTable({
  // identity
  slug: v.string(),
  order: v.number(),
  featured: v.boolean(),

  // identity copy
  title: v.string(),
  outcome: v.optional(v.string()),
  year: v.string(),
  role: v.optional(v.string()),

  // links
  liveUrl: v.optional(v.string()),
  githubUrl: v.optional(v.string()),
  figmaUrl: v.optional(v.string()),

  // metadata
  techStack: v.array(v.string()),

  // hero media
  heroImageStorageId: v.optional(v.id("_storage")),
  heroImageAlt: v.optional(v.string()),

  // fact sheet (required)
  problem: v.string(),
  users: v.string(),
  value: v.string(),

  // case-study narrative (optional — leave blank for hobby projects)
  approach: v.optional(v.string()),
  outcomeNarrative: v.optional(v.string()),
  heroMetricValue: v.optional(v.string()),
  heroMetricLabel: v.optional(v.string()),

  updatedAt: v.number(),
})
  .index("by_slug", ["slug"])
  .index("by_order", ["order"])
  .index("by_featured_order", ["featured", "order"]);
```

**Why one table:** projects and case studies share 90% of the fields. A row with `approach` filled renders the narrative section on the detail page and is labelled "CASE STUDY" in the eyebrow; a row with `approach` empty hides the narrative section and is labelled "PROJECT". One table, one editor, one query family.

**Index choices:**
- `by_slug` powers `getBySlug` on the detail page.
- `by_order` powers `list` for `/projects` and admin.
- `by_featured_order` powers `listFeatured` for the homepage chapter (selects `featured == true`, ordered ascending).

**Title-line rendering rule (everywhere):** `outcome ?? title`. The project name renders as the eyebrow / subtitle below the title-line. This delivers emergent.sh's outcome-led title pattern without forcing every hobby project to fabricate an outcome.

---

## Convex API

```
list                  query   — args: {}. Returns all rows ordered by `order` ASC.
listFeatured          query   — args: {}. Returns rows where `featured == true`, ordered by `order` ASC.
getBySlug             query   — args: { slug }. Returns one row or null.
upsert                mutation— args: full row payload minus `_id`, `_creationTime`, `updatedAt`.
                                Admin-only via requireAdmin(ctx). Validates slug uniqueness
                                (excluding the row being edited). Returns the row id.
remove                mutation— args: { id }. Admin-only. Deletes the row.
```

`upsert` performs a slug-uniqueness check by querying `by_slug` and rejecting if a different row already owns the slug. URL fields are validated for parseability via `new URL(value)` and rejected on failure.

---

## Editable Slots (free copy via `EditableText`)

Homepage Projects chapter:
- `projects.eyebrowLeft` — fallback `"PROJECTS · 2022 — 2026"`
- `projects.eyebrowRight` — optional right-aligned eyebrow, fallback empty
- `projects.headline` — fallback `"Selected work, in detail."`
- `projects.standfirst` — fallback `"A small set of products I led, designed, or built — each with the problem, the people, and the result."`
- `projects.indexLinkLabel` — fallback `"See all {count} projects →"` (the `{count}` token is replaced client-side with the live count from `list`)

`/projects` index:
- `projects.indexEyebrow` — fallback `"PROJECTS"`
- `projects.indexHeadline` — fallback `"Everything I've shipped."`
- `projects.indexStandfirst` — fallback `"{count} projects, 2018 → now."` (same `{count}` token rule)
- `projects.indexMetaDescription` — fallback `"Projects and case studies by Siddharth Agrawal."` (used in `<head>` description)

`/projects/[slug]`:
- No `EditableText` on the detail page itself — every string there comes from the Convex row. The fact-sheet labels (`PROBLEM`, `USERS`, `VALUE`) and narrative labels (`APPROACH`, `OUTCOME`) are static visual chrome, not editable.

---

## Page-by-Page Spec

### Homepage Projects chapter (`components/projects/ProjectsSection.tsx`)

Slots into `app/page.tsx` in place of the current `<ProjectGridPlaceholder />`, between the Experience `<Reveal>` and the About `<Reveal>`.

**Chapter shell (~60vh):**
- Two eyebrow strings (left + right-aligned), `EditableText` `projects.eyebrowLeft` and `projects.eyebrowRight`.
- Two-line headline rendered with `ChromaticText` + `FlowingGradientText` (matching hero's name-climax treatment). Source: `projects.headline` `EditableText`.
- Standfirst paragraph (`projects.standfirst`), `text-white/75`, `max-w-[560px]`, `leading-[1.55]`.

**Featured beats (3–4 × ~110vh each):**

Driven by `listFeatured`. Each row renders one `<ProjectScrollBeat>` with two-column layout on `md+`, stacked on mobile.

Left column (in scroll, sticky chapter numeral until the beat passes):
- `<ChapterNumeral n={i+1} />` — reusing Experience's component, sticky `top-24` on `md+`.
- **Title-line** = `outcome ?? title`. Rendered with `ChromaticText amount={0.35}` outer + `FlowingGradientText` inner. Size `clamp(48px, 6.5vh, 72px)`, `font-weight: 500`, `tracking-[-2px]`.
- **Project name** as the eyebrow above the title-line, mono, tracked `0.28em`, `text-white/55`, uppercase. Renders only when `outcome` is present (since otherwise the title-line already shows the project name and the eyebrow would duplicate).
- **Problem one-liner** below the title — first sentence of `problem` truncated at ~120 chars (CSS `line-clamp-2` is the impl; "first sentence" is a content-author guideline, not a runtime parse).
- **Tech-stack chips** — render `techStack.slice(0, 5)` as hairline-bordered chips. `text-[10.5px]`, mono, `tabular-nums`, `text-white/70`. No fills.
- **`<ProjectMetadataStrip>`** — three icon links (GitHub / Live / Figma). Each renders only if the field is set. Hairline above the strip. Icons from `lucide-react` if already in dependencies; else inline SVGs at v1.
- **CTA**: `Read case study →` when `approach` is filled, else `View project →`. Target: `/projects/[slug]`. Right-arrow uses `&rarr;` matching hero CTAs.

Right column (hero media):
- `<Image>` via `next/image` with `fill` and `object-cover`, source from `heroImageStorageId` (resolved server-side via Convex storage URL). `heroImageAlt` populates `alt`.
- Aspect ratios: 16:10 desktop, 4:3 `md` only, 16:9 mobile.
- Rounded `2xl`, hairline border `rgba(255,255,255,0.08)`, subtle `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04)`.
- **Motion**: per-beat GSAP timeline with its own `ScrollTrigger` scrubbed against the beat's section. Image scales `1.02 → 1.0` and lifts `12px` over the scroll-through. No global pin; deliberately separate from `HeroPinController` to avoid the desync hazard called out in `CLAUDE.md`.
- Reduced-motion: static (no scale tween, no lift).

**Between beats:** 1px hairline divider `rgba(255,255,255,0.06)`, `max-w-[1400px]` centered.

**Chapter close (~30vh):**
- Right-aligned `EditableText` `projects.indexLinkLabel` rendered as a link to `/projects`. Substitutes `{count}` with the live `list().length` (with skeleton when undefined).
- Hairline above the link.
- Same chromatic register as the hero CTAs, smaller scale.

**Empty state:** If `listFeatured()` returns 0 rows, hide the beats entirely and show a single line: `"Featured projects coming soon."` below the standfirst. The "See all N projects →" link still renders.

### `/projects` index (`app/projects/page.tsx` + `components/projects/ProjectsIndex.tsx`)

Renders the full collection via `list()`.

**Header shell:**
- Top-left `← Back to home` (hairline link to `/`).
- Eyebrow (`projects.indexEyebrow`), serif italic display headline with chromatic treatment (`projects.indexHeadline`), mono small standfirst (`projects.indexStandfirst` with `{count}` substitution).
- Full-width hairline divider.

**Body — single-column editorial table.** No filter bar, no search at v1.

Each row (`<ProjectIndexRow>`), `md+`:

```
[thumbnail 120×80] [year] [title-line + ROLE · PROJECT NAME meta] [≤3 tech chips + "+N"] [→]
```

- **Title-line**: `outcome ?? title`. `clamp(20px, 2.4vw, 28px)`, weight 400. Hover applies `<ChromaticText amount={0.15}>`.
- **Year**: `tabular-nums`, mono, `text-white/55`.
- **Meta line**: render `[role, projectName].filter(Boolean).join(" · ").toUpperCase()`, where `projectName = title` when `outcome` is present (so the title-line shows `outcome` and the meta shows the project name), otherwise omitted (the title-line already shows `title`). When `role` is empty, only the project name renders.
- **Tech chips**: `techStack.slice(0, 3)` with `+{techStack.length - 3}` overflow chip when applicable. Hairline-bordered, mono.
- **Thumbnail**: `next/image` with `width=120 height=80`, `object-cover`, rounded `md`, hairline border. Missing image → placeholder tile showing the row number in serif italic at `clamp(28px, 4vw, 36px)`, weight 300, `text-white/15`.
- Whole row is an `<a href="/projects/{slug}">`. Hover: `transform: translateY(-1px)`, hairline brightens to `rgba(255,255,255,0.18)`, thumbnail scales `1.02`. Reduced-motion: hover lift removed, hairline-brighten kept.
- Vertical rhythm: 140px row height desktop, 32px gap between rows.

Mobile (`<md`): each row stacks — thumbnail on top, then mono line `[year]   [chip][chip][chip]`, then title-line, then the meta line (role · project name as above), then arrow at the bottom-right.

**Empty state:** Single line `"No projects yet."` below the standfirst. Won't fire in practice — seed guarantees ≥ 1 row.

**SEO:** static `metadata` export at the top of `app/projects/page.tsx`:
- `title: "Projects — Siddharth Agrawal"`
- `description: <projects.indexMetaDescription slot value>` (resolved at request time via Convex, or fallback string when the query is unavailable at build).

### `/projects/[slug]` detail (`app/projects/[slug]/page.tsx` + `components/projects/ProjectDetail.tsx`)

Renders the matching row via `getBySlug({ slug })`. If `null`, call Next's `notFound()`.

**Single-column, max-width 880px, centered, generous vertical rhythm.**

1. **Top-left hairline link**: `← All projects` to `/projects`.

2. **Header block** (above the fold):
    - Eyebrow line: `[kind] · [year] · [role]`, mono, tracked, `text-white/45`. `kind` is `"CASE STUDY"` when `approach` is non-empty, else `"PROJECT"`. `role` is omitted from the line when empty.
    - Title-line: `outcome ?? title`, rendered with `<ChromaticText amount={0.25}>` + `<FlowingGradientText>` matching the hero name climax. Size `clamp(48px, 7vh, 80px)`.
    - Subtitle: `title` if `outcome` is present (so both surface), `text-white/55`, weight 300.
    - `<ProjectMetadataStrip>` — same icon row used on the homepage chapter, plus the tech-stack chips inline below the icons.
    - Hairline divider.

3. **Hero image**: full column-width, 16:10 desktop / 4:3 `md` / 16:9 mobile, rounded `2xl`, hairline border. `next/image` `fill object-cover`. On mount, opacity tweens `0 → 1` over 600ms (single Framer Motion or CSS transition). Reduced-motion: instant. Skipped if `heroImageStorageId` is unset.

4. **Fact sheet** — three-up grid (`md:grid-cols-3`), stacked on mobile:

    ```
    PROBLEM        USERS         VALUE
    [problem]      [users]       [value]
    ```

    Each block: eyebrow label (mono, tracked, `text-white/45`), hairline beneath the label, body text (`text-base`, `text-white/80`, `leading-relaxed`, `whitespace-pre-wrap`).

5. **Narrative section** (conditional — renders only when `approach` is non-empty):

    Renders `<ProjectNarrative>` with two blocks:
    - **APPROACH** — eyebrow + hairline + `approach` paragraph(s) (`whitespace-pre-wrap`).
    - **OUTCOME** — eyebrow + hairline + optional hero metric block + `outcomeNarrative` paragraph(s).

    Hero metric (only when both `heroMetricValue` and `heroMetricLabel` are set):
    - `useCountUp(heroMetricValue, { threshold: 0.3 })` driven by `IntersectionObserver`.
    - Display: huge mono numeral, `clamp(56px, 7vw, 80px)`, weight 500, `tabular-nums`, white.
    - Label: mono caps, tracked `0.28em`, `text-white/55`.
    - 7px hairline beneath the metric block.

6. **Footer nav**:
    - Hairline divider.
    - Two-column on `md+`: `← Previous project` (left) and `Next project →` (right). Prev/next derived from `list()` ordered ASC; wraps at the boundaries (the first row's `prev` is the last row, and vice versa). Each label includes the prev/next row's title-line truncated at ~40 chars.
    - Centered below: `See all projects →` link to `/projects`.

**SEO via `generateMetadata`** (Next App Router):
- `title: "${outcome ?? title} — Siddharth Agrawal"`
- `description: problem.slice(0, 160)`
- `openGraph.images: [{ url: <storage URL>, width, height }]` when `heroImageStorageId` is set.
- `generateStaticParams` is **not** used at v1 — pages render dynamically against Convex, matching the existing pattern on the homepage. ISR / static export is a follow-up.

**404 handling:** `notFound()` is called when the slug query returns `null`. Next renders the default `not-found.tsx` (existing repo behaviour).

---

## Admin Tab Spec (`AdminEditorProjects.tsx`)

Fourth tab in `/admin/edit`, sibling to Copy / Contacts / Experience.

**Layout:**
- **Left rail** — list of every project, sorted by `order` ASC.
    - Each list item: 24×16 thumbnail (or numeral fallback) + `title` + `year` + `[FEATURED]` chip when `featured == true`.
    - `+ New project` button at the top of the rail. Creates a row with `slug = "untitled-<n>"`, `title = "Untitled"`, `order = max(order) + 1`, `featured = false`, `techStack = []`, `problem = ""`, `users = ""`, `value = ""`, `year = String(new Date().getFullYear())`.
    - `↑` / `↓` reorder buttons on each item, disabled at the list boundaries. Reorder mutation swaps `order` values pairwise.
    - `Delete` button per item — opens a confirm modal showing the project title before destructive call.

- **Right panel** — form for the selected row. Empty state when no row selected: `"Select a project on the left, or create a new one."`

**Form sections (right panel), top-to-bottom:**

1. **Identity**
    - `slug` text input. Auto-generated from `title` (kebab-case, ASCII only) but editable via an `Edit slug` toggle. Uniqueness validated client-side against the loaded list; server validates again on save.
    - `order` — read-only, controlled by the rail buttons.
    - `featured` checkbox.

2. **Header copy**
    - `title` (single-line input).
    - `outcome` (single-line input, optional). Helper text: `"Leads on cards when set. Leave blank for hobby projects."`
    - `year` (single-line input).
    - `role` (single-line input, optional).

3. **Links**
    - `liveUrl`, `githubUrl`, `figmaUrl` — all single-line inputs, optional, validated with `new URL()` on save. Inline error per field on failure.

4. **Tech stack**
    - Chip editor: existing chips with `×` to remove; one input + Enter to add a new chip. Trims, deduplicates, max 12 chips. Empty input + Enter is a no-op.
    - No drag-to-reorder at v1; addition order is preservation order.

5. **Hero image**
    - Upload widget that posts to a Convex `generateUploadUrl` mutation, then patches the row with the returned `Id<"_storage">`. Replaces existing image. Shows current image as a 240×160 preview.
    - `heroImageAlt` text input below the upload.
    - The Convex storage upload helper is a thin wrapper inside `convex/projects.ts` (`generateUploadUrl` action / mutation). If a reusable upload primitive already exists in the repo at plan-writing time, the spec defers to that; otherwise the plan adds the thin wrapper inside `convex/projects.ts` and a small `<HeroImageUploader>` client component co-located with the admin tab.

6. **Fact sheet**
    - `problem`, `users`, `value` — textareas, `rows={6}`. All required (validated on save).

7. **Case-study narrative (optional)**
    - Header note: `"Leave all four blank for hobby projects — the detail page hides this section automatically."`
    - `approach` textarea, `rows={8}`.
    - `outcomeNarrative` textarea, `rows={8}`.
    - `heroMetricValue` (e.g. `"+38%"`) and `heroMetricLabel` (e.g. `"Drop-off reduction"`) — paired single-line inputs, both required to render the metric block.

**Save semantics:**
- `isDirty` derived by deep-equal of the draft against the loaded row. `techStack` and any future array/object fields are compared by JSON-stringification (matches existing `AdminEditorRoles` pattern).
- Pure-functional handlers — no in-place mutation of draft arrays.
- URL validation runs on save; surfaces inline errors per field; blocks the save call if any invalid.
- Save dispatches `upsert` with the full payload. On success, the rail refreshes via Convex reactivity.

**Type sharing:** `Project` type = `Doc<"projects">` exported from `convex/projects.ts`, imported by both `AdminEditorProjects` and the public components. Matches the existing pattern used for `experienceRoles`.

---

## Seed Strategy

`convex/seed.ts` extended to insert 1–2 minimal placeholder rows when the `projects` table is empty:

- Row 1: `slug: "replace-via-admin"`, `title: "Replace via /admin/edit"`, `order: 0`, `featured: true`, `year: "2026"`, `techStack: []`, `problem: "..."`, `users: "..."`, `value: "..."`. All narrative fields blank.

The seed only writes when the table is empty (existing `seed.ts` idempotency pattern). The user replaces these via the admin tab once the surfaces are deployed.

`lib/defaults/projects.ts` exports `PROJECT_DEFAULTS` for completeness/symmetry with `lib/defaults/experienceRoles.ts`, but unlike Experience, the public components do **not** fall back to defaults — they show the empty state when Convex returns nothing. Defaults are only used by the seed.

---

## Sign-off Workflow

Per `CLAUDE.md`, a preview route at `app/preview/projects/page.tsx` renders 2–3 visual variants of the homepage Projects chapter side-by-side using throwaway dummy data. The variants explore:

- **Variant A — Sticky-numeral cinematic stack** (the design above).
- **Variant B — Cinematic stack without sticky numerals** (numerals scroll with the beat). Tests whether the sticky behaviour is the right cinematic weight or feels too much like Experience.
- **Variant C — Asymmetric beats** (alternating left/right media columns per beat). Tests whether perfect mirroring across beats feels boring vs. surprising.

User picks at the preview hard-gate (T11-equivalent in the plan). Winner graduates to `components/projects/ProjectsSection.tsx` and the preview file is deleted in the same commit. `/projects` and `/projects/[slug]` are not previewed — they're content surfaces with no real design alternatives to A/B.

---

## Motion Budget

| Surface | Motion verb | Implementation |
|---|---|---|
| Homepage beat | Per-beat media scale + lift | One GSAP timeline + ScrollTrigger per `<ProjectScrollBeat>`. No global pin. |
| Homepage beat | Chromatic + flowing-gradient title | Reuses `ChromaticText` and `FlowingGradientText` (no new primitives). |
| Homepage chapter | Sticky chapter numerals | CSS `position: sticky` `top-24` on `md+` (same as Experience). |
| `/projects` row | Hover lift + hairline brighten + thumb scale | CSS transitions, 200ms ease-out. No JS. |
| `/projects` row | Subtle chromatic on hover | `<ChromaticText amount={0.15}>` on title-line, hover-only class. |
| `/projects/[slug]` hero image | Opacity fade-in on mount | CSS transition or Framer Motion, 600ms. |
| `/projects/[slug]` hero metric | Count-up | `useCountUp` (existing hook), `IntersectionObserver` threshold 0.3. |
| All surfaces | Reduced-motion | Hooks/CSS respect `prefers-reduced-motion`; scale/lift/fade tweens become instant. |

No new GSAP timelines on top of the Hero pin. No new motion primitives. The chapter's motion verb is "media-scale on scroll" — distinct from the hero's "chromatic split" and Experience's "counter-up + sticky numeral".

---

## Editable-by-Default Compliance

| String | Lives where | Editor surface |
|---|---|---|
| Homepage eyebrows, headline, standfirst, index link | `siteContent` slots `projects.*` | Existing Copy tab in `/admin/edit` |
| `/projects` eyebrow, headline, standfirst, meta description | `siteContent` slots `projects.*` | Existing Copy tab |
| All per-project content | `projects` table rows | New Projects tab in `/admin/edit` |
| Fact-sheet section labels (`PROBLEM`, `USERS`, `VALUE`) | Static literals in `ProjectDetail.tsx` | Not editable — chrome, not copy |
| Narrative section labels (`APPROACH`, `OUTCOME`) | Static literals in `ProjectNarrative.tsx` | Not editable — chrome |

Mirrors Experience: chapter chrome is static, content is editable.

---

## Out of Scope (deferred)

- **Tiptap rich text** for `problem` / `approach` / `outcomeNarrative` — v1 is plain string with `whitespace-pre-wrap`. Promotion is a follow-up plan if pull-quotes / inline images / embeds are needed.
- **Hero video** support — v1 is image only. Schema leaves a clean upgrade path (`heroVideoMuxPlaybackId` slot).
- **Filters / search** on `/projects` — none at v1. Order is admin-controlled. Filtering by `kind` (project vs case study) or year is a single `useState` follow-up.
- **Multiple screenshots / image galleries** per project — single hero image only.
- **Tags / categories taxonomy** — `techStack` is the only chip dimension v1 ships.
- **Drag-to-reorder** in admin — buttons only at v1.
- **`generateStaticParams`** / ISR for detail pages — dynamic against Convex at v1.
- **Custom OG image generation** via `next/og` — uses the hero image directly.
- **Outbound link analytics** — not in scope.
- **Headline metric editability** on Experience (`MetricStrip`) — separate brainstorm/plan cycle.
- **Contact + Calendly inline booking** — separate brainstorm/plan cycle, kicks off after Projects ships.

---

## Open Questions

None at sign-off. All structural choices answered:

- Three surfaces (homepage / index / detail) → yes
- One Convex table for projects and case studies → yes
- Outcome-led title-line via `outcome ?? title` → yes
- Cinema dial: homepage full, index restrained, detail almost static → yes
- Seed strategy: 1–2 placeholders, user fills via admin → yes
