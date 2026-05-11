# Projects Chapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Projects chapter — homepage cinematic stack, `/projects` editorial-table index, and `/projects/[slug]` detail pages — backed by one Convex `projects` collection that's fully editable through a new "Projects" tab in `/admin/edit`.

**Architecture:** New `components/projects/` directory with seven focused files (`ProjectsSection`, `ProjectScrollBeat`, `ProjectsIndex`, `ProjectIndexRow`, `ProjectDetail`, `ProjectMetadataStrip`, `ProjectNarrative`) plus two pure helpers in `lib/projects/` (`slugify`, `neighbors`). Convex `projects` table with three indexes (`by_slug`, `by_order`, `by_featured_order`) backs all three surfaces; admin-only `upsert` / `remove` / `generateUploadUrl` mutations are guarded by `requireAdmin`. Sign-off lands through a side-by-side A/B/C preview at `app/preview/projects/page.tsx` per CLAUDE.md, then the winner graduates and `ProjectGridPlaceholder` is deleted in a single commit.

**Tech Stack:** Next.js 16 App Router (Turbopack), Convex, React 19, Tailwind, Vitest + jsdom + @testing-library/react, GSAP `ScrollTrigger` (per-beat, no global pin), CSS `position: sticky`, `next/image` against Convex `_storage` URLs, existing `useReducedMotion` and `useCountUp` hooks.

**Reference spec:** `docs/superpowers/specs/2026-05-11-projects-chapter-design.md` (read it before starting Task 1).

**Standing constraints (from `CLAUDE.md` + user memory):**
- Every new user-facing string lives in `siteContent` or a typed Convex collection — never a raw literal except as a fallback for first paint.
- Production components are off-limits until the user picks a variant at the preview hard-gate (Task 13).
- Plans run straight through; do not stop between tasks except at the preview hard-gate.
- Commit `convex/_generated/` alongside every schema/module change — Vercel does not run `convex dev`.
- GitHub first; Vercel auto-deploys from `main`. Never run `vercel deploy` directly.

---

## Task 1: Convex schema — add `projects` table with three indexes

**Files:**
- Modify: `convex/schema.ts`
- Auto-regenerate: `convex/_generated/api.d.ts`, `convex/_generated/dataModel.d.ts`, `convex/_generated/server.d.ts` (commit them)

- [ ] **Step 1: Append the `projects` table to `convex/schema.ts`**

Add this block inside `defineSchema({ … })`, after the existing `experienceRoles: defineTable({ … })` entry (immediately before the closing `});` of `defineSchema`):

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

    // case-study narrative (optional)
    approach: v.optional(v.string()),
    outcomeNarrative: v.optional(v.string()),
    heroMetricValue: v.optional(v.string()),
    heroMetricLabel: v.optional(v.string()),

    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"])
    .index("by_featured_order", ["featured", "order"]),
```

- [ ] **Step 2: Regenerate Convex types**

Run: `npx convex codegen`
Expected: re-emits `convex/_generated/*.d.ts` with `Doc<"projects">` and `Id<"projects">` reachable.

- [ ] **Step 3: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/_generated
git commit -m "feat(convex): add projects table with by_slug/by_order/by_featured_order indexes"
```

---

## Task 2: `convex/projects.ts` — list / listFeatured / getBySlug / upsert / remove / reorder / generateUploadUrl

**Files:**
- Create: `convex/projects.ts`
- Auto-regenerate: `convex/_generated/api.d.ts` (commit)

- [ ] **Step 1: Create `convex/projects.ts`**

```ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

/** Public list, ordered ascending by `order`. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("projects")
      .withIndex("by_order")
      .order("asc")
      .collect();
  },
});

/** Public featured list, ordered ascending by `order`. */
export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("projects")
      .withIndex("by_featured_order", (q) => q.eq("featured", true))
      .order("asc")
      .collect();
  },
});

/** Public single-row read by slug. Returns null when not found. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

/**
 * Admin-only upsert. If `id` is provided, patches the existing row;
 * otherwise inserts a new row. Slug uniqueness is validated against
 * any other row that already owns the slug.
 */
export const upsert = mutation({
  args: {
    id: v.optional(v.id("projects")),
    slug: v.string(),
    order: v.number(),
    featured: v.boolean(),
    title: v.string(),
    outcome: v.optional(v.string()),
    year: v.string(),
    role: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    figmaUrl: v.optional(v.string()),
    techStack: v.array(v.string()),
    heroImageStorageId: v.optional(v.id("_storage")),
    heroImageAlt: v.optional(v.string()),
    problem: v.string(),
    users: v.string(),
    value: v.string(),
    approach: v.optional(v.string()),
    outcomeNarrative: v.optional(v.string()),
    heroMetricValue: v.optional(v.string()),
    heroMetricLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Slug uniqueness: reject if a different row already owns it.
    const slugOwner = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (slugOwner && slugOwner._id !== args.id) {
      throw new Error(`Slug "${args.slug}" already in use`);
    }

    const now = Date.now();
    const { id, ...rest } = args;
    if (id) {
      await ctx.db.patch(id, { ...rest, updatedAt: now });
      return id;
    }
    return ctx.db.insert("projects", { ...rest, updatedAt: now });
  },
});

/** Admin-only deletion. */
export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

/**
 * Admin-only reorder. Patches each row in `orderedIds` with its new 0-based
 * `order` index in a single mutation. Mirrors experienceRoles.reorder.
 */
export const reorder = mutation({
  args: { orderedIds: v.array(v.id("projects")) },
  handler: async (ctx, { orderedIds }) => {
    await requireAdmin(ctx);
    const now = Date.now();
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i, updatedAt: now });
    }
  },
});

/** Admin-only: generate a one-shot URL for uploading a hero image. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Public: resolve a storage id to a public URL. */
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
```

- [ ] **Step 2: Regenerate Convex types**

Run: `npx convex codegen`
Expected: `convex/_generated/api.d.ts` now exposes `api.projects.list`, `listFeatured`, `getBySlug`, `upsert`, `remove`, `reorder`, `generateUploadUrl`, `getStorageUrl`.

- [ ] **Step 3: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add convex/projects.ts convex/_generated
git commit -m "feat(convex): projects CRUD + storage upload helpers"
```

---

## Task 3: `lib/defaults/projects.ts` + extend `convex/seed.ts` with `seedProjects`

**Files:**
- Create: `lib/defaults/projects.ts`
- Modify: `convex/seed.ts`

- [ ] **Step 1: Create `lib/defaults/projects.ts`**

```ts
/**
 * Project defaults — used only by `convex/seed.ts`'s `seedProjects` to write
 * 1–2 placeholder rows into a fresh DB so /projects and /projects/[slug]
 * don't 404 at launch. Unlike Experience, public components do NOT fall back
 * to these — they show the empty state when Convex returns nothing.
 *
 * Lives at top-level `lib/` so both Convex's TS compiler and Next.js can
 * import it.
 */

export type ProjectDefault = {
  slug: string;
  order: number;
  featured: boolean;
  title: string;
  outcome?: string;
  year: string;
  role?: string;
  techStack: string[];
  problem: string;
  users: string;
  value: string;
};

export const PROJECT_DEFAULTS: ProjectDefault[] = [
  {
    slug: "replace-via-admin",
    order: 0,
    featured: true,
    title: "Replace via /admin/edit",
    year: "2026",
    role: "Product Manager",
    techStack: [],
    problem:
      "Placeholder row. Edit through /admin/edit → Projects to replace with a real entry.",
    users: "Placeholder.",
    value: "Placeholder.",
  },
];
```

- [ ] **Step 2: Append `seedProjects` to `convex/seed.ts`**

Add this at the end of `convex/seed.ts`, after `seedExperienceRoles`:

```ts
import { PROJECT_DEFAULTS } from "../lib/defaults/projects";

/**
 * Seed 1–2 placeholder project rows. Idempotent on `slug` — re-running
 * will not double-insert. Order is assigned from the array index.
 */
export const seedProjects = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    for (let i = 0; i < PROJECT_DEFAULTS.length; i++) {
      const p = PROJECT_DEFAULTS[i];
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_slug", (q) => q.eq("slug", p.slug))
        .unique();
      if (existing) continue;
      await ctx.db.insert("projects", {
        slug: p.slug,
        order: i,
        featured: p.featured,
        title: p.title,
        outcome: p.outcome,
        year: p.year,
        role: p.role,
        techStack: p.techStack,
        problem: p.problem,
        users: p.users,
        value: p.value,
        updatedAt: Date.now(),
      });
      inserted++;
    }
    return { inserted };
  },
});
```

The existing `import { internalMutation } from "./_generated/server";` and `import { v } from "convex/values";` at the top of `seed.ts` already cover the new export.

- [ ] **Step 3: Regenerate Convex types**

Run: `npx convex codegen`
Expected: `internal.seed.seedProjects` reachable.

- [ ] **Step 4: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/defaults/projects.ts convex/seed.ts convex/_generated
git commit -m "feat(seed): seedProjects with 1 placeholder row"
```

---

## Task 4: `lib/projects/slugify.ts` — TDD

**Files:**
- Create: `lib/projects/__tests__/slugify.test.ts`
- Create: `lib/projects/slugify.ts`

- [ ] **Step 1: Write the failing test**

`lib/projects/__tests__/slugify.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { slugify } from "../slugify";

describe("slugify", () => {
  it("lowercases ASCII words and joins them with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips non-ASCII characters", () => {
    expect(slugify("Café & Crème")).toBe("caf-crme");
  });

  it("collapses repeated whitespace and punctuation into one hyphen", () => {
    expect(slugify("AI   for  Sales!!!")).toBe("ai-for-sales");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  — Project — ")).toBe("project");
  });

  it("returns 'untitled' for an empty input", () => {
    expect(slugify("")).toBe("untitled");
    expect(slugify("   ")).toBe("untitled");
  });

  it("preserves digits", () => {
    expect(slugify("Q3 2024 Launch")).toBe("q3-2024-launch");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/projects/__tests__/slugify.test.ts`
Expected: FAIL with `Cannot find module '../slugify'`.

- [ ] **Step 3: Write the minimal implementation**

`lib/projects/slugify.ts`:

```ts
/**
 * Convert a human title into an admin-editable slug.
 *
 * Rules:
 *   • Lowercase, ASCII-only.
 *   • Non-alphanumeric runs collapse into a single hyphen.
 *   • Leading/trailing hyphens are trimmed.
 *   • Empty input (or input that yields an empty slug) returns "untitled"
 *     so the admin form always has a valid initial value.
 */
export function slugify(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^\x00-\x7f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.length > 0 ? cleaned : "untitled";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/projects/__tests__/slugify.test.ts`
Expected: PASS, 6/6.

- [ ] **Step 5: Commit**

```bash
git add lib/projects/slugify.ts lib/projects/__tests__/slugify.test.ts
git commit -m "feat(projects): slugify helper + tests"
```

---

## Task 5: `lib/projects/neighbors.ts` — TDD

**Files:**
- Create: `lib/projects/__tests__/neighbors.test.ts`
- Create: `lib/projects/neighbors.ts`

- [ ] **Step 1: Write the failing test**

`lib/projects/__tests__/neighbors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { neighbors } from "../neighbors";

type Row = { slug: string; title: string };

const ROWS: Row[] = [
  { slug: "a", title: "A" },
  { slug: "b", title: "B" },
  { slug: "c", title: "C" },
];

describe("neighbors", () => {
  it("returns the previous and next rows wrapping at the boundaries", () => {
    expect(neighbors(ROWS, "a")).toEqual({ prev: ROWS[2], next: ROWS[1] });
    expect(neighbors(ROWS, "b")).toEqual({ prev: ROWS[0], next: ROWS[2] });
    expect(neighbors(ROWS, "c")).toEqual({ prev: ROWS[1], next: ROWS[0] });
  });

  it("returns prev=next=null when the slug is not in the list", () => {
    expect(neighbors(ROWS, "missing")).toEqual({ prev: null, next: null });
  });

  it("returns prev=next=null on a single-row list (no wrap-to-self)", () => {
    expect(neighbors([ROWS[0]], "a")).toEqual({ prev: null, next: null });
  });

  it("returns prev=next=null on an empty list", () => {
    expect(neighbors<Row>([], "a")).toEqual({ prev: null, next: null });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/projects/__tests__/neighbors.test.ts`
Expected: FAIL with `Cannot find module '../neighbors'`.

- [ ] **Step 3: Write the minimal implementation**

`lib/projects/neighbors.ts`:

```ts
/**
 * Given an ordered list and a slug, return the previous and next rows
 * with wrap-around at both ends. Used by `/projects/[slug]` footer nav.
 *
 * Returns `{ prev: null, next: null }` when:
 *   • the slug is not found,
 *   • the list is empty, or
 *   • the list has exactly one row (wrap-to-self would render
 *     "← <current title>" / "<current title> →", which reads as a bug).
 */
export function neighbors<T extends { slug: string }>(
  rows: T[],
  slug: string,
): { prev: T | null; next: T | null } {
  if (rows.length < 2) return { prev: null, next: null };
  const i = rows.findIndex((r) => r.slug === slug);
  if (i === -1) return { prev: null, next: null };
  const prev = rows[(i - 1 + rows.length) % rows.length];
  const next = rows[(i + 1) % rows.length];
  return { prev, next };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/projects/__tests__/neighbors.test.ts`
Expected: PASS, 4/4.

- [ ] **Step 5: Commit**

```bash
git add lib/projects/neighbors.ts lib/projects/__tests__/neighbors.test.ts
git commit -m "feat(projects): neighbors helper for prev/next nav + tests"
```

---

## Task 6: `ProjectMetadataStrip` component

**Files:**
- Create: `components/projects/ProjectMetadataStrip.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

/**
 * ProjectMetadataStrip — the small horizontal row of link icons that
 * appears beneath the title on both the homepage Projects chapter beats
 * and on the /projects/[slug] detail header. Each icon renders only when
 * the corresponding URL is set. Hairline above the strip.
 */

import type { Doc } from "@/convex/_generated/dataModel";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Props = {
  project: Pick<Doc<"projects">, "liveUrl" | "githubUrl" | "figmaUrl">;
  /** Optional inline tech-stack chip row rendered after the icons. */
  techStack?: string[];
};

export function ProjectMetadataStrip({ project, techStack }: Props) {
  const links: { label: string; url: string }[] = [];
  if (project.liveUrl) links.push({ label: "LIVE", url: project.liveUrl });
  if (project.githubUrl) links.push({ label: "CODE", url: project.githubUrl });
  if (project.figmaUrl) links.push({ label: "FIGMA", url: project.figmaUrl });

  if (links.length === 0 && (!techStack || techStack.length === 0)) return null;

  return (
    <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${HAIRLINE_FAINT}` }}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10.5px] text-white/70 transition hover:text-white"
            style={{ ...MONO, letterSpacing: "0.28em" }}
          >
            {l.label} &nearr;
          </a>
        ))}
      </div>
      {techStack && techStack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {techStack.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-[3px] text-[10.5px] text-white/70"
              style={{
                ...MONO,
                letterSpacing: "0.06em",
                border: `1px solid ${HAIRLINE_FAINT}`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/projects/ProjectMetadataStrip.tsx
git commit -m "feat(projects): ProjectMetadataStrip with link icons + tech chips"
```

---

## Task 7: `ProjectNarrative` component (uses `useCountUp`)

**Files:**
- Create: `components/projects/ProjectNarrative.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

/**
 * ProjectNarrative — Approach + Outcome blocks rendered on the
 * /projects/[slug] detail page when `approach` is set. Hero metric
 * counts up via the existing useCountUp hook (IntersectionObserver,
 * threshold 0.3, respects useReducedMotion).
 *
 * Section labels (APPROACH, OUTCOME) are static chrome, not editable.
 */

import type { Doc } from "@/convex/_generated/dataModel";
import { useCountUp } from "@/lib/motion/useCountUp";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE = "rgba(255,255,255,0.14)";

type Props = {
  project: Pick<
    Doc<"projects">,
    "approach" | "outcomeNarrative" | "heroMetricValue" | "heroMetricLabel"
  >;
};

export function ProjectNarrative({ project }: Props) {
  if (!project.approach) return null;

  return (
    <div className="mt-[clamp(48px,8vh,96px)] flex flex-col gap-[clamp(40px,7vh,80px)]">
      <NarrativeBlock label="APPROACH" body={project.approach} />
      {(project.outcomeNarrative ||
        (project.heroMetricValue && project.heroMetricLabel)) && (
        <div className="flex flex-col gap-6">
          <SectionLabel>OUTCOME</SectionLabel>
          {project.heroMetricValue && project.heroMetricLabel && (
            <HeroMetric
              value={project.heroMetricValue}
              label={project.heroMetricLabel}
            />
          )}
          {project.outcomeNarrative && (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-white/80">
              {project.outcomeNarrative}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NarrativeBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>{label}</SectionLabel>
      <p className="whitespace-pre-wrap text-base leading-relaxed text-white/80">
        {body}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[10px] text-white/45"
        style={{
          ...MONO,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </div>
      <div aria-hidden className="mt-2 h-px w-full" style={{ background: HAIRLINE }} />
    </div>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  const { ref, display } = useCountUp<HTMLDivElement>(value, { threshold: 0.3 });
  return (
    <div className="flex flex-col gap-2 pb-6" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
      <div
        ref={ref}
        className="text-[clamp(56px,7vw,80px)] leading-none tracking-[-2px] tabular-nums text-white"
        style={{ ...MONO, fontWeight: 500 }}
      >
        {display}
      </div>
      <div
        className="text-[11px] text-white/55"
        style={{
          ...MONO,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/projects/ProjectNarrative.tsx
git commit -m "feat(projects): ProjectNarrative with count-up hero metric"
```

---

## Task 8: `ProjectScrollBeat` component (per-beat GSAP timeline)

**Files:**
- Create: `components/projects/ProjectScrollBeat.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

/**
 * ProjectScrollBeat — one featured project's full-bleed scroll beat on
 * the homepage Projects chapter. Two-column on md+, stacked on mobile.
 *
 * Motion verb: image scales 1.02 → 1.0 and lifts 12px over the scroll-
 * through. Owns its own GSAP timeline + ScrollTrigger scrubbed against
 * the section element — deliberately separate from HeroPinController to
 * avoid the desync hazard called out in CLAUDE.md.
 *
 * Reduced-motion: static (no scale tween, no lift).
 *
 * `mediaSide` controls which column the hero image renders on. Variant
 * C in the preview alternates it per beat; Variant A always uses "right".
 */

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { ChapterNumeral } from "@/components/experience/ChapterNumeral";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { ProjectMetadataStrip } from "./ProjectMetadataStrip";

type Props = {
  project: Doc<"projects">;
  index: number;
  mediaSide?: "left" | "right";
  stickyNumeral?: boolean;
};

export function ProjectScrollBeat({
  project,
  index,
  mediaSide = "right",
  stickyNumeral = true,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const titleLine = project.outcome ?? project.title;
  const showProjectEyebrow = Boolean(project.outcome);
  const ctaLabel = project.approach ? "Read case study \u2192" : "View project \u2192";

  const imageUrl = useQuery(
    api.projects.getStorageUrl,
    project.heroImageStorageId ? { storageId: project.heroImageStorageId } : "skip",
  );

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const tween = gsap.fromTo(
        media,
        { scale: 1.02, y: 12 },
        {
          scale: 1.0,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top 80%",
            end: "bottom 30%",
            scrub: 0.5,
          },
        },
      );

      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced]);

  const copy = (
    <div className="flex max-w-[640px] flex-col gap-6">
      <div className="flex items-start gap-6">
        <ChapterNumeral index={index} sticky={stickyNumeral} />
      </div>

      {showProjectEyebrow && (
        <div
          className="text-[10.5px] text-white/55"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          {project.title}
        </div>
      )}

      <h3
        className="text-[clamp(40px,6.5vh,72px)] leading-[1.05] tracking-[-2px] text-white"
        style={{
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 500,
        }}
      >
        <ChromaticText amount={0.35}>
          <FlowingGradientText>{titleLine}</FlowingGradientText>
        </ChromaticText>
      </h3>

      <p className="line-clamp-2 max-w-[560px] text-base leading-[1.55] font-light text-white/75">
        {project.problem}
      </p>

      {project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.slice(0, 5).map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-[3px] text-[10.5px] text-white/70"
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                letterSpacing: "0.06em",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <ProjectMetadataStrip project={project} />

      <a
        href={`/projects/${project.slug}`}
        className="mt-2 inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-medium text-black"
      >
        {ctaLabel}
      </a>
    </div>
  );

  const media = (
    <div
      ref={mediaRef}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl md:aspect-[4/3] lg:aspect-[16/10]"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        background: "rgba(255,255,255,0.02)",
        willChange: reduced ? undefined : "transform",
      }}
    >
      {imageUrl ? (
        // Convex storage URLs are opaque externally — use plain <img>; next/image
        // would require remotePatterns config and gives no measurable win here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={project.heroImageAlt ?? project.title}
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-[clamp(48px,6vw,72px)] text-white/[0.08]"
          style={{
            fontFamily:
              'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
            fontStyle: "italic",
            fontWeight: 300,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
      )}
    </div>
  );

  return (
    <section
      ref={rootRef}
      className="grid grid-cols-1 items-start gap-10 md:grid-cols-12 md:gap-12"
    >
      {mediaSide === "left" ? (
        <>
          <div className="md:col-span-6">{media}</div>
          <div className="md:col-span-6">{copy}</div>
        </>
      ) : (
        <>
          <div className="md:col-span-6">{copy}</div>
          <div className="md:col-span-6">{media}</div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors. (`gsap` and `gsap/ScrollTrigger` are already in dependencies — used by `HeroPinController`.)

- [ ] **Step 3: Commit**

```bash
git add components/projects/ProjectScrollBeat.tsx
git commit -m "feat(projects): ProjectScrollBeat with per-beat ScrollTrigger"
```

---

## Task 9: `ProjectsSection` (homepage chapter)

**Files:**
- Create: `components/projects/ProjectsSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

/**
 * ProjectsSection — homepage cinematic chapter.
 *
 * Slots into app/page.tsx in place of <ProjectGridPlaceholder/>. Reads
 * api.projects.listFeatured for the beats and api.projects.list for the
 * "See all N projects →" link count.
 *
 * Chapter chrome (eyebrows, headline, standfirst, link label) is editable
 * via EditableText slots under page="home", slot="projects.*".
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableText } from "@/components/editable/EditableText";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { ProjectScrollBeat } from "./ProjectScrollBeat";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE = "rgba(255,255,255,0.14)";

type Props = {
  /** Variant C alternates media side per beat; default is always-right. */
  alternateMediaSide?: boolean;
  /** When false, chapter numerals scroll with the beat (Variant B). */
  stickyNumeral?: boolean;
};

export function ProjectsSection({
  alternateMediaSide = false,
  stickyNumeral = true,
}: Props) {
  const featured = useQuery(api.projects.listFeatured);
  const all = useQuery(api.projects.list);

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
              slot="projects.eyebrowLeft"
              fallback="PROJECTS \u00B7 2022 \u2014 2026"
              as="span"
              singleLine
            />
            <EditableText
              page="home"
              slot="projects.eyebrowRight"
              fallback=""
              as="span"
              singleLine
            />
          </div>
          <div aria-hidden className="mt-4 h-px w-full" style={{ background: HAIRLINE }} />
          <h2
            className="mt-8 text-[clamp(40px,6vw,64px)] leading-[1.05] tracking-[-2px] text-white"
            style={{
              fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            <ChromaticText amount={0.35}>
              <FlowingGradientText>
                <EditableText
                  page="home"
                  slot="projects.headline"
                  fallback="Selected work, in detail."
                  as="span"
                  singleLine
                />
              </FlowingGradientText>
            </ChromaticText>
          </h2>
          <p className="mt-4 max-w-[560px] text-[17px] leading-[1.5] font-light text-white/65">
            <EditableText
              page="home"
              slot="projects.standfirst"
              fallback="A small set of products I led, designed, or built \u2014 each with the problem, the people, and the result."
              as="span"
            />
          </p>
        </header>

        <div className="mt-[clamp(64px,10vh,120px)] flex flex-col gap-[clamp(96px,14vh,160px)]">
          {featured === undefined ? null : featured.length === 0 ? (
            <p className="text-[14px] text-white/55">Featured projects coming soon.</p>
          ) : (
            featured.map((p, i) => (
              <ProjectScrollBeat
                key={p._id}
                project={p}
                index={i}
                stickyNumeral={stickyNumeral}
                mediaSide={
                  alternateMediaSide && i % 2 === 1 ? "left" : "right"
                }
              />
            ))
          )}
        </div>

        <div className="mt-[clamp(64px,10vh,120px)]">
          <div aria-hidden className="h-px w-full" style={{ background: HAIRLINE }} />
          <div className="mt-6 flex justify-end">
            <a
              href="/projects"
              className="text-[12px] text-white/70 transition hover:text-white"
              style={{ ...MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
            >
              <EditableText
                page="home"
                slot="projects.indexLinkLabel"
                fallback="See all {count} projects \u2192"
                as="span"
                singleLine
                transform={(s) =>
                  s.replace("{count}", all ? String(all.length) : "\u2026")
                }
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

> **Implementer note:** `EditableText`'s `transform` prop is used here for `{count}` substitution. If `EditableText` does not currently accept a `transform` prop, do this instead: render the resolved string via a small wrapper that reads the slot through `useSiteContent` (the existing hook backing `EditableText`) and substitutes `{count}` before render. Check `components/editable/EditableText.tsx` for the prop surface before editing — adapt to the existing API rather than inventing one.

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/projects/ProjectsSection.tsx
git commit -m "feat(projects): ProjectsSection homepage chapter"
```

---

## Task 10: `ProjectIndexRow` component

**Files:**
- Create: `components/projects/ProjectIndexRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

/**
 * ProjectIndexRow — one editorial row on /projects. Hover-only motion:
 * row lifts 1px, hairline brightens, thumbnail scales 1.02, and the
 * title-line gets a faint chromatic split. Reduced-motion drops the lift
 * and scale but keeps the hairline brighten.
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { ChromaticText } from "@/components/home/ChromaticText";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SERIF_ITALIC: React.CSSProperties = {
  fontFamily:
    'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  fontStyle: "italic",
  fontWeight: 300,
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Props = {
  project: Doc<"projects">;
  index: number;
};

export function ProjectIndexRow({ project, index }: Props) {
  const titleLine = project.outcome ?? project.title;
  const projectName = project.outcome ? project.title : undefined;
  const metaParts = [project.role, projectName]
    .filter((s): s is string => Boolean(s && s.trim().length > 0))
    .map((s) => s.toUpperCase());

  const imageUrl = useQuery(
    api.projects.getStorageUrl,
    project.heroImageStorageId ? { storageId: project.heroImageStorageId } : "skip",
  );

  return (
    <a
      href={`/projects/${project.slug}`}
      className="group block py-8 transition motion-safe:hover:-translate-y-px"
      style={{ borderBottom: `1px solid ${HAIRLINE_FAINT}` }}
    >
      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[120px_64px_1fr_auto_auto] md:gap-8">
        {/* Thumbnail */}
        <div
          className="relative aspect-[120/80] w-full overflow-hidden rounded-md md:w-[120px]"
          style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={project.heroImageAlt ?? project.title}
              className="absolute inset-0 size-full object-cover transition-transform duration-200 motion-safe:group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-[clamp(28px,4vw,36px)] text-white/15"
              style={SERIF_ITALIC}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
          )}
        </div>

        {/* Year */}
        <div
          className="text-[11px] tabular-nums text-white/55"
          style={{ ...MONO, letterSpacing: "0.18em" }}
        >
          {project.year}
        </div>

        {/* Title + meta */}
        <div className="flex flex-col gap-1.5">
          <div
            className="text-[clamp(20px,2.4vw,28px)] leading-tight text-white"
            style={{
              fontFamily:
                "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
            }}
          >
            <span className="hidden group-hover:inline">
              <ChromaticText amount={0.15}>{titleLine}</ChromaticText>
            </span>
            <span className="group-hover:hidden">{titleLine}</span>
          </div>
          {metaParts.length > 0 && (
            <div
              className="text-[10.5px] text-white/55"
              style={{ ...MONO, letterSpacing: "0.24em" }}
            >
              {metaParts.join(" \u00B7 ")}
            </div>
          )}
        </div>

        {/* Tech chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {project.techStack.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full px-2 py-[2px] text-[10.5px] text-white/70"
              style={{
                ...MONO,
                letterSpacing: "0.06em",
                border: `1px solid ${HAIRLINE_FAINT}`,
              }}
            >
              {t}
            </span>
          ))}
          {project.techStack.length > 3 && (
            <span
              className="rounded-full px-2 py-[2px] text-[10.5px] text-white/55"
              style={{
                ...MONO,
                letterSpacing: "0.06em",
                border: `1px solid ${HAIRLINE_FAINT}`,
              }}
            >
              +{project.techStack.length - 3}
            </span>
          )}
        </div>

        {/* Arrow */}
        <div className="text-[18px] text-white/55 transition group-hover:text-white">
          &rarr;
        </div>
      </div>
    </a>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/projects/ProjectIndexRow.tsx
git commit -m "feat(projects): ProjectIndexRow editorial-table row"
```

---

## Task 11: `ProjectsIndex` + `/projects` route + new EditableText slots

**Files:**
- Create: `components/projects/ProjectsIndex.tsx`
- Create: `app/projects/page.tsx`

- [ ] **Step 1: Create `ProjectsIndex`**

```tsx
"use client";

/**
 * ProjectsIndex — body of /projects. Reads api.projects.list and renders
 * a single-column editorial table. No filter / search at v1.
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditableText } from "@/components/editable/EditableText";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { ProjectIndexRow } from "./ProjectIndexRow";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE = "rgba(255,255,255,0.14)";

export function ProjectsIndex() {
  const rows = useQuery(api.projects.list);

  return (
    <main className="relative min-h-[100dvh] bg-[#05060a] py-[clamp(64px,10vh,120px)] text-white">
      <div className="mx-auto w-full max-w-[1100px] px-6 sm:px-6 lg:px-10">
        <a
          href="/"
          className="text-[11px] text-white/55 transition hover:text-white"
          style={{ ...MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
        >
          &larr; Back to home
        </a>

        <header className="mt-10">
          <div
            className="text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            <EditableText
              page="home"
              slot="projects.indexEyebrow"
              fallback="PROJECTS"
              as="span"
              singleLine
            />
          </div>
          <div aria-hidden className="mt-4 h-px w-full" style={{ background: HAIRLINE }} />
          <h1
            className="mt-8 text-[clamp(40px,5.5vw,64px)] leading-[1.05] tracking-[-1px] text-white"
            style={{
              fontFamily:
                'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            <ChromaticText amount={0.2}>
              <FlowingGradientText>
                <EditableText
                  page="home"
                  slot="projects.indexHeadline"
                  fallback="Everything I\u2019ve shipped."
                  as="span"
                  singleLine
                />
              </FlowingGradientText>
            </ChromaticText>
          </h1>
          <p
            className="mt-4 text-[12px] text-white/55"
            style={{ ...MONO, letterSpacing: "0.18em" }}
          >
            <EditableText
              page="home"
              slot="projects.indexStandfirst"
              fallback="{count} projects, 2018 \u2192 now."
              as="span"
              singleLine
              transform={(s) =>
                s.replace("{count}", rows ? String(rows.length) : "\u2026")
              }
            />
          </p>
        </header>

        <div className="mt-[clamp(48px,8vh,96px)]">
          {rows === undefined ? null : rows.length === 0 ? (
            <p className="text-[14px] text-white/55">No projects yet.</p>
          ) : (
            <div className="flex flex-col">
              {rows.map((p, i) => (
                <ProjectIndexRow key={p._id} project={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create `app/projects/page.tsx`**

```tsx
import type { Metadata } from "next";
import { ProjectsIndex } from "@/components/projects/ProjectsIndex";

export const metadata: Metadata = {
  title: "Projects \u2014 Siddharth Agrawal",
  description: "Projects and case studies by Siddharth Agrawal.",
};

export default function ProjectsPage() {
  return <ProjectsIndex />;
}
```

- [ ] **Step 3: Verify the route renders locally**

Run: `npx tsc --noEmit`
Expected: 0 errors.

Then start the dev server (`npm run dev`) and open `http://localhost:3000/projects` in a browser. Confirm: page renders, "Back to home" link works, single seeded row appears with the placeholder title.

- [ ] **Step 4: Commit**

```bash
git add components/projects/ProjectsIndex.tsx app/projects/page.tsx
git commit -m "feat(projects): /projects index route"
```

---

## Task 12: `ProjectDetail` + `/projects/[slug]` route

**Files:**
- Create: `components/projects/ProjectDetail.tsx`
- Create: `app/projects/[slug]/page.tsx`

- [ ] **Step 1: Create `ProjectDetail`**

```tsx
"use client";

/**
 * ProjectDetail — body of /projects/[slug]. Reads api.projects.getBySlug
 * for this row and api.projects.list for prev/next neighbor resolution.
 *
 * Layout: single column, max-width 880px, centered, generous vertical
 * rhythm. Hero image fades in on mount; hero metric counts up via
 * ProjectNarrative; everything else is static editorial typography.
 */

import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChromaticText } from "@/components/home/ChromaticText";
import { FlowingGradientText } from "@/components/home/FlowingGradientText";
import { ProjectMetadataStrip } from "./ProjectMetadataStrip";
import { ProjectNarrative } from "./ProjectNarrative";
import { neighbors } from "@/lib/projects/neighbors";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE = "rgba(255,255,255,0.14)";

type Props = { slug: string };

export function ProjectDetail({ slug }: Props) {
  const project = useQuery(api.projects.getBySlug, { slug });
  const all = useQuery(api.projects.list);

  if (project === undefined) return null; // still loading
  if (project === null) notFound();

  const titleLine = project.outcome ?? project.title;
  const kind = project.approach ? "CASE STUDY" : "PROJECT";
  const eyebrowParts = [kind, project.year, project.role].filter(
    (s): s is string => Boolean(s && s.trim().length > 0),
  );

  const { prev, next } = neighbors(all ?? [], slug);

  const heroUrl = useQuery(
    api.projects.getStorageUrl,
    project.heroImageStorageId ? { storageId: project.heroImageStorageId } : "skip",
  );

  return (
    <main className="relative min-h-[100dvh] bg-[#05060a] py-[clamp(64px,10vh,120px)] text-white">
      <div className="mx-auto w-full max-w-[880px] px-6">
        <a
          href="/projects"
          className="text-[11px] text-white/55 transition hover:text-white"
          style={{ ...MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
        >
          &larr; All projects
        </a>

        <header className="mt-10">
          <div
            className="text-[10px] text-white/45"
            style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
          >
            {eyebrowParts.join(" \u00B7 ")}
          </div>
          <h1
            className="mt-6 text-[clamp(40px,7vh,80px)] leading-[1.02] tracking-[-2.5px] text-white"
            style={{
              fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            <ChromaticText amount={0.25}>
              <FlowingGradientText>{titleLine}</FlowingGradientText>
            </ChromaticText>
          </h1>
          {project.outcome && (
            <p className="mt-3 text-[18px] font-light text-white/55">
              {project.title}
            </p>
          )}
          <ProjectMetadataStrip project={project} techStack={project.techStack} />
          <div aria-hidden className="mt-8 h-px w-full" style={{ background: HAIRLINE }} />
        </header>

        {heroUrl && (
          <div
            className="mt-[clamp(40px,7vh,80px)] aspect-[16/10] w-full overflow-hidden rounded-2xl"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroUrl}
              alt={project.heroImageAlt ?? project.title}
              className="size-full object-cover opacity-0 transition-opacity duration-700 motion-safe:opacity-100"
              style={{ opacity: 1 }}
              loading="eager"
            />
          </div>
        )}

        <div className="mt-[clamp(48px,8vh,96px)] grid grid-cols-1 gap-8 md:grid-cols-3">
          <FactBlock label="PROBLEM" body={project.problem} />
          <FactBlock label="USERS" body={project.users} />
          <FactBlock label="VALUE" body={project.value} />
        </div>

        <ProjectNarrative project={project} />

        <footer className="mt-[clamp(64px,10vh,120px)]">
          <div aria-hidden className="h-px w-full" style={{ background: HAIRLINE }} />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <NavLink
              direction="prev"
              href={prev ? `/projects/${prev.slug}` : null}
              label={prev ? truncate(prev.outcome ?? prev.title, 40) : null}
            />
            <NavLink
              direction="next"
              href={next ? `/projects/${next.slug}` : null}
              label={next ? truncate(next.outcome ?? next.title, 40) : null}
            />
          </div>
          <div className="mt-8 text-center">
            <a
              href="/projects"
              className="text-[11px] text-white/55 transition hover:text-white"
              style={{ ...MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
            >
              See all projects &rarr;
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FactBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div
        className="text-[10px] text-white/45"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div aria-hidden className="mt-2 h-px w-full" style={{ background: HAIRLINE }} />
      <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-white/80">
        {body}
      </p>
    </div>
  );
}

function NavLink({
  direction,
  href,
  label,
}: {
  direction: "prev" | "next";
  href: string | null;
  label: string | null;
}) {
  if (!href || !label) return <div />;
  const align = direction === "prev" ? "text-left" : "text-right md:text-right";
  return (
    <a href={href} className={`${align} block transition hover:opacity-100 opacity-80`}>
      <div
        className="text-[10px] text-white/45"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
        }}
      >
        {direction === "prev" ? "\u2190 Previous project" : "Next project \u2192"}
      </div>
      <div className="mt-2 text-[16px] text-white">{label}</div>
    </a>
  );
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "\u2026";
}
```

- [ ] **Step 2: Create `app/projects/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ProjectDetail } from "@/components/projects/ProjectDetail";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchQuery(api.projects.getBySlug, { slug }).catch(() => null);
  if (!project) {
    return { title: "Project \u2014 Siddharth Agrawal" };
  }
  const titleLine = project.outcome ?? project.title;
  return {
    title: `${titleLine} \u2014 Siddharth Agrawal`,
    description: project.problem.slice(0, 160),
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  return <ProjectDetail slug={slug} />;
}
```

> **Implementer note:** If `convex/nextjs`'s `fetchQuery` import path differs in this Convex version, fall back to a static `description` of `"Projects and case studies by Siddharth Agrawal."` rather than blocking. The page itself does not depend on this metadata call — `ProjectDetail` resolves the row client-side.

- [ ] **Step 3: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Smoke test the route**

Open `http://localhost:3000/projects/replace-via-admin` — confirm the page renders with the placeholder title, fact sheet, and `← All projects` link.

- [ ] **Step 5: Commit**

```bash
git add components/projects/ProjectDetail.tsx app/projects/\[slug\]/page.tsx
git commit -m "feat(projects): /projects/[slug] detail route"
```

---

## Task 13: Preview route — Variants A/B/C → STOP for user pick

**Files:**
- Create: `app/preview/projects/page.tsx`
- Create: `components/preview/ProjectsPreview.tsx`

This is the CLAUDE.md sign-off hard-gate. After this task ships, **stop and ask the user to pick a variant** before continuing to Task 14.

- [ ] **Step 1: Create the preview component**

```tsx
"use client";

/**
 * Preview-only — three side-by-side variants of the homepage Projects
 * chapter, rendered against the live Convex collection.
 *
 *   A — Sticky-numeral cinematic stack (default)
 *   B — Cinematic stack, numerals scroll with the beat
 *   C — Asymmetric beats, alternating left/right media columns
 *
 * Throwaway. Deleted at graduation in Task 14.
 */

import { ProjectsSection } from "@/components/projects/ProjectsSection";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section
      className="mb-16 overflow-hidden rounded-xl"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="px-6 py-3 text-[11px] text-white/65"
        style={{
          ...MONO,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {label}
      </div>
      {children}
    </section>
  );
}

export function ProjectsPreview() {
  return (
    <main className="min-h-[100dvh] bg-[#05060a] py-12 text-white">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <h1
          className="mb-10 text-[28px] text-white/85"
          style={{
            fontFamily:
              'ui-serif, "New York", "Iowan Old Style", "Apple Garamond", Georgia, serif',
            fontStyle: "italic",
            fontWeight: 300,
          }}
        >
          Projects chapter \u2014 preview
        </h1>

        <Frame label="VARIANT A \u00B7 STICKY NUMERAL CINEMATIC STACK">
          <ProjectsSection stickyNumeral alternateMediaSide={false} />
        </Frame>

        <Frame label="VARIANT B \u00B7 NUMERALS SCROLL WITH BEAT">
          <ProjectsSection stickyNumeral={false} alternateMediaSide={false} />
        </Frame>

        <Frame label="VARIANT C \u00B7 ALTERNATING ASYMMETRIC BEATS">
          <ProjectsSection stickyNumeral alternateMediaSide />
        </Frame>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create the preview route**

`app/preview/projects/page.tsx`:

```tsx
// Throwaway preview route per CLAUDE.md. Deleted at graduation.
import { ProjectsPreview } from "@/components/preview/ProjectsPreview";

export default function ProjectsPreviewPage() {
  return <ProjectsPreview />;
}
```

- [ ] **Step 3: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/preview/projects/page.tsx components/preview/ProjectsPreview.tsx
git commit -m "feat(preview): projects chapter A/B/C side-by-side"
```

- [ ] **Step 5: Push and wait for Vercel preview deploy**

```bash
git push origin main
```

Then watch Vercel auto-deploy and report the preview URL.

- [ ] **Step 6: STOP — ask the user to pick a variant**

Paste this exact message to the user and wait for their answer:

> Preview is live at `/preview/projects` (production + Vercel preview both have it). Three variants are stacked top-to-bottom: **A** (sticky numerals, media always on the right), **B** (numerals scroll with the beat), **C** (alternating left/right media). Which one ships? `A`, `B`, or `C`.

Do not proceed to Task 14 until they answer.

---

## Task 14: Graduate winner + delete preview + slot into `app/page.tsx`

**Files:**
- Modify: `components/projects/ProjectsSection.tsx`
- Modify: `app/page.tsx`
- Delete: `app/preview/projects/page.tsx`
- Delete: `components/preview/ProjectsPreview.tsx`
- Delete: `components/home/ProjectGridPlaceholder.tsx`

- [ ] **Step 1: Bake the winning variant's props into `ProjectsSection`'s defaults**

In `components/projects/ProjectsSection.tsx`, change the `Props` defaults so the chosen variant is the new default:

- **If A wins:** keep `stickyNumeral = true`, `alternateMediaSide = false` (already the defaults; no change needed).
- **If B wins:** change `stickyNumeral = true` to `stickyNumeral = false`.
- **If C wins:** change `alternateMediaSide = false` to `alternateMediaSide = true`.

Then remove both props entirely from the public surface — the section is no longer parameterized after graduation. The final signature is `export function ProjectsSection()` with the variant's behavior hard-coded. Update the JSDoc header to drop the variant language.

- [ ] **Step 2: Slot `ProjectsSection` into `app/page.tsx`**

Replace the placeholder block. The full file should read:

```tsx
import { Hero } from "@/components/home/Hero";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import { ProjectsSection } from "@/components/projects/ProjectsSection";
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
        <ProjectsSection />
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

- [ ] **Step 3: Delete the preview files and the placeholder**

```bash
rm app/preview/projects/page.tsx components/preview/ProjectsPreview.tsx components/home/ProjectGridPlaceholder.tsx
```

If `components/preview/` becomes empty, remove the directory too: `rmdir components/preview 2>/dev/null || true`.

- [ ] **Step 4: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Smoke test the homepage**

Open `http://localhost:3000` — confirm the Projects chapter renders between Experience and the About placeholder, behaves as the chosen variant, and the placeholder grid is gone.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/projects/ProjectsSection.tsx
git add -u app/preview/projects/page.tsx components/preview/ProjectsPreview.tsx components/home/ProjectGridPlaceholder.tsx
git commit -m "feat(projects): graduate winner, slot into homepage, delete preview"
```

---

## Task 15: `AdminEditorProjects` + 4th tab wiring

**Files:**
- Create: `components/admin/AdminEditorProjects.tsx`
- Create: `components/admin/HeroImageUploader.tsx`
- Modify: `components/admin/AdminEditor.tsx`

- [ ] **Step 1: Create `HeroImageUploader`**

```tsx
"use client";

/**
 * HeroImageUploader — admin-only file picker that posts to a Convex
 * generateUploadUrl, then returns the resulting Id<"_storage"> via
 * onUploaded. The parent (AdminEditorProjects) is responsible for
 * patching the row with the new storage id.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Props = {
  storageId: Id<"_storage"> | undefined;
  onUploaded: (id: Id<"_storage">) => void;
};

export function HeroImageUploader({ storageId, onUploaded }: Props) {
  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const currentUrl = useQuery(
    api.projects.getStorageUrl,
    storageId ? { storageId } : "skip",
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { storageId: newId } = (await res.json()) as {
        storageId: Id<"_storage">;
      };
      onUploaded(newId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt="Current hero"
          className="aspect-[3/2] w-[240px] rounded-md object-cover"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        />
      )}
      <label className="inline-flex w-fit cursor-pointer items-center rounded-full border border-white/20 px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/5">
        {uploading ? "Uploading\u2026" : currentUrl ? "Replace image" : "Upload image"}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </label>
      {error && <div className="text-[11px] text-red-400">{error}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Create `AdminEditorProjects`**

```tsx
"use client";

/**
 * AdminEditorProjects — Projects tab. CRUD + reorder + hero upload.
 *
 * Mirrors AdminEditorRoles' structure:
 *   • Left rail = list, with ↑/↓ reorder, + New, delete.
 *   • Right panel = form for selected row, save on explicit click.
 *
 * Slug is auto-generated from title and editable behind a toggle.
 * URLs are validated with new URL() before save.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { slugify } from "@/lib/projects/slugify";
import { HeroImageUploader } from "./HeroImageUploader";

const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const HAIRLINE_FAINT = "rgba(255,255,255,0.08)";

type Project = Doc<"projects">;

type Draft = {
  slug: string;
  featured: boolean;
  title: string;
  outcome: string;
  year: string;
  role: string;
  liveUrl: string;
  githubUrl: string;
  figmaUrl: string;
  techStack: string[];
  heroImageStorageId: Id<"_storage"> | undefined;
  heroImageAlt: string;
  problem: string;
  users: string;
  value: string;
  approach: string;
  outcomeNarrative: string;
  heroMetricValue: string;
  heroMetricLabel: string;
};

function toDraft(p: Project): Draft {
  return {
    slug: p.slug,
    featured: p.featured,
    title: p.title,
    outcome: p.outcome ?? "",
    year: p.year,
    role: p.role ?? "",
    liveUrl: p.liveUrl ?? "",
    githubUrl: p.githubUrl ?? "",
    figmaUrl: p.figmaUrl ?? "",
    techStack: [...p.techStack],
    heroImageStorageId: p.heroImageStorageId,
    heroImageAlt: p.heroImageAlt ?? "",
    problem: p.problem,
    users: p.users,
    value: p.value,
    approach: p.approach ?? "",
    outcomeNarrative: p.outcomeNarrative ?? "",
    heroMetricValue: p.heroMetricValue ?? "",
    heroMetricLabel: p.heroMetricLabel ?? "",
  };
}

function isDirty(d: Draft, p: Project): boolean {
  return (
    d.slug !== p.slug ||
    d.featured !== p.featured ||
    d.title !== p.title ||
    d.outcome !== (p.outcome ?? "") ||
    d.year !== p.year ||
    d.role !== (p.role ?? "") ||
    d.liveUrl !== (p.liveUrl ?? "") ||
    d.githubUrl !== (p.githubUrl ?? "") ||
    d.figmaUrl !== (p.figmaUrl ?? "") ||
    JSON.stringify(d.techStack) !== JSON.stringify(p.techStack) ||
    d.heroImageStorageId !== p.heroImageStorageId ||
    d.heroImageAlt !== (p.heroImageAlt ?? "") ||
    d.problem !== p.problem ||
    d.users !== p.users ||
    d.value !== p.value ||
    d.approach !== (p.approach ?? "") ||
    d.outcomeNarrative !== (p.outcomeNarrative ?? "") ||
    d.heroMetricValue !== (p.heroMetricValue ?? "") ||
    d.heroMetricLabel !== (p.heroMetricLabel ?? "")
  );
}

function isValidUrl(u: string): boolean {
  if (!u) return true;
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

export function AdminEditorProjects() {
  const projects = useQuery(api.projects.list);
  const upsert = useMutation(api.projects.upsert);
  const remove = useMutation(api.projects.remove);
  const reorder = useMutation(api.projects.reorder);

  const [selectedId, setSelectedId] = useState<Id<"projects"> | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingSlug, setEditingSlug] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => projects?.find((p) => p._id === selectedId) ?? null,
    [projects, selectedId],
  );

  function select(p: Project) {
    setSelectedId(p._id);
    setDraft(toDraft(p));
    setEditingSlug(false);
    setError(null);
  }

  async function handleNew() {
    if (!projects) return;
    const order = projects.length;
    const slug = `untitled-${order}`;
    const id = await upsert({
      slug,
      order,
      featured: false,
      title: "Untitled",
      year: String(new Date().getFullYear()),
      techStack: [],
      problem: "",
      users: "",
      value: "",
    });
    setSelectedId(id);
  }

  async function handleSave() {
    if (!draft || !selected) return;
    setError(null);

    for (const [name, url] of [
      ["liveUrl", draft.liveUrl],
      ["githubUrl", draft.githubUrl],
      ["figmaUrl", draft.figmaUrl],
    ] as const) {
      if (!isValidUrl(url)) {
        setError(`${name} is not a valid URL`);
        return;
      }
    }

    setSaving(true);
    try {
      await upsert({
        id: selected._id,
        slug: draft.slug,
        order: selected.order,
        featured: draft.featured,
        title: draft.title,
        outcome: draft.outcome || undefined,
        year: draft.year,
        role: draft.role || undefined,
        liveUrl: draft.liveUrl || undefined,
        githubUrl: draft.githubUrl || undefined,
        figmaUrl: draft.figmaUrl || undefined,
        techStack: draft.techStack,
        heroImageStorageId: draft.heroImageStorageId,
        heroImageAlt: draft.heroImageAlt || undefined,
        problem: draft.problem,
        users: draft.users,
        value: draft.value,
        approach: draft.approach || undefined,
        outcomeNarrative: draft.outcomeNarrative || undefined,
        heroMetricValue: draft.heroMetricValue || undefined,
        heroMetricLabel: draft.heroMetricLabel || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Project) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    await remove({ id: p._id });
    if (selectedId === p._id) {
      setSelectedId(null);
      setDraft(null);
    }
  }

  async function handleReorder(p: Project, dir: -1 | 1) {
    if (!projects) return;
    const i = projects.findIndex((x) => x._id === p._id);
    const j = i + dir;
    if (j < 0 || j >= projects.length) return;
    const next = [...projects];
    [next[i], next[j]] = [next[j], next[i]];
    await reorder({ orderedIds: next.map((x) => x._id) });
  }

  function addTech() {
    if (!draft) return;
    const t = techInput.trim();
    if (!t) return;
    if (draft.techStack.includes(t)) {
      setTechInput("");
      return;
    }
    if (draft.techStack.length >= 12) return;
    setDraft({ ...draft, techStack: [...draft.techStack, t] });
    setTechInput("");
  }

  if (projects === undefined) return null;

  const dirty = selected && draft ? isDirty(draft, selected) : false;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[320px_1fr]">
      {/* Left rail */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleNew}
          className="w-full rounded-md border border-white/15 px-3 py-2 text-left text-[12px] text-white hover:bg-white/5"
          style={MONO}
        >
          + New project
        </button>
        {projects.map((p, i) => (
          <div
            key={p._id}
            className={`flex items-center gap-2 rounded-md px-2 py-2 ${
              selectedId === p._id ? "bg-white/5" : ""
            }`}
            style={{ border: `1px solid ${HAIRLINE_FAINT}` }}
          >
            <button
              type="button"
              onClick={() => select(p)}
              className="flex-1 text-left text-[12px] text-white"
            >
              <div className="flex items-center gap-2">
                <span>{p.title}</span>
                {p.featured && (
                  <span
                    className="rounded-full px-1.5 py-[1px] text-[9px] text-emerald-300"
                    style={{
                      ...MONO,
                      letterSpacing: "0.12em",
                      border: "1px solid rgba(110,231,183,0.3)",
                    }}
                  >
                    FEATURED
                  </span>
                )}
              </div>
              <div
                className="text-[10px] text-white/45"
                style={{ ...MONO, letterSpacing: "0.18em" }}
              >
                {p.year}
              </div>
            </button>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => handleReorder(p, -1)}
                className="text-[11px] text-white/55 disabled:opacity-30"
              >
                &uarr;
              </button>
              <button
                type="button"
                disabled={i === projects.length - 1}
                onClick={() => handleReorder(p, 1)}
                className="text-[11px] text-white/55 disabled:opacity-30"
              >
                &darr;
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(p)}
              className="text-[11px] text-red-400/70 hover:text-red-400"
              aria-label="Delete"
            >
              \u2715
            </button>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div>
        {!draft || !selected ? (
          <p className="text-[13px] text-white/55">
            Select a project on the left, or create a new one.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Identity */}
            <Section label="Identity">
              <Field label="Slug">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draft.slug}
                    disabled={!editingSlug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                    className="flex-1 rounded-md border border-white/15 bg-transparent px-3 py-2 text-[13px] text-white disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editingSlug) {
                        setEditingSlug(false);
                      } else {
                        setDraft({ ...draft, slug: slugify(draft.title) });
                        setEditingSlug(true);
                      }
                    }}
                    className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] text-white/75"
                  >
                    {editingSlug ? "Lock" : "Edit"}
                  </button>
                </div>
              </Field>
              <label className="flex items-center gap-2 text-[12px] text-white/80">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                />
                Featured on homepage
              </label>
            </Section>

            {/* Header copy */}
            <Section label="Header copy">
              <Field label="Title">
                <Input value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
              </Field>
              <Field label="Outcome (optional)" hint="Leads on cards when set. Leave blank for hobby projects.">
                <Input value={draft.outcome} onChange={(v) => setDraft({ ...draft, outcome: v })} />
              </Field>
              <Field label="Year">
                <Input value={draft.year} onChange={(v) => setDraft({ ...draft, year: v })} />
              </Field>
              <Field label="Role (optional)">
                <Input value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} />
              </Field>
            </Section>

            {/* Links */}
            <Section label="Links">
              <Field label="Live URL">
                <Input value={draft.liveUrl} onChange={(v) => setDraft({ ...draft, liveUrl: v })} />
              </Field>
              <Field label="GitHub URL">
                <Input value={draft.githubUrl} onChange={(v) => setDraft({ ...draft, githubUrl: v })} />
              </Field>
              <Field label="Figma URL">
                <Input value={draft.figmaUrl} onChange={(v) => setDraft({ ...draft, figmaUrl: v })} />
              </Field>
            </Section>

            {/* Tech stack */}
            <Section label="Tech stack">
              <div className="flex flex-wrap gap-1.5">
                {draft.techStack.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px] text-white/80"
                    style={{ border: `1px solid ${HAIRLINE_FAINT}`, ...MONO }}
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          techStack: draft.techStack.filter((x) => x !== t),
                        })
                      }
                      className="text-white/45 hover:text-white"
                      aria-label={`Remove ${t}`}
                    >
                      \u00D7
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTech();
                    }
                  }}
                  placeholder="Add chip, press Enter"
                  className="flex-1 rounded-md border border-white/15 bg-transparent px-3 py-2 text-[13px] text-white"
                />
                <button
                  type="button"
                  onClick={addTech}
                  className="rounded-md border border-white/15 px-3 py-2 text-[12px] text-white/80"
                >
                  Add
                </button>
              </div>
            </Section>

            {/* Hero image */}
            <Section label="Hero image">
              <HeroImageUploader
                storageId={draft.heroImageStorageId}
                onUploaded={(id) => setDraft({ ...draft, heroImageStorageId: id })}
              />
              <Field label="Alt text">
                <Input
                  value={draft.heroImageAlt}
                  onChange={(v) => setDraft({ ...draft, heroImageAlt: v })}
                />
              </Field>
            </Section>

            {/* Fact sheet */}
            <Section label="Fact sheet">
              <Field label="Problem">
                <Textarea
                  rows={6}
                  value={draft.problem}
                  onChange={(v) => setDraft({ ...draft, problem: v })}
                />
              </Field>
              <Field label="Users">
                <Textarea
                  rows={6}
                  value={draft.users}
                  onChange={(v) => setDraft({ ...draft, users: v })}
                />
              </Field>
              <Field label="Value">
                <Textarea
                  rows={6}
                  value={draft.value}
                  onChange={(v) => setDraft({ ...draft, value: v })}
                />
              </Field>
            </Section>

            {/* Case-study narrative */}
            <Section
              label="Case-study narrative (optional)"
              hint="Leave all four blank for hobby projects \u2014 the detail page hides this section automatically."
            >
              <Field label="Approach">
                <Textarea
                  rows={8}
                  value={draft.approach}
                  onChange={(v) => setDraft({ ...draft, approach: v })}
                />
              </Field>
              <Field label="Outcome narrative">
                <Textarea
                  rows={8}
                  value={draft.outcomeNarrative}
                  onChange={(v) => setDraft({ ...draft, outcomeNarrative: v })}
                />
              </Field>
              <Field label="Hero metric value">
                <Input
                  value={draft.heroMetricValue}
                  onChange={(v) => setDraft({ ...draft, heroMetricValue: v })}
                />
              </Field>
              <Field label="Hero metric label">
                <Input
                  value={draft.heroMetricLabel}
                  onChange={(v) => setDraft({ ...draft, heroMetricLabel: v })}
                />
              </Field>
            </Section>

            {error && (
              <div className="text-[12px] text-red-400">{error}</div>
            )}

            <div className="sticky bottom-4 flex justify-end">
              <button
                type="button"
                disabled={!dirty || saving}
                onClick={handleSave}
                className="rounded-full bg-white px-5 py-2 text-[13px] font-medium text-black disabled:opacity-40"
              >
                {saving ? "Saving\u2026" : dirty ? "Save changes" : "Saved"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <div
          className="text-[10px] text-white/45"
          style={{ ...MONO, letterSpacing: "0.32em", textTransform: "uppercase" }}
        >
          {label}
        </div>
        <div aria-hidden className="mt-1 h-px w-full" style={{ background: HAIRLINE_FAINT }} />
        {hint && <p className="mt-2 text-[11px] text-white/55">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[10px] text-white/55"
        style={{ ...MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
      >
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-white/45">{hint}</span>}
    </label>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-white/15 bg-transparent px-3 py-2 text-[13px] text-white"
    />
  );
}

function Textarea({
  rows,
  value,
  onChange,
}: {
  rows: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-white/15 bg-transparent px-3 py-2 text-[13px] leading-relaxed text-white"
    />
  );
}
```

- [ ] **Step 3: Wire the 4th tab into `AdminEditor.tsx`**

Three edits in `components/admin/AdminEditor.tsx`:

1. Add the import below the existing `AdminEditorRoles` import:

```ts
import { AdminEditorProjects } from "./AdminEditorProjects";
```

2. Extend the `TabKey` type and `TABS` array:

```ts
type TabKey = "copy" | "contacts" | "experience" | "projects";

const TABS: { key: TabKey; label: string }[] = [
  { key: "copy", label: "Copy" },
  { key: "contacts", label: "Contacts" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
];
```

3. Render the new panel inside the `tabpanel` div, after the Experience line:

```tsx
{active === "experience" && <AdminEditorRoles />}
{active === "projects" && <AdminEditorProjects />}
```

- [ ] **Step 4: Verify TS compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Smoke test in the browser**

Log in to `/admin/edit`, switch to the **Projects** tab. Confirm: the seeded `Replace via /admin/edit` row appears in the rail, selecting it loads the form, edits stay dirty until saved, the slug toggle works, the tech-stack chip editor adds/removes chips, and the hero image uploader posts and renders the preview.

- [ ] **Step 6: Commit**

```bash
git add components/admin/AdminEditorProjects.tsx components/admin/HeroImageUploader.tsx components/admin/AdminEditor.tsx
git commit -m "feat(admin): Projects tab with CRUD, reorder, hero image upload"
```

---

## Task 16: Build, push, verify Vercel deploy

**Files:** None edited.

- [ ] **Step 1: Run full build locally**

Run: `npm run build`
Expected: exits 0. No type errors, no missing-export errors.

- [ ] **Step 2: Run tests**

Run: `npx vitest run`
Expected: all green, including the new `slugify` and `neighbors` suites.

- [ ] **Step 3: Push**

```bash
git push origin main
```

Vercel auto-deploys from `main`. Do not run `vercel deploy`.

- [ ] **Step 4: Verify the production deploy**

Wait for the Vercel deploy to finish (`vercel:status` skill or the Vercel dashboard). Once the production deploy is green, visit:

- `/` — confirm the Projects chapter renders between Experience and About, with the chosen variant's motion.
- `/projects` — confirm the index lists the seeded row.
- `/projects/replace-via-admin` — confirm the detail page renders.
- `/admin/edit` — confirm the **Projects** tab is present and functional.

- [ ] **Step 5: Run the seed mutation against production Convex**

If the production Convex still has no `projects` rows (i.e. `/projects` shows "No projects yet."), run the seed:

```bash
npx convex run seed:seedProjects
```

Expected: `{ inserted: 1 }`. Refresh the surfaces to confirm.

- [ ] **Step 6: Report verdict to the user**

Surface the production URLs of `/`, `/projects`, and `/projects/[slug]`, plus the admin link. Note any deferred items (the spec's Out-of-Scope list is the canonical follow-up backlog).

---

## Self-Review

After writing this plan, I checked it against the spec:

1. **Spec coverage:** every spec section has a task — schema (T1), Convex API (T2), seed (T3), helpers (T4–T5), shared components (T6–T7), homepage chapter (T8–T9), index (T10–T11), detail (T12), sign-off vehicle (T13), graduation (T14), admin (T15), deploy (T16). The two new EditableText slot groups (homepage + index) ship implicitly via `EditableText` fallbacks on first paint — no separate task is needed because the existing Copy tab discovers any slot the moment `EditableText` is first rendered.

2. **Placeholders:** none — every code step has the complete code block.

3. **Type / naming consistency:** `ProjectsSection`, `ProjectScrollBeat`, `ProjectsIndex`, `ProjectIndexRow`, `ProjectDetail`, `ProjectMetadataStrip`, `ProjectNarrative`, `AdminEditorProjects`, `HeroImageUploader` — all match the spec's File Structure section. Convex API names (`list`, `listFeatured`, `getBySlug`, `upsert`, `remove`, `reorder`, `generateUploadUrl`, `getStorageUrl`) match the spec.

4. **Title-line rule** (`outcome ?? title`) is applied in `ProjectScrollBeat` (T8), `ProjectIndexRow` (T10), `ProjectDetail` (T12), and the prev/next nav labels (T12). Meta line is `[role, projectName].filter(Boolean).join(" \u00B7 ")` where `projectName = title` only when `outcome` is set — exactly what the spec specifies in three places.

5. **CLAUDE.md compliance:** sign-off goes through `app/preview/projects/page.tsx` (T13), winner graduates with the preview deleted in the same commit (T14), every user-facing string lives in `siteContent` (eyebrows, headline, standfirst, index link) or the `projects` Convex collection (per-row content). No new global GSAP timeline on top of the Hero pin — each `ProjectScrollBeat` owns its own `ScrollTrigger` scrubbed against itself.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-11-projects-chapter.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh Opus subagent per task with ultrareview on both reviewers ("ultrareview" per your memory). Fast iteration, no per-task confirmation between T1–T12 and T14–T16. **Hard gate at T13** for the preview pick.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

**Which approach?**
