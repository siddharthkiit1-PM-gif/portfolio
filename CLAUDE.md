# Portfolio — agent guidelines

Durable build rules. These override defaults.

## Design previews — show, don't draw in ASCII

When the user asks for a wireframe, mockup, layout option, or "what would this look like", **build a real visual design** they can open in the browser. Do not stop at ASCII art unless they explicitly ask for ASCII.

- Author a self-contained preview route under `app/preview/<topic>/page.tsx` and a co-located component under `components/preview/<Topic>.tsx`.
- Render every variant under consideration on the same page (A/B/C blocks, framed and labelled), so the user can compare side-by-side at real fidelity.
- Match the production aesthetic: same color tokens, same chromatic / gradient primitives, same type ramp. The preview should look like a slice of the live site, not a Storybook artifact.
- Push beyond Tailwind defaults — use editorial type pairings (e.g. a serif for role labels alongside Inter), tabular numerals for metrics, real hairlines and decorative numerals where they earn their keep.
- Preview routes are throwaway. Mark them clearly in the file header. Once the user picks a variant, graduate the chosen design into the real component path and delete the preview file in the same commit.

The live homepage and any production component are **off-limits** until the user approves the variant from the preview.

## Editable by default

Every user-facing string in the site is editable through the admin path. Two flavors:

- **Free copy** (headlines, eyebrows, body, CTAs) → wrap in `<EditableText page="..." slot="..." fallback="...">`. The fallback is the source of truth for first paint and seeds Convex on first edit.
- **Structured data** (contact endpoints, experience roles, projects) → live in a typed Convex collection (`siteContacts`, `experienceRoles`, etc.). Components subscribe via `useQuery`; literals only exist as the seed.

Any NEW user-facing string must land in `siteContent` (free copy) or a typed Convex collection (structured data). Never a literal except as a fallback for first paint / empty DB.

The unified admin editor lives at `/admin/edit`. Three tabs cover all editable content today: Copy (every `siteContent` slot), Contacts (`siteContacts` singleton), Experience (`experienceRoles` collection). The existing inline `AdminBar` editor still handles single-slot edits on the live page.

## Plan execution cadence

Approved multi-task plans run straight through. Do not stop for per-task confirmation between tasks. Surface blockers and final verdict only.

## Hero scroll choreography — known constraints

`HeroPinController` runs a single GSAP master timeline pinned via ScrollTrigger. Anything that animates inside the hero must be plumbed through that controller via a ref + `data-*` selector — adding parallel timelines causes desync at snap stops. SplitText character peel ranges must stay tight (`y: ±10, x: -20..30, rot: ±8`) or characters drift into the kinetic line / name lines below and read as a render bug. `--ka-split` peaks above 1.6 produce visible chromatic ghost text that reads as a typo, not cinema.
