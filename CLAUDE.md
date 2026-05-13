# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal portfolio site for Siddharth Agrawal. Next.js 16 App Router frontend, Convex backend, GSAP + Lenis-driven hero choreography, Three.js cinematic intro, and a unified admin editor that makes every user-facing string editable through Tiptap. The site is content-heavy, animation-heavy, and design-led — fidelity matters more than feature breadth.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server on :3000 (project uses pnpm — see `pnpm-lock` and `.pnpm` in node_modules) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint (Next.js config) |
| `pnpm typecheck` | `tsc --noEmit` — run before declaring work done |
| `pnpm test` | Vitest single-shot run (jsdom + React Testing Library) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:e2e` | Playwright e2e |
| `pnpm portrait:build` | Custom `tsx scripts/build-portrait-mask.ts` — regenerates the hero portrait mask via `@imgly/background-removal-node` |

Run a single Vitest file: `pnpm exec vitest run components/three/Constellation.test.tsx`
Run by test name: `pnpm exec vitest run -t "renders the orb"`
Run a single Playwright spec: `pnpm exec playwright test path/to/spec.ts`

Convex (when working on backend): `pnpm exec convex dev` for local dev (watches + pushes to Convex dev deployment). Commit `convex/_generated/` alongside any new module — Vercel does not run `convex dev`.

## Architecture

### Two-surface app

**Public site** (`app/page.tsx`, `app/projects/*`, `app/rapido/*`) renders content that is **always** sourced from Convex. Literals in components exist only as `fallback` props for first paint and as seed data — they are never the source of truth.

**Admin editor** (`app/admin/edit`, `app/admin/login`) is gated by `requireAdmin` (role on the `users` table). Three tabs cover everything editable today: **Copy** (every `siteContent` slot via Tiptap), **Contacts** (`siteContacts` singleton), **Experience** (`experienceRoles` collection). Inline `AdminBar` still handles one-slot edits on the live page.

### The "editable by default" system

Two patterns — pick by data shape:

- **Free copy** (headlines, eyebrows, body, CTAs) → wrap in `<EditableText page="..." slot="..." fallback="...">`. `EditableText` subscribes to `siteContent` keyed by `(page, slot)`. The Tiptap JSON is stored in `valueJson`; the `fallback` is the source of truth for first paint and seeds Convex on first edit.
- **Structured data** (contacts, experience roles, projects) → live in a typed Convex collection. Components subscribe via `useQuery`; literals only exist as the seed.

Any NEW user-facing string must land in `siteContent` or a typed Convex collection. Never as a literal except as a fallback for first paint / empty DB.

### Convex collections (read `convex/schema.ts` first)

- `users` — Convex Auth users with optional `role: "admin" | "viewer"`. **Index is named `email`, not `by_email`** — the auth lib looks it up by that literal name. Don't rename.
- `siteContent` — `(page, slot) → Tiptap JSON valueJson`. Index `by_page_slot`. `schemaVersion` exists for future Tiptap migrations.
- `media` — Convex storage IDs + optional Mux fields (`muxAssetId`, `muxPlaybackId`, `posterUrl`) for video assets.
- `settings` — single-row keyed by `"site"`: resume URL, Calendly URL, socials array, status pill.
- `siteContacts` — single-row keyed by `"primary"`: email, LinkedIn, GitHub, phone (E.164 digits without `+`), Calendly URL.
- `experienceRoles` — ordered list with optional `pillars[] → bullets[] { text, metric? }`. Components fall back to `EXPERIENCE_ROLE_DEFAULTS` when live row fields are missing.
- `projects` — slug-indexed case studies with hero media, fact sheet (`problem`, `users`, `value`), narrative blocks (`approach`, `outcomeNarrative`, `learnings`), optional metric value/label.

When adding fields, default to **optional** so existing prod rows keep validating without a backfill.

### Hero choreography

`components/home/HeroPinController.tsx` runs a **single GSAP master timeline** pinned via ScrollTrigger. Everything that animates inside the hero — SplitText character peel, kinetic line, name lines, orb, constellation, chromatic text — is plumbed through that controller via a ref + `data-*` selector.

**Adding parallel timelines causes desync at snap stops.** Do not introduce a second pinned timeline. Tight constraints:

- SplitText character peel ranges must stay tight (`y: ±10, x: -20..30, rot: ±8`) or characters drift into the kinetic line / name lines below and read as a render bug.
- `--ka-split` peaks above 1.6 produce visible chromatic ghost text that reads as a typo, not cinema.

Smooth scroll is `lenis` wired via `components/scroll/SmoothScrollProvider.tsx`. Reveal-on-scroll is `Reveal.tsx`. Hash-anchor offset fix is `HashAnchorFix.tsx` (covers the Lenis + sticky-header math).

### Three.js layer

`components/three/` — `CinemaHeroCanvas`, `HeroOrbCanvas`, `HeroBackground`, `Constellation`, `LensFlareMesh`. Built on `@react-three/fiber` + `drei` + `@react-three/postprocessing`. Has a non-WebGL fallback (`HeroOrbFallback.tsx`) that the layout swaps in when WebGL fails. Don't assume Three is always mounted.

## Design previews — show, don't draw in ASCII

When the user asks for a wireframe, mockup, layout option, or "what would this look like", **build a real visual design** they can open in the browser. Do not stop at ASCII art unless they explicitly ask for ASCII.

- Author a self-contained preview route under `app/preview/<topic>/page.tsx` and a co-located component under `components/preview/<Topic>.tsx`.
- Render every variant under consideration on the same page (A/B/C blocks, framed and labelled), so the user can compare side-by-side at real fidelity.
- Match the production aesthetic: same color tokens, same chromatic / gradient primitives, same type ramp. The preview should look like a slice of the live site, not a Storybook artifact.
- Push beyond Tailwind defaults — editorial type pairings (e.g. a serif for role labels alongside Inter), tabular numerals for metrics, real hairlines and decorative numerals where they earn their keep.
- Preview routes are throwaway. Mark them clearly in the file header. Once the user picks a variant, graduate the chosen design into the real component path and delete the preview file in the same commit.

The live homepage and any production component are **off-limits** until the user approves the variant from the preview.

## Plan execution cadence

Approved multi-task plans run straight through. Do not stop for per-task confirmation between tasks. Surface blockers and final verdict only.

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
