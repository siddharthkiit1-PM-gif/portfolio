# Siddharth's Portfolio — Design Spec

**Date:** 2026-05-08
**Status:** Approved (brainstorming complete)
**Author:** Siddharth Agrawal (with Claude as collaborator)
**Project root:** `/Users/siddharthagrawal/portfolio`

---

## 1. Goal

A personal product portfolio that primarily helps **hiring product managers and recruiters** evaluate Siddharth quickly and deeply, and secondarily lets **product customers** try his apps and book a call. The site must feel premium and memorable — a cinematic, spatial WebGL experience inspired by Emergent — while preserving a fast, skimmable path for recruiters who don't want to sit through animation.

Success looks like:

- A senior recruiter lands on the homepage and, within 30 seconds, can either (a) skim to selected work or (b) be drawn into the cinematic experience — both paths feel deliberate.
- Siddharth can add a new project, write a case study, replace a motion video, and publish — entirely from the live site, without touching code or leaving the browser.
- The site loads fast on a mid-range phone, respects reduced-motion preferences, and reads correctly to a screen reader.

## 2. Audience and primary actions

| Audience | Primary action | Surface |
|---|---|---|
| Hiring PMs / recruiters (primary) | Read selected case studies; download résumé; contact | Sticky "Skip to work / Résumé" pill, hero CTA, footer |
| Product customers (secondary) | Try a live product; book a call | Project detail "Try it" CTA; Calendly on `/contact` |
| Peers / collaborators (tertiary) | Read writing; follow socials | `/notes`, footer socials |

## 3. Content shape

- **2–3 hero case studies** — long-form: problem → user insight → decisions → tradeoffs → outcome / metrics, with motion video.
- **Grid of secondary projects** (8–15) — short cards with screenshot/video, role, 2–3 outcome bullets, optional click-through.
- **About / story page** — origin → key bets → philosophy → what I'm doing now.
- **Writing / Notes** — short essays, PM thoughts, lessons.
- **Talks / Press** — talks given, press coverage.
- **Contact** — Calendly embed + email + socials.

The data model keeps case studies as structured JSON sections so a future "Ask Siddharth anything" RAG chatbot can be added without re-shaping content.

## 4. Visual direction

**Spatial / experimental WebGL** with a **cinematic, Emergent-inspired** finish:

- Dark canvas (`#05060a`), conic-gradient WebGL "orb" anchoring the hero, soft animated bloom.
- Display headline with mixed weight (light + medium italic), gradient inline accent.
- Smooth-scroll choreography (Lenis), pinned scroll sequences (GSAP ScrollTrigger), staggered character reveals.
- Autoplaying muted motion-video cards on hero and case studies (Mux HLS).
- Always-on **sticky "Skip to work / Résumé" pill** in the top-right nav as a recruiter escape hatch — non-negotiable.

A reduced-motion media query disables Lenis, freezes the orb, and pauses video. Mobile downgrades the orb to a static SVG and collapses the nav.

## 5. Architecture

```
Browser (Next.js 16 App Router · React 19 · TS · Tailwind v4)
├── R3F WebGL hero scene (custom GLSL shader)
├── Lenis smooth scroll
├── GSAP + ScrollTrigger for pinned scenes
├── Framer Motion for component micro-interactions
├── Tiptap for inline rich-text editing (admin only)
└── Mux Player for motion videos
       ▲                    ▲
       │ realtime queries   │ HTTPS
       ▼                    ▼
Convex Cloud (DB + Auth + File Storage + Functions)
└── Convex Auth: magic link + Google · admin email allowlist

Mux (video transcode + HLS streaming)
Vercel (hosting, CDN, edge ISR for public pages)
```

### Why Convex

- Single mental model with the existing `healthcoach-ai` codebase.
- Realtime subscriptions make inline edits feel instant with no page reload.
- Built-in file storage handles image/video uploads before Mux transcode.
- Type-safe end-to-end (Convex schema → React hooks).

### Stack pin list

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind v4 + CSS variables |
| Component primitives | shadcn/ui |
| 3D | React Three Fiber + drei |
| Scroll | Lenis |
| Motion | GSAP + ScrollTrigger; Framer Motion for micro |
| Editor | Tiptap (StarterKit + Link + Placeholder + custom Gradient mark) |
| Video | Mux (HLS, autoplay, posters) |
| Backend | Convex (DB, auth, storage, functions) |
| Auth | Convex Auth (magic link + Google) with admin email allowlist |
| Deploy | Vercel |
| Package manager | pnpm |
| Tests | Vitest (unit) + Playwright (E2E) |

## 6. Data model (Convex tables)

```ts
// convex/schema.ts (high-level shape)

users: {
  email: string,
  name?: string,
  role: "admin" | "viewer",  // admin === can edit
  createdAt: number,
}

siteContent: {
  page: string,            // "home" | "about" | "contact" | ...
  slot: string,            // "hero.headline" | "hero.subtext" | "hero.statusPill" ...
  valueJson: string,       // Tiptap JSON document
  schemaVersion: number,   // for future migrations
  updatedAt: number,
  updatedBy: Id<"users">,
}
// unique by (page, slot)

projects: {
  slug: string,            // unique
  title: string,
  role: string,            // "PM" | "PM + Designer" | "Founding PM" ...
  year: number,
  summary: string,         // <= 200 chars, used in cards
  status: "draft" | "published",
  isHero: boolean,         // true for the 2-3 featured at top
  order: number,           // manual sort
  coverMediaId?: Id<"media">,
  heroVideoId?: Id<"media">,    // motion video card asset
  links: { label: string, url: string }[],
  metrics: { label: string, value: string }[],   // e.g. "MAU", "120k"
  tags: string[],
}

caseStudies: {
  projectId: Id<"projects">,    // 1:1 with project
  sectionsJson: string,    // Tiptap JSON; contains problem/insight/decisions/outcome blocks
  schemaVersion: number,
  publishedAt?: number,
}

notes: {
  slug: string,
  title: string,
  excerpt: string,
  bodyJson: string,        // Tiptap JSON
  publishedAt?: number,
  tags: string[],
}

talks: {
  title: string,
  venue: string,
  date: number,
  link?: string,
  mediaId?: Id<"media">,
  order: number,
}

media: {
  type: "image" | "video",
  storageId: Id<"_storage">,    // Convex file storage
  muxAssetId?: string,
  muxPlaybackId?: string,
  posterUrl?: string,
  alt: string,
  width?: number,
  height?: number,
  durationSec?: number,
}

settings: {
  key: "site",             // singleton
  resumeUrl: string,
  calendlyUrl: string,
  socials: { platform: string, url: string }[],
  statusPill: string,      // "Open to senior PM roles"
}
```

## 7. Routes and pages

| Route | Purpose | Notes |
|---|---|---|
| `/` | Home | Hero (WebGL orb + editable text + sticky pill) → 3 hero case studies → projects grid teaser → about preview → contact CTA |
| `/work` | Project index | Filter by year/role/tag |
| `/work/[slug]` | Case study detail | Problem / insight / decisions / outcome / metrics; motion video |
| `/about` | Story page | Origin → bets → philosophy → now; portrait + timeline |
| `/notes` | Writing index | List of notes |
| `/notes/[slug]` | Note detail | Tiptap-rendered |
| `/talks` | Talks/press | List |
| `/contact` | Contact | Calendly embed + email + socials |
| `/admin/login` | Auth | Magic link entry |

**Admin mode is not a route.** It is a UI overlay rendered conditionally on every public page when the viewer is authenticated and on the admin allowlist.

## 8. Key components

| Component | Responsibility |
|---|---|
| `HeroOrbScene` | R3F + custom GLSL shader; animated noise + mouse parallax; pauses off-screen |
| `SmoothScrollProvider` | Lenis at root layout; respects `prefers-reduced-motion` |
| `ScrollScene` | Wraps a section in GSAP ScrollTrigger; pinning + progress |
| `EditableText` | Wraps a `(page, slot)` pair; renders Tiptap inline when admin + active, semantic HTML otherwise |
| `EditableMedia` | Drop-to-replace; uploads via Convex storage; for video, kicks off Mux ingest |
| `AdminBar` | Top-left "EDITING · LIVE" pill; "View as visitor" toggle; quick-add menu |
| `StickyResumePill` | Top-right, always present for public visitors |
| `ProjectCard` / `ProjectGrid` | Grid card + container |
| `CaseStudySection` | Renders Tiptap JSON sections with section-aware styling |
| `MotionVideoCard` | Mux Player wrapper; muted autoplay, lazy load, poster |
| `NoteCard`, `TalkRow` | Index components |

## 9. Inline-edit pattern (specific behavior)

- When `useViewer()` returns admin and the URL has no `?preview=visitor` query param:
  - Every `EditableText` and `EditableMedia` shows a dotted ghost outline on hover.
  - Click → solid purple border + Tiptap floating toolbar (Bold, Italic, H1/H2, Link, Gradient mark).
  - `Cmd+S` saves; debounced auto-save after 1.5s of inactivity.
  - Saving calls a Convex mutation that updates `siteContent` (or the relevant table). Realtime subscription refreshes other tabs/users.
- For `EditableMedia`:
  - Drag a file onto the block → upload progress overlay → Convex storage → for video, trigger Mux ingest action → swap `mediaId` on the host record on completion.
- "View as visitor" toggle adds `?preview=visitor` to the URL; affordances hide.
- Public visitors never see any of the above.

## 10. Auth model

- Convex Auth with email magic link as primary, Google OAuth as secondary.
- `users.role === "admin"` is the gate. The first admin is bootstrapped via Convex CLI mutation at setup time using Siddharth's email.
- Adding additional admins (rare) is a Convex mutation callable only by an existing admin.
- Recovery: if the admin email is lost, run the CLI bootstrap mutation again with a new email.

## 11. Performance and accessibility

- Lighthouse targets: **≥90 desktop, ≥85 mobile** on Home and a representative case study.
- WebGL: `dpr` capped at 1.5; scene paused when not in viewport via Intersection Observer; instanced geometry; single shader program.
- Lenis disabled on `prefers-reduced-motion: reduce`.
- Video lazy-loaded below the fold; posters always rendered; Mux HLS streaming.
- Keyboard: skip-to-work link is the first focusable element; focus-visible styles everywhere; semantic landmarks (`header`, `main`, `nav`, `footer`).
- Color contrast: AAA on body text, AA on decorative.
- Mobile: orb downgrades to static SVG hero image at <768px.

## 12. SEO and sharing

- Per-page OG images generated via `next/og` from project/case study/note metadata.
- Sitemap and `robots.txt` generated at build.
- Structured data: `Person` schema on `/about`; `CreativeWork` per project.

## 13. Build phases

Each phase ends in a deployable, working site. Phases are intended as the basis for the implementation plan.

| Phase | Output |
|---|---|
| 0 | Repo + pnpm + Next.js + Tailwind + shadcn + Convex + Vercel deploy. Hello-world page lives at a Vercel URL. |
| 1 | Convex Auth + admin allowlist + `AdminBar` + `EditableText` and `EditableMedia` primitives. |
| 2 | Home page (static layout, no WebGL yet) + `siteContent` table + inline editing of hero copy works end-to-end. |
| 3 | WebGL hero orb + Lenis + GSAP scroll choreography + sticky Skip/Résumé pill. |
| 4 | `projects` schema + admin CRUD + grid + `/work/[slug]` placeholder detail. |
| 5 | `caseStudies` schema + Tiptap section editor + case study render + `MotionVideoCard`. |
| 6 | Media uploads (Convex storage) + Mux integration for video transcode/streaming. |
| 7 | About story page + Notes (writing) + Talks. |
| 8 | Contact page + Calendly embed + socials + résumé download. |
| 9 | SEO (OG images, sitemap, robots) + perf budget pass + a11y audit. |
| 10 | Polish: micro-interactions, copy seed, custom domain, go-live. |

## 14. Testing strategy

- **Unit (Vitest):** slug helpers, Tiptap-to-plaintext extractors, content schema migrators.
- **Convex function tests:** mutations and queries that touch `siteContent`, `projects`, `caseStudies`, `media`.
- **E2E (Playwright):** admin login → edit hero text → publish a project → public render of the same page (incognito).
- **CI gate:** `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:e2e` on every PR.

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| WebGL perf on low-end mobile | Static SVG fallback at <768px and on `prefers-reduced-motion`; perf budget enforced per phase |
| Tiptap content schema drift | `schemaVersion` field on every JSON document; one-shot migration mutations |
| Auth lockout if admin email lost | CLI bootstrap mutation to re-seat admin |
| Mux costs at scale | Cap motion videos at 5 hero spots initially; usage alert at $10/month |
| Scroll-driven UX hides recruiter path | Sticky pill is permanent; "Skip to work" is the first focusable element |
| Inline edits saved to wrong block | `(page, slot)` is unique-indexed; mutation rejects mismatch |

## 16. Out of scope (v1)

- AI "Ask Siddharth anything" chatbot — content shape is RAG-ready; chatbot itself is a v2 phase.
- Multi-author / team CMS — single admin only.
- Public commenting / reactions on case studies.
- i18n — English only.
- A/B testing infrastructure.

## 17. Open items (resolve during implementation)

- Custom domain choice (placeholder: `siddharthagrawal.com`).
- Initial seed content: which 2–3 projects become hero case studies, and which existing motion videos to feature.
- Final headline copy (current placeholder: "I build products people actually use.").
- Whether `/now` page is added (deferred from brainstorming; can be added in Phase 7 with low cost).

---

## Brainstorming summary (locked decisions)

1. Audience: hiring PMs / recruiters (primary), product customers (secondary).
2. Content: hybrid — 2–3 deep hero case studies + grid of secondary projects.
3. Content management: built-in admin panel with **inline edit-in-place** on the live front-end.
4. Visual: spatial WebGL + cinematic Emergent vibe; sticky "Skip to work / Résumé" pill.
5. Motion videos: yes (autoplaying clips). AI chatbot: deferred, but content stays RAG-ready.
6. About: dedicated `/about` story page.
7. Pages: Home, Work + Case Studies, About, Notes, Talks, Contact, Admin.
8. Stack: Next.js 16 + Convex + Vercel + R3F + GSAP + Lenis + Tiptap + Mux.
