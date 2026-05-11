# Contact section — design spec

**Date:** 2026-05-12
**Status:** Approved — direction C with sub-variant C (brand-wash on hover) selected via `/preview/contact`.

## Goal

Replace the placeholder `ContactCTA` on the homepage with a real
"Reach out" section: four editorial vertical-stack rows for LinkedIn,
Calendly (Book a meeting), WhatsApp, and Email — each rendered with
its HD brand mark and reactive brand-wash hover.

## Architecture

A single client component, `components/home/ContactSection.tsx`, drops
into the existing homepage flow (between `AboutPreviewPlaceholder` and
the footer, in place of `ContactCTA`). It reads contact endpoints from
the same `api.siteContacts.get` query already used by
`HeroRecruiterRail`, with hard-coded fallbacks for first paint / empty
DB. The four brand marks live in `components/brand/ContactBrandIcons.tsx`
(already created during preview) and ship as inline SVGs in their
authentic colors.

## Row anatomy

```
[ brand mark 40px ]   Label (Inter Medium 17px)            ↗
                      handle / value (Serif italic 14px)
```

- Grid columns: `64px · 1fr · auto`, 28px vertical padding, hairline
  top + bottom borders (`rgba(255,255,255,0.10)`).
- **Hover (brand-wash):**
  - Row background fills with 6% wash of the channel's brand color
    (`<brand>0F` hex alpha).
  - 1px brand-color hairline appears on the left edge.
  - ↗ arrow shifts +3px right / -3px up and recolors to the brand.
  - Smooth 300ms transition on all three.

## Channels

| Key       | Label             | Handle / Value             | Brand color | Mark       |
| --------- | ----------------- | -------------------------- | ----------- | ---------- |
| linkedin  | LinkedIn          | `@siddharthagrawal18`      | `#0A66C2`   | LinkedIn   |
| calendly  | Book a meeting    | `calendly.com/.../30min`   | `#006BFF`   | Calendly   |
| whatsapp  | WhatsApp          | `+91 79775 22907`          | `#25D366`   | WhatsApp   |
| email     | Email             | `siddharth.kiit1@gmail.com`| `#EA4335`   | Gmail (M)  |

All four use `target="_blank" rel="noopener noreferrer"` for outbound
links; email uses `mailto:`; WhatsApp uses `https://wa.me/917977522907`
(country code prefix required by wa.me).

## Section frame

- Eyebrow: `REACH OUT` in mono, letter-spaced 0.34em, white/45%.
- Headline: "Easiest ways in." in editorial serif, large
  (`clamp(32px,4vw,44px)`), light weight, tight tracking.
- Sub-blurb (one line, white/55%): "Pick whichever channel is fastest
  for you — I check all four daily."
- Max-width 820px, centered, padded.

## Data model — `siteContacts` extension

Add two optional fields to the existing `siteContacts` row:

- `whatsappNumber: v.optional(v.string())` — stored as E.164 digits
  (e.g. `"917977522907"`), formatted for display in the component.
- `calendlyUrl: v.optional(v.string())` — full Calendly event URL.

Update:
- `convex/schema.ts` — add the two fields to the `siteContacts` table.
- `convex/siteContacts.ts` — add both to the `upsert` mutation args.
- `lib/defaults/siteContacts.ts` (or seed location) — add defaults.
- `components/admin/AdminEditorContacts.tsx` — add inputs.
- Seed `siteContacts` so production has the values immediately
  (via the temp-mutation pattern used elsewhere in this session).

## Editability

Per `CLAUDE.md`, the section's free copy (eyebrow, headline, blurb,
and each row's label) flows through `EditableText` so each can be
rewritten from `/admin/edit` without touching code. Slots:

- `home` / `contact.eyebrow` → "Reach out"
- `home` / `contact.headline` → "Easiest ways in."
- `home` / `contact.blurb` → "Pick whichever channel is fastest..."
- `home` / `contact.label.linkedin` → "LinkedIn"
- `home` / `contact.label.calendly` → "Book a meeting"
- `home` / `contact.label.whatsapp` → "WhatsApp"
- `home` / `contact.label.email` → "Email"

Handles are derived from `siteContacts` (already structured-data
editable), so they don't need separate slots.

## File changes

- **Create:** `components/home/ContactSection.tsx` (~180 lines)
- **Modify:** `app/page.tsx` (swap `ContactCTA` for `ContactSection`)
- **Modify:** `convex/schema.ts` (add 2 fields to `siteContacts`)
- **Modify:** `convex/siteContacts.ts` (extend `upsert` args)
- **Modify:** `components/admin/AdminEditorContacts.tsx` (add inputs)
- **Delete:** `components/home/ContactCTA.tsx`
- **Delete:** `app/preview/contact/page.tsx` (preview deletion per CLAUDE.md)

## Out of scope

- About section (next task, separate spec).
- Embedding the Calendly widget inline (we link out for now — keeps
  the page light and lets Calendly handle its own UX).
- Per-channel `siteContent` overrides for handles (already covered by
  `siteContacts`).
