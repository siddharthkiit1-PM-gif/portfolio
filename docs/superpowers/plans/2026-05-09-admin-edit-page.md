# Admin Edit Page — Next Phase Plan

> **For agentic workers:** plan executed inline. Tasks run straight through.

**Goal:** Build a single admin route at `/admin/edit` (gated behind the existing Convex auth) where every editable string in the site can be searched, listed, and edited from one screen — backed by the same `siteContent` table that `EditableText` already reads/writes. Wire the remaining hard-coded strings (rail contact endpoints, Experience role rows, education line) into the editable system so nothing is hard-coded after this phase.

**Architecture:**
- New Convex query `siteContent.list` returns all rows grouped by `page`. Existing `siteContent.get(page, slot)` and the `set` mutation stay as-is.
- `app/admin/edit/page.tsx` is a server component that authorizes via the existing Convex auth, then renders a client `<AdminEditor />`.
- `<AdminEditor />` is a two-pane layout — left: search + page/slot tree, right: the existing `EditableTextEditor` instantiated for the selected slot.
- New `siteContacts` document type (single-row config) holds email / LinkedIn / résumé URL / phone. Read at server-render time on the rail and CTA components.
- Experience roles move from a `const ROLES` in `Experience.tsx` to a Convex `experienceRoles` collection with role / company / dates / metric / outcome / order fields. The component subscribes via `useQuery`.

**Tech Stack:** Next.js 16 App Router · Convex · existing `EditableText` / `EditableTextEditor` / `AdminProvider` / `AdminBar` · Tailwind v4.

**Out of scope:** image asset management (already covered by `EditableMedia`), schema versioning of tiptap content (keep `CURRENT_SCHEMA_VERSION` flow), reordering UI for arbitrary collections beyond Experience.

---

## Task 1 — Convex schema additions

**Files:** Modify `convex/schema.ts`. Modify `convex/siteContent.ts`. Create `convex/siteContacts.ts`. Create `convex/experienceRoles.ts`.

- Add `siteContacts` table: `{ email: v.string(), linkedinUrl: v.string(), resumeUrl: v.string(), phone: v.optional(v.string()), updatedAt: v.number() }`. Singleton row keyed by a literal `"primary"`.
- Add `experienceRoles` table: `{ order: v.number(), dates: v.string(), company: v.string(), title: v.string(), metric: v.string(), outcome: v.optional(v.string()), updatedAt: v.number() }`. Indexed by `order`.
- Implement `siteContent.list({ page })` returning `{ slot, valueJson }[]` plus a `siteContent.listPages()` returning unique pages.
- Implement `siteContacts.get` (public query) and `siteContacts.upsert` (admin-gated mutation).
- Implement `experienceRoles.list` (public query, ordered) and `experienceRoles.upsert`, `experienceRoles.remove`, `experienceRoles.reorder` (admin-gated).

**Verify:** `pnpm convex dev` regenerates `_generated`; admin auth check matches the pattern in `convex/auth.ts`.

## Task 2 — Migrate hard-coded rail + experience values

**Files:** Modify `components/home/HeroRecruiterRail.tsx`, `components/home/Experience.tsx`. Modify `convex/seed.ts` to backfill defaults.

- `HeroRecruiterRail` reads contacts via `useQuery(api.siteContacts.get)` with the current literals as fallback. The `EMAIL` / `LINKEDIN_URL` / `RESUME_URL` constants come from there.
- `Experience` reads `experienceRoles.list`, falls back to the seeded list. Continues to expose `data-experience-row` so the GSAP stagger keeps working — render the same DOM shape.
- Seed: insert the three current roles + the current contact endpoints at first boot.

**Verify:** with no rows in either table, the hero renders identical to today; with seeded rows, edits in `/admin/edit` propagate live.

## Task 3 — Admin edit page

**Files:** Create `app/admin/edit/page.tsx`. Create `components/admin/AdminEditor.tsx`. Create `components/admin/AdminEditorList.tsx`. Create `components/admin/AdminEditorContacts.tsx`. Create `components/admin/AdminEditorRoles.tsx`.

- `app/admin/edit/page.tsx` server component: redirect unauthenticated users to `/admin/login`, then render `<AdminEditor />`.
- `<AdminEditor />` has three tabs:
  1. **Copy** — every `siteContent` slot grouped by page, with inline search and the existing `EditableTextEditor` mounted on selection.
  2. **Contacts** — form bound to `siteContacts.upsert` (email / LinkedIn / résumé / phone).
  3. **Experience** — list of role rows with up/down reorder, edit-in-place fields, delete, and "Add role".
- Layout: 320px left pane (search + tree) + flexible right pane (selected editor). Sticky save indicator (uses the existing `useAdmin().isEditing` cue).

**Verify:** every hard-coded string surfaced in this phase appears as an editable row; saving updates the live homepage on the next render.

## Task 4 — Wire the AdminBar entry point

**Files:** Modify `components/admin/AdminBar.tsx`.

- Add a "Edit content" button visible when an admin is signed in. Links to `/admin/edit`.
- Keep the existing inline-edit toggle so per-slot editing on the live page also works for power users.

**Verify:** `pnpm dev`, sign in, the bar shows the new button, clicking it lands on `/admin/edit`.

## Task 5 — Tests

**Files:** Create `tests/admin/edit-page.spec.ts` (Playwright). Modify `convex/users.test.ts` if patterns dictate Convex-side coverage.

- Anonymous visit to `/admin/edit` → redirects to `/admin/login`.
- Authenticated visit → tabs render, contacts form saves, role row reorders, copy slot edits round-trip.

**Verify:** `pnpm test:e2e --grep admin-edit` is green.

## Task 6 — Documentation + cleanup

**Files:** Modify `CLAUDE.md`. Modify `convex/README.md`.

- Add a section to `CLAUDE.md` documenting the editable-by-default rule: any new user-facing string lands as an `EditableText` slot or in a Convex collection, never as a hard-coded literal.
- Document the `siteContacts` and `experienceRoles` collections in `convex/README.md`.

## Task 7 — Commit

Single commit on a fresh branch: `feat(admin): unified content editor + Convex-backed contacts and experience`.

---

## Stop point

After Task 7 stop and wait for user verdict on the admin edit page before:
- Wiring further pages (work / notes / talks / about) into the editor
- Importing the resume PDF into Convex storage instead of `public/`
- Pushing to Vercel
