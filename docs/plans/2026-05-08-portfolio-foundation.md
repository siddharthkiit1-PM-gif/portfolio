# Portfolio v1 Foundation Implementation Plan (Phases 0–2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployed Next.js + Convex site at `/Users/siddharthagrawal/portfolio` where the admin can log in via magic link, see an admin overlay, and edit the homepage hero copy inline (Tiptap) with realtime persistence.

**Architecture:** Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + shadcn/ui as the front-end. Convex for DB, file storage, auth, and realtime. Tiptap for inline rich-text editing. Deployed on Vercel.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Convex · @convex-dev/auth · Tiptap v3 · Vitest · Playwright · pnpm · Vercel.

**Scope (this plan):** Phases 0, 1, 2 from the spec. Ends with: deployed site, magic-link auth, AdminBar overlay, EditableText + EditableMedia primitives, Home page with editable hero copy stored in `siteContent`.

**Out of scope (later plans):** WebGL hero (Phase 3), projects/case studies (Phase 4–5), media + Mux (Phase 6), about/notes/talks (Phase 7), contact (Phase 8), SEO/perf/polish (Phase 9–10).

**Spec reference:** `/Users/siddharthagrawal/portfolio/docs/specs/2026-05-08-portfolio-design.md`

---

## File structure produced by this plan

```
portfolio/
├─ package.json
├─ pnpm-lock.yaml
├─ tsconfig.json
├─ next.config.ts
├─ postcss.config.mjs
├─ vitest.config.ts
├─ playwright.config.ts
├─ components.json                         # shadcn config
├─ .env.local                              # gitignored, NEXT_PUBLIC_CONVEX_URL etc.
├─ .env.example
├─ app/
│  ├─ layout.tsx                           # root layout, fonts, providers
│  ├─ page.tsx                             # home
│  ├─ globals.css                          # tailwind v4 imports + tokens
│  ├─ providers.tsx                        # ConvexAuthProvider + AdminProvider
│  └─ admin/
│     └─ login/
│        └─ page.tsx                       # magic-link entry
├─ components/
│  ├─ admin/
│  │  ├─ AdminBar.tsx
│  │  └─ AdminProvider.tsx                 # admin-mode context (preview toggle)
│  ├─ editable/
│  │  ├─ EditableText.tsx
│  │  ├─ EditableTextEditor.tsx            # Tiptap-only client island
│  │  ├─ EditableMedia.tsx
│  │  └─ tiptap-extensions.ts
│  ├─ nav/
│  │  ├─ SiteNav.tsx
│  │  └─ StickyResumePill.tsx
│  ├─ home/
│  │  ├─ Hero.tsx
│  │  ├─ HeroCaseStudiesPlaceholder.tsx
│  │  ├─ ProjectGridPlaceholder.tsx
│  │  ├─ AboutPreviewPlaceholder.tsx
│  │  └─ ContactCTA.tsx
│  └─ ui/                                  # shadcn primitives (button, etc.)
├─ lib/
│  ├─ auth/
│  │  └─ useViewer.ts
│  ├─ content/
│  │  ├─ tiptapJson.ts                     # JSON helpers + render fn
│  │  ├─ defaultContent.ts                 # seed values for siteContent
│  │  └─ tiptapJson.test.ts
│  └─ utils/
│     └─ cn.ts
├─ convex/
│  ├─ _generated/                          # auto
│  ├─ schema.ts
│  ├─ auth.config.ts
│  ├─ auth.ts                              # convexAuth() wiring
│  ├─ users.ts                             # admin allowlist mutations + queries
│  ├─ siteContent.ts                       # queries + mutations
│  ├─ media.ts                             # upload URL + create record
│  └─ http.ts                              # auth http routes
├─ tests/
│  └─ e2e/
│     ├─ auth.spec.ts
│     └─ home-edit.spec.ts
└─ docs/
   ├─ specs/2026-05-08-portfolio-design.md
   └─ plans/2026-05-08-portfolio-foundation.md
```

---

## Conventions for every task

- **Working directory:** `/Users/siddharthagrawal/portfolio` for all commands.
- **Package manager:** pnpm. If a step asks to install a package, use `pnpm add <pkg>`.
- **TypeScript:** strict mode, no `any` unless justified inline.
- **Commits:** at the end of every task. Conventional Commits style. Co-author footer present.
- **TDD where logic exists:** unit tests with Vitest, E2E with Playwright. Setup-only tasks use verification commands instead of unit tests (the "test" is the build/run/visit succeeding).
- **Don't break the prior task's verification.** If a task changes a public type, follow-on tasks must keep their assertions matching.

Commit footer for every commit:

```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

# Phase 0 — Bootstrap

End state: a Next.js 16 app on Vercel with Tailwind v4, shadcn/ui, Convex wired, Vitest + Playwright scaffolded, all green on a clean install.

---

### Task 0.1: Initialize Next.js 16 + TypeScript + Tailwind v4 in existing repo

**Files:**
- Create: everything from `pnpm create next-app` into existing `/Users/siddharthagrawal/portfolio` directory (already has `.git`, `.gitignore`, `docs/`)

- [ ] **Step 1: Confirm we're in the right directory and the existing files won't conflict**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && ls -A
```
Expected output should include: `.git`, `.gitignore`, `docs`, `.superpowers`. No `package.json` yet.

- [ ] **Step 2: Run create-next-app into the current directory**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm create next-app@latest . \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --turbopack \
  --import-alias="@/*" \
  --use-pnpm \
  --yes
```

When prompted to overwrite the existing directory contents, accept. The generator will not delete `.git`, `docs/`, or `.superpowers/`.

Expected: a `package.json`, `app/`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `app/globals.css`, `app/page.tsx`, `app/layout.tsx`, and `node_modules/` appear.

- [ ] **Step 3: Verify the dev server runs**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dev
```
Visit `http://localhost:3000` and confirm the default Next.js page renders. Then stop the dev server (Ctrl+C).

- [ ] **Step 4: Replace the default home page with a placeholder we'll build on**

Replace `app/page.tsx` entirely with:

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-3">
        <p className="text-xs tracking-[0.3em] uppercase text-white/50">portfolio · bootstrap</p>
        <h1 className="text-4xl font-light tracking-tight">Hello, world.</h1>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify build passes**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm build
```
Expected: build completes with no errors. The `Hello, world.` route is listed in the build output.

- [ ] **Step 6: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
chore: bootstrap Next.js 16 with Tailwind v4 and TypeScript

Initialized with create-next-app into existing repo (preserved .git,
docs/, and brainstorming artifacts). Dev server and production build
both verified.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 0.2: Install and initialize shadcn/ui

**Files:**
- Create: `components.json`
- Create: `components/ui/button.tsx`
- Modify: `app/globals.css` (shadcn writes CSS variables here)
- Modify: `tsconfig.json` (path alias may be re-checked)

- [ ] **Step 1: Initialize shadcn**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx shadcn@latest init --yes --base-color neutral --css-variables
```

Expected: `components.json` created; `lib/utils.ts` (or `app/globals.css`) updated with CSS variables; tailwind config (or `globals.css` for v4) gets the shadcn tokens.

If the generator wrote `lib/utils.ts`, move/rename it to `lib/utils/cn.ts` (we keep `lib/` namespaced):

```bash
cd /Users/siddharthagrawal/portfolio && mkdir -p lib/utils && [ -f lib/utils.ts ] && mv lib/utils.ts lib/utils/cn.ts || true
```

If the file moved, also update its only export to be re-exported from a barrel — but skip that for now if shadcn references `@/lib/utils`. Confirm where shadcn references it:

```bash
grep -RIn "@/lib/utils" components.json components/
```

If shadcn references `@/lib/utils`, leave the file at `lib/utils.ts`. Otherwise move it. Pick whichever keeps shadcn working.

- [ ] **Step 2: Add the button primitive**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx shadcn@latest add button --yes
```

Expected: `components/ui/button.tsx` is created.

- [ ] **Step 3: Verify imports work in a small test render**

Replace `app/page.tsx` with:

```tsx
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <p className="text-xs tracking-[0.3em] uppercase text-white/50">portfolio · bootstrap</p>
        <h1 className="text-4xl font-light tracking-tight">Hello, world.</h1>
        <Button variant="secondary">shadcn ok</Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Build and visually verify**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm build && pnpm dev
```
Visit `http://localhost:3000` and confirm the button renders styled. Stop dev server.

- [ ] **Step 5: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
chore: initialize shadcn/ui with button primitive

Sets up CSS variables and base components/ui layout for downstream
admin/editable components.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 0.3: Install and initialize Convex

**Files:**
- Create: `convex/_generated/` (auto)
- Create: `convex/schema.ts`
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`
- Modify: `.env.local`, `.env.example`

- [ ] **Step 1: Install Convex**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm add convex
```

- [ ] **Step 2: Initialize a Convex deployment**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx convex dev --once --configure=new --team siddharth-agrawal-c9f82
```

When prompted for project name, enter: `portfolio`.

This creates: `convex/` directory, `convex/_generated/`, writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`, writes `CONVEX_DEPLOYMENT` to `.env.local`.

If the team flag fails (different team handle), re-run without `--team`:
```bash
pnpm dlx convex dev --once --configure=new
```
and pick the team interactively.

- [ ] **Step 3: Add an empty schema with a smoke-test table**

Create `convex/schema.ts`:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // smoke-test table; used only by Task 0.3 verification.
  // Will be removed in Task 1.1 when the real schema lands.
  __smokeTest: defineTable({
    note: v.string(),
  }),
});
```

- [ ] **Step 4: Push the schema and verify**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx convex dev --once
```

Expected: schema deploys without error; the `__smokeTest` table appears in the dashboard.

- [ ] **Step 5: Add the React provider**

Create `app/providers.tsx`:

```tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

Update `app/layout.tsx`. Replace the file contents with:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Siddharth Agrawal — Portfolio",
  description: "Product manager and builder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Add `.env.example` and confirm `.env.local` is gitignored**

Create `.env.example`:

```
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=
CONVEX_SITE_URL=
NEXTAUTH_SECRET=
ADMIN_BOOTSTRAP_EMAIL=
```

Verify `.env.local` is ignored:
```bash
cd /Users/siddharthagrawal/portfolio && git check-ignore .env.local
```
Expected: prints `.env.local`.

- [ ] **Step 7: Build to confirm Convex provider compiles**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm build
```
Expected: build passes with no Convex import errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
chore: initialize Convex with empty schema and React provider

Creates the convex/ directory, deploys an empty smoke-test schema, and
wires ConvexProvider into the app layout. Real tables added in Phase 1.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 0.4: Add Vitest for unit tests and Playwright for E2E

**Files:**
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`
- Create: `lib/utils/cn.test.ts` (or similar smoke unit test)
- Modify: `package.json` (scripts)

- [ ] **Step 1: Install dev deps**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

- [ ] **Step 2: Install Playwright browsers**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx playwright install chromium --with-deps
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "tests/e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Configure Playwright**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 5: Add test scripts to package.json**

Open `package.json` and add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"typecheck": "tsc --noEmit"
```

(Keep existing `dev`, `build`, `start`, `lint`.)

- [ ] **Step 6: Write a failing unit test**

Create `lib/utils/cn.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and dedupes tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
```

(If shadcn placed `cn` at `@/lib/utils/cn`, change the import accordingly. Verify by reading `components/ui/button.tsx` for the existing import path and match it.)

- [ ] **Step 7: Run unit tests**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm test
```
Expected: 1 passed.

- [ ] **Step 8: Write a failing E2E smoke test**

Create `tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hello, world." })).toBeVisible();
});
```

- [ ] **Step 9: Run E2E**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm test:e2e
```
Expected: 1 passed (Playwright spins up dev server, hits `/`, finds the heading).

- [ ] **Step 10: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
chore: add Vitest and Playwright with smoke tests

Vitest runs JSDOM unit tests; Playwright runs against local dev server.
Both pass on the bootstrap home page.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 0.5: First Vercel deploy

**Files:**
- Create: `vercel.json` (optional, only if defaults need overriding)

- [ ] **Step 1: Link the project to Vercel**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx vercel link --yes
```

Pick the personal scope when prompted. Project name: `portfolio`.

- [ ] **Step 2: Set environment variables on Vercel from local `.env.local`**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx vercel env pull .env.vercel.tmp
```

If `.env.vercel.tmp` is empty (fresh project), push your local Convex URL:

```bash
cd /Users/siddharthagrawal/portfolio && \
  source .env.local && \
  pnpm dlx vercel env add NEXT_PUBLIC_CONVEX_URL production <<< "$NEXT_PUBLIC_CONVEX_URL" && \
  pnpm dlx vercel env add NEXT_PUBLIC_CONVEX_URL preview <<< "$NEXT_PUBLIC_CONVEX_URL" && \
  pnpm dlx vercel env add NEXT_PUBLIC_CONVEX_URL development <<< "$NEXT_PUBLIC_CONVEX_URL"
```

Then remove the temp file:
```bash
rm -f .env.vercel.tmp
```

- [ ] **Step 3: Deploy a preview**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx vercel
```

Expected: a preview URL is printed (e.g. `https://portfolio-xxx.vercel.app`).

- [ ] **Step 4: Smoke-test the preview**

Visit the preview URL. Confirm "Hello, world." renders and the shadcn button is visible.

- [ ] **Step 5: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit --allow-empty -m "$(cat <<'EOF'
chore: link project to Vercel and ship first preview

Project linked to Vercel; NEXT_PUBLIC_CONVEX_URL set across all env
scopes. Preview deploy verified.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

# Phase 1 — Auth + Admin primitives

End state: magic-link sign-in works against Convex Auth; only emails on the admin allowlist get `role: "admin"`; an `AdminBar` overlay is visible only to admins; reusable `EditableText` and `EditableMedia` primitives exist with unit tests; "View as visitor" preview toggle hides the affordances.

---

### Task 1.1: Real Convex schema (users, siteContent, media, settings)

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Replace `convex/schema.ts` with the real shape**

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("viewer")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  siteContent: defineTable({
    page: v.string(),               // "home" | "about" | ...
    slot: v.string(),               // "hero.headline" | ...
    valueJson: v.string(),          // Tiptap JSON serialized
    schemaVersion: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_page_slot", ["page", "slot"]),

  media: defineTable({
    type: v.union(v.literal("image"), v.literal("video")),
    storageId: v.id("_storage"),
    muxAssetId: v.optional(v.string()),
    muxPlaybackId: v.optional(v.string()),
    posterUrl: v.optional(v.string()),
    alt: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationSec: v.optional(v.number()),
    createdAt: v.number(),
  }),

  settings: defineTable({
    key: v.literal("site"),
    resumeUrl: v.string(),
    calendlyUrl: v.string(),
    socials: v.array(v.object({ platform: v.string(), url: v.string() })),
    statusPill: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
```

- [ ] **Step 2: Push the schema**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx convex dev --once
```

Expected: schema deploys; the previous `__smokeTest` table is dropped (Convex will warn — accept).

- [ ] **Step 3: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add convex/schema.ts && git commit -m "$(cat <<'EOF'
feat(convex): add users, siteContent, media, settings tables

Replaces smoke-test schema with the real Phase 1 data model from the
spec. Indexes added for email lookup, (page, slot) pair, and settings
singleton.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.2: Install and configure Convex Auth (magic link)

**Files:**
- Create: `convex/auth.ts`
- Create: `convex/auth.config.ts`
- Create: `convex/http.ts`
- Modify: `app/providers.tsx`

- [ ] **Step 1: Install packages**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm add @convex-dev/auth @auth/core
```

- [ ] **Step 2: Generate auth secret**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx convex env set JWT_PRIVATE_KEY "$(node -e "const c=require('crypto');const k=c.generateKeyPairSync('rsa',{modulusLength:2048});console.log(k.privateKey.export({type:'pkcs8',format:'pem'}))")"
```

Then derive the public JWKS (Convex CLI helper):
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx @convex-dev/auth
```

This sets `JWKS` env on Convex automatically. If the CLI prompts for a site URL, use `http://localhost:3000` for now.

- [ ] **Step 3: Create `convex/auth.config.ts`**

```ts
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
};
```

- [ ] **Step 4: Create `convex/auth.ts` with magic-link provider**

```ts
import { convexAuth } from "@convex-dev/auth/server";
import { Resend } from "@convex-dev/auth/providers/Resend";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      from: process.env.AUTH_EMAIL_FROM ?? "noreply@example.com",
    }),
  ],
});
```

- [ ] **Step 5: Wire HTTP routes**

Create `convex/http.ts`:

```ts
import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

export default http;
```

- [ ] **Step 6: Set Resend env vars on Convex**

User must obtain a Resend API key (free tier OK). Then:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx convex env set AUTH_RESEND_KEY "<resend_api_key>"
cd /Users/siddharthagrawal/portfolio && pnpm dlx convex env set AUTH_EMAIL_FROM "noreply@<your-domain>"
cd /Users/siddharthagrawal/portfolio && pnpm dlx convex env set CONVEX_SITE_URL "http://localhost:3000"
```

If the user doesn't have a domain yet, use Resend's onboarding sandbox sender or skip by stubbing `AUTH_EMAIL_FROM=onboarding@resend.dev`.

- [ ] **Step 7: Push Convex with new auth wiring**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx convex dev --once
```
Expected: deploys cleanly. Auth tables (`authSessions`, etc.) appear.

- [ ] **Step 8: Wrap React tree in `ConvexAuthNextjsProvider`**

Replace `app/providers.tsx`:

```tsx
"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
```

- [ ] **Step 9: Add Next.js middleware for auth**

Create `middleware.ts` at the project root:

```ts
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

export default convexAuthNextjsMiddleware();

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 10: Build to verify auth wiring compiles**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm build
```
Expected: build succeeds.

- [ ] **Step 11: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(auth): wire Convex Auth with magic-link (Resend)

Adds auth.ts, http.ts, middleware.ts, and replaces ConvexProvider with
ConvexAuthNextjsProvider. JWT key + Resend creds set on Convex env.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.3: Admin allowlist + post-sign-in user record

**Files:**
- Create: `convex/users.ts`

- [ ] **Step 1: Write the failing unit test**

Create `convex/users.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isAdminEmail } from "./users";

describe("isAdminEmail", () => {
  it("returns true for an email on the allowlist", () => {
    expect(isAdminEmail("siddharth@example.com", ["siddharth@example.com"])).toBe(true);
  });
  it("is case-insensitive on local part and domain", () => {
    expect(isAdminEmail("Siddharth@Example.com", ["siddharth@example.com"])).toBe(true);
  });
  it("returns false otherwise", () => {
    expect(isAdminEmail("intruder@example.com", ["siddharth@example.com"])).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, confirm failure**

Run: `pnpm test convex/users.test.ts`
Expected: FAIL (`isAdminEmail` not exported).

- [ ] **Step 3: Implement `convex/users.ts`**

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/** Pure helper, exported for unit tests. */
export function isAdminEmail(email: string, allowlist: string[]): boolean {
  const norm = email.trim().toLowerCase();
  return allowlist.some((entry) => entry.trim().toLowerCase() === norm);
}

function getAllowlist(): string[] {
  const raw = process.env.ADMIN_ALLOWLIST ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Called from the front-end after sign-in to ensure a `users` row exists. */
export const ensureUserRecord = mutation({
  args: { email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    const role = isAdminEmail(args.email, getAllowlist()) ? "admin" : "viewer";

    if (existing) {
      await ctx.db.patch(existing._id, { role, name: args.name ?? existing.name });
      return existing._id;
    }
    return ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      name: args.name,
      role,
      createdAt: Date.now(),
    });
  },
});

/** Returns the current authenticated user record, or null. */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) return null;
    // The auth integration stores its own users table; we mirror via email.
    // Look up our app-level row.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;
    const row = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();
    return row;
  },
});
```

- [ ] **Step 4: Run unit test, confirm pass**

Run: `pnpm test convex/users.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Set the admin allowlist env var on Convex**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx convex env set ADMIN_ALLOWLIST "siddharth@example.com"
```

Replace with the real email. Multiple emails: `"a@x.com,b@x.com"`.

- [ ] **Step 6: Push Convex and verify deploy**

Run: `pnpm dlx convex dev --once`
Expected: deploys clean.

- [ ] **Step 7: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(auth): admin allowlist via env + ensureUserRecord mutation

Pure isAdminEmail helper has unit tests. ensureUserRecord upserts the
users row with role derived from ADMIN_ALLOWLIST. currentUser query
returns the app-level user for the authed session.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.4: `/admin/login` magic-link page

**Files:**
- Create: `app/admin/login/page.tsx`

- [ ] **Step 1: Implement the login page**

```tsx
"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await signIn("resend", { email });
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Sign-in failed");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-1">
          <p className="text-xs tracking-[0.3em] uppercase text-white/50">admin</p>
          <h1 className="text-3xl font-light tracking-tight">Sign in</h1>
        </div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-white/30"
        />
        <Button type="submit" disabled={status === "sending"} className="w-full">
          {status === "sending" ? "Sending…" : "Send magic link"}
        </Button>
        {status === "sent" && (
          <p className="text-sm text-emerald-400">Check your email for the sign-in link.</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Build to confirm**

Run: `pnpm build`
Expected: success.

- [ ] **Step 3: Manual test**

Run dev server (`pnpm dev` in one terminal, `pnpm dlx convex dev` in another). Visit `/admin/login`. Enter the allowlisted email. Confirm a magic-link email arrives in inbox or Resend dashboard. Click the link. You should be returned to the site, authenticated.

- [ ] **Step 4: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(admin): add /admin/login magic-link form

Calls signIn('resend', { email }) and renders status messaging. Styled
to match the dark portfolio palette.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.5: `useViewer` hook + AdminProvider context

**Files:**
- Create: `lib/auth/useViewer.ts`
- Create: `components/admin/AdminProvider.tsx`
- Modify: `app/providers.tsx`

- [ ] **Step 1: Implement `useViewer`**

Create `lib/auth/useViewer.ts`:

```ts
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type Viewer =
  | { state: "loading" }
  | { state: "anonymous" }
  | { state: "authenticated"; isAdmin: boolean; email: string; name?: string };

export function useViewer(): Viewer {
  const user = useQuery(api.users.currentUser);
  if (user === undefined) return { state: "loading" };
  if (user === null) return { state: "anonymous" };
  return {
    state: "authenticated",
    isAdmin: user.role === "admin",
    email: user.email,
    name: user.name,
  };
}
```

- [ ] **Step 2: Implement AdminProvider (preview-mode toggle)**

Create `components/admin/AdminProvider.tsx`:

```tsx
"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { useViewer } from "@/lib/auth/useViewer";

type AdminContextValue = {
  /** True when viewer is admin AND not in visitor-preview mode. */
  isEditing: boolean;
  /** Toggle visitor-preview mode (admins only). */
  togglePreview: () => void;
  previewing: boolean;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const viewer = useViewer();
  const [previewing, setPreviewing] = useState(false);

  const value = useMemo<AdminContextValue>(() => {
    const isAdmin = viewer.state === "authenticated" && viewer.isAdmin;
    return {
      isEditing: isAdmin && !previewing,
      previewing,
      togglePreview: () => setPreviewing((p) => !p),
    };
  }, [viewer, previewing]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
```

- [ ] **Step 3: Wrap providers**

Replace `app/providers.tsx`:

```tsx
"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { AdminProvider } from "@/components/admin/AdminProvider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      <AdminProvider>{children}</AdminProvider>
    </ConvexAuthNextjsProvider>
  );
}
```

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(admin): add useViewer hook and AdminProvider context

useViewer returns loading/anonymous/authenticated. AdminProvider
exposes isEditing (admin && !previewing) and a togglePreview action.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.6: AdminBar component

**Files:**
- Create: `components/admin/AdminBar.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the failing render test**

Create `components/admin/AdminBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminBar } from "./AdminBar";

vi.mock("./AdminProvider", () => ({
  useAdmin: () => ({
    isEditing: true,
    previewing: false,
    togglePreview: vi.fn(),
  }),
}));

describe("AdminBar", () => {
  it("renders an EDITING pill when admin is editing", () => {
    render(<AdminBar />);
    expect(screen.getByText(/editing/i)).toBeInTheDocument();
  });

  it("renders View as visitor button", () => {
    render(<AdminBar />);
    expect(screen.getByRole("button", { name: /view as visitor/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, confirm failure**

Run: `pnpm test components/admin/AdminBar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `AdminBar`**

Create `components/admin/AdminBar.tsx`:

```tsx
"use client";

import { useAdmin } from "./AdminProvider";

export function AdminBar() {
  const { isEditing, previewing, togglePreview } = useAdmin();

  // Only render when admin (editing OR previewing).
  // Anonymous users and non-admins see nothing.
  if (!isEditing && !previewing) return null;

  return (
    <div className="fixed top-3 left-3 z-50 flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-400 px-3 py-1.5 text-[10px] font-semibold tracking-widest text-black">
        <span className="size-1.5 rounded-full bg-black" />
        {isEditing ? "EDITING · LIVE" : "PREVIEW · VISITOR"}
      </span>
      <button
        type="button"
        onClick={togglePreview}
        className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] text-white/80 backdrop-blur hover:bg-white/10"
      >
        {previewing ? "Resume editing" : "View as visitor"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test, confirm pass**

Run: `pnpm test components/admin/AdminBar.test.tsx`
Expected: 2 passed.

- [ ] **Step 5: Mount AdminBar in the root layout**

Edit `app/layout.tsx`. Replace its body to include the bar:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AdminBar } from "@/components/admin/AdminBar";

export const metadata: Metadata = {
  title: "Siddharth Agrawal — Portfolio",
  description: "Product manager and builder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white">
        <Providers>
          <AdminBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Build**

Run: `pnpm build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(admin): AdminBar overlay with View-as-visitor toggle

Pinned top-left; visible only to admins; toggles AdminProvider preview
state to hide editing affordances.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.7: siteContent queries and mutations

**Files:**
- Create: `convex/siteContent.ts`

- [ ] **Step 1: Implement query + mutation**

```ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: { page: v.string(), slot: v.string() },
  handler: async (ctx, { page, slot }) => {
    const row = await ctx.db
      .query("siteContent")
      .withIndex("by_page_slot", (q) => q.eq("page", page).eq("slot", slot))
      .unique();
    return row;
  },
});

export const upsert = mutation({
  args: {
    page: v.string(),
    slot: v.string(),
    valueJson: v.string(),
    schemaVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("No identity email");

    const userRow = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();
    if (!userRow || userRow.role !== "admin") {
      throw new Error("Forbidden: admin only");
    }

    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_page_slot", (q) => q.eq("page", args.page).eq("slot", args.slot))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        valueJson: args.valueJson,
        schemaVersion: args.schemaVersion,
        updatedAt: Date.now(),
        updatedBy: userRow._id,
      });
      return existing._id;
    }
    return ctx.db.insert("siteContent", {
      page: args.page,
      slot: args.slot,
      valueJson: args.valueJson,
      schemaVersion: args.schemaVersion,
      updatedAt: Date.now(),
      updatedBy: userRow._id,
    });
  },
});
```

- [ ] **Step 2: Push Convex**

Run: `pnpm dlx convex dev --once`
Expected: clean deploy.

- [ ] **Step 3: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add convex/siteContent.ts && git commit -m "$(cat <<'EOF'
feat(convex): siteContent.get query and admin-only upsert mutation

Upsert is gated on users.role === 'admin'; non-admins get a Forbidden
error. Query is public (read-only for anonymous visitors).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.8: Tiptap JSON helpers + render utility

**Files:**
- Create: `lib/content/tiptapJson.ts`
- Create: `lib/content/tiptapJson.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/content/tiptapJson.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { tiptapToPlainText, plainTextToTiptap, CURRENT_SCHEMA_VERSION } from "./tiptapJson";

describe("tiptapJson", () => {
  it("round-trips plain text", () => {
    const json = plainTextToTiptap("Hello, world.");
    expect(tiptapToPlainText(json)).toBe("Hello, world.");
  });

  it("returns empty string for null/empty doc", () => {
    expect(tiptapToPlainText(null)).toBe("");
    expect(tiptapToPlainText({ type: "doc", content: [] })).toBe("");
  });

  it("exports current schema version", () => {
    expect(CURRENT_SCHEMA_VERSION).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

`pnpm test lib/content/tiptapJson.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
export const CURRENT_SCHEMA_VERSION = 1 as const;

/** Minimal Tiptap JSON shape we care about. */
export type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
};

export function plainTextToTiptap(text: string): TiptapNode {
  return {
    type: "doc",
    content: text
      ? [{ type: "paragraph", content: [{ type: "text", text }] }]
      : [],
  };
}

export function tiptapToPlainText(node: TiptapNode | null | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (!node.content) return "";
  return node.content.map(tiptapToPlainText).join("");
}
```

- [ ] **Step 4: Run, confirm pass**

`pnpm test lib/content/tiptapJson.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add lib/content/ && git commit -m "$(cat <<'EOF'
feat(content): tiptap JSON helpers and schema version constant

plainTextToTiptap + tiptapToPlainText with round-trip + null-safety
tests. CURRENT_SCHEMA_VERSION pinned at 1.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.9: EditableText (read mode)

**Files:**
- Create: `components/editable/EditableText.tsx`

- [ ] **Step 1: Implement read-only renderer**

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAdmin } from "@/components/admin/AdminProvider";
import {
  CURRENT_SCHEMA_VERSION,
  plainTextToTiptap,
  tiptapToPlainText,
  type TiptapNode,
} from "@/lib/content/tiptapJson";
import { useState, lazy, Suspense } from "react";

const EditableTextEditor = lazy(() =>
  import("./EditableTextEditor").then((m) => ({ default: m.EditableTextEditor })),
);

type Props = {
  page: string;
  slot: string;
  /** Fallback content if no row exists yet. */
  fallback: string;
  /** Render the resolved text/JSON. */
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  /** Single-line mode disables paragraph breaks in the editor. */
  singleLine?: boolean;
};

export function EditableText({
  page,
  slot,
  fallback,
  as: Tag = "span",
  className,
  singleLine = false,
}: Props) {
  const row = useQuery(api.siteContent.get, { page, slot });
  const { isEditing } = useAdmin();
  const [active, setActive] = useState(false);

  const json: TiptapNode =
    row?.valueJson != null
      ? (JSON.parse(row.valueJson) as TiptapNode)
      : plainTextToTiptap(fallback);

  if (isEditing && active) {
    return (
      <Suspense fallback={<Tag className={className}>{tiptapToPlainText(json)}</Tag>}>
        <EditableTextEditor
          page={page}
          slot={slot}
          initialJson={json}
          schemaVersion={CURRENT_SCHEMA_VERSION}
          singleLine={singleLine}
          onClose={() => setActive(false)}
          className={className}
        />
      </Suspense>
    );
  }

  return (
    <Tag
      className={[
        className,
        isEditing
          ? "cursor-text outline outline-1 outline-dashed outline-transparent hover:outline-violet-400/60 rounded-sm transition"
          : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={isEditing ? () => setActive(true) : undefined}
    >
      {tiptapToPlainText(json)}
    </Tag>
  );
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: build will fail because `EditableTextEditor` doesn't exist yet — this is expected; Task 1.10 implements it. To unblock the build, create a stub now:

Create `components/editable/EditableTextEditor.tsx` (stub):

```tsx
"use client";

import type { TiptapNode } from "@/lib/content/tiptapJson";

export function EditableTextEditor(props: {
  page: string;
  slot: string;
  initialJson: TiptapNode;
  schemaVersion: number;
  singleLine: boolean;
  onClose: () => void;
  className?: string;
}) {
  return <span className={props.className}>{/* stub — replaced in Task 1.10 */}</span>;
}
```

Run `pnpm build` again. Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add components/editable/ && git commit -m "$(cat <<'EOF'
feat(editable): EditableText read-mode + click-to-activate

Reads from siteContent.get, falls back to provided fallback string.
Lazy-loads EditableTextEditor (Tiptap bundle) on click in admin mode.
Stub editor committed; real Tiptap implementation in Task 1.10.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.10: EditableTextEditor — Tiptap with auto-save

**Files:**
- Create: `components/editable/tiptap-extensions.ts`
- Modify: `components/editable/EditableTextEditor.tsx`

- [ ] **Step 1: Install Tiptap**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
```

- [ ] **Step 2: Build extensions array**

Create `components/editable/tiptap-extensions.ts`:

```ts
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

export function buildExtensions(opts: { singleLine: boolean; placeholder?: string }) {
  return [
    StarterKit.configure({
      heading: opts.singleLine ? false : { levels: [1, 2, 3] },
      hardBreak: false,
    }),
    Link.configure({ openOnClick: false }),
    Placeholder.configure({ placeholder: opts.placeholder ?? "" }),
  ];
}
```

- [ ] **Step 3: Replace the stub editor with the real Tiptap implementation**

Replace `components/editable/EditableTextEditor.tsx`:

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { TiptapNode } from "@/lib/content/tiptapJson";
import { buildExtensions } from "./tiptap-extensions";

type Props = {
  page: string;
  slot: string;
  initialJson: TiptapNode;
  schemaVersion: number;
  singleLine: boolean;
  onClose: () => void;
  className?: string;
};

const AUTOSAVE_MS = 1500;

export function EditableTextEditor({
  page,
  slot,
  initialJson,
  schemaVersion,
  singleLine,
  onClose,
  className,
}: Props) {
  const upsert = useMutation(api.siteContent.upsert);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: buildExtensions({ singleLine }),
    content: initialJson,
    autofocus: "end",
    editorProps: {
      attributes: {
        class:
          "outline-none focus:outline-none rounded-md border border-violet-400 bg-violet-400/5 p-3 -m-3",
      },
    },
    onUpdate({ editor }) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const json = editor.getJSON() as unknown as TiptapNode;
        void upsert({
          page,
          slot,
          valueJson: JSON.stringify(json),
          schemaVersion,
        });
      }, AUTOSAVE_MS);
    },
  });

  // Save immediately and exit on Cmd/Ctrl+S or blur out.
  useEffect(() => {
    if (!editor) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        const json = editor!.getJSON() as unknown as TiptapNode;
        void upsert({ page, slot, valueJson: JSON.stringify(json), schemaVersion });
        onClose();
      }
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, upsert, page, slot, schemaVersion, onClose]);

  return <EditorContent editor={editor} className={className} />;
}
```

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(editable): Tiptap-backed EditableTextEditor with debounced auto-save

StarterKit + Link + Placeholder. Auto-saves 1.5s after last keystroke;
Cmd/Ctrl+S commits immediately and exits; Escape exits without saving.
singleLine config disables headings.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.11: media upload URL + EditableMedia primitive

**Files:**
- Create: `convex/media.ts`
- Create: `components/editable/EditableMedia.tsx`

- [ ] **Step 1: Convex mutations for media**

Create `convex/media.ts`:

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAdmin(ctx: any) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) throw new Error("Not authenticated");
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("No identity email");
  const userRow = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email!.toLowerCase()))
    .unique();
  if (!userRow || userRow.role !== "admin") throw new Error("Forbidden");
  return userRow;
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const createRecord = mutation({
  args: {
    storageId: v.id("_storage"),
    type: v.union(v.literal("image"), v.literal("video")),
    alt: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("media", {
      storageId: args.storageId,
      type: args.type,
      alt: args.alt,
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("media") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row) return null;
    const url = await ctx.storage.getUrl(row.storageId);
    return { ...row, url };
  },
});
```

- [ ] **Step 2: Push Convex**

`pnpm dlx convex dev --once`. Expected clean.

- [ ] **Step 3: EditableMedia primitive (image-only for now)**

Create `components/editable/EditableMedia.tsx`:

```tsx
"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAdmin } from "@/components/admin/AdminProvider";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

type Props = {
  /** Current media record id, or null. */
  mediaId: Id<"media"> | null;
  /** Called after a new media record is created. Persist the new id upstream. */
  onChange: (id: Id<"media">) => void;
  /** Fallback element when no media exists. */
  placeholder: React.ReactNode;
  className?: string;
  alt?: string;
};

export function EditableMedia({ mediaId, onChange, placeholder, className, alt = "" }: Props) {
  const { isEditing } = useAdmin();
  const media = useQuery(api.media.get, mediaId ? { id: mediaId } : "skip");
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createRecord = useMutation(api.media.createRecord);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, { method: "POST", body: file, headers: { "Content-Type": file.type } });
      const { storageId } = (await res.json()) as { storageId: string };
      const id = await createRecord({
        storageId: storageId as Id<"_storage">,
        type: file.type.startsWith("video/") ? "video" : "image",
        alt,
      });
      onChange(id);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!isEditing) return;
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  return (
    <div
      onDragOver={isEditing ? (e) => e.preventDefault() : undefined}
      onDrop={onDrop}
      className={[
        className,
        isEditing ? "outline outline-1 outline-dashed outline-violet-400/60 relative" : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isEditing && (
        <div className="absolute right-2 top-2 z-10 rounded bg-violet-400 px-2 py-0.5 text-[9px] font-semibold text-black">
          {uploading ? "UPLOADING…" : "↑ Drop file to replace"}
        </div>
      )}
      {media?.url ? (
        media.type === "image" ? (
          <img src={media.url} alt={media.alt} className="block w-full h-full object-cover" />
        ) : (
          <video src={media.url} muted autoPlay loop playsInline className="block w-full h-full object-cover" />
        )
      ) : (
        placeholder
      )}
    </div>
  );
}
```

- [ ] **Step 4: Build**

`pnpm build`. Expected clean.

- [ ] **Step 5: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(editable): EditableMedia primitive + media Convex API

Drag-and-drop file upload to Convex storage; creates media record;
calls onChange. Image and video both supported (Mux integration in
Phase 6 will replace the raw <video> for HLS streaming).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

# Phase 2 — Home page with inline editing

End state: a public Home page with hero + nav + sticky pill + placeholder grid sections; admins can click the headline / status pill / subtext / CTA labels and edit them inline; saves persist; visitors see only the rendered content. Default content is seeded via a Convex script the first time the site runs.

---

### Task 2.1: Default home content seeder

**Files:**
- Create: `lib/content/defaultContent.ts`
- Create: `convex/seed.ts`

- [ ] **Step 1: Default content map**

Create `lib/content/defaultContent.ts`:

```ts
import { plainTextToTiptap, CURRENT_SCHEMA_VERSION } from "./tiptapJson";

type Seed = {
  page: string;
  slot: string;
  text: string;
};

export const HOME_DEFAULTS: Seed[] = [
  { page: "home", slot: "hero.eyebrow", text: "PRODUCT MANAGER · BUILDER · 2018 — NOW" },
  { page: "home", slot: "hero.headlineTop", text: "I build products" },
  { page: "home", slot: "hero.headlineBottom", text: "people actually use." },
  {
    page: "home",
    slot: "hero.subtext",
    text:
      "PM at the intersection of AI, health, and consumer. Twelve products shipped, three from zero. Currently building healthcoach-ai. This site is the working file.",
  },
  { page: "home", slot: "hero.ctaPrimary", text: "View selected work →" },
  { page: "home", slot: "hero.ctaSecondary", text: "Book a call" },
  { page: "home", slot: "hero.statusPill", text: "Open to senior PM roles" },
];

export const DEFAULT_CONTENT_PAYLOAD = HOME_DEFAULTS.map((s) => ({
  page: s.page,
  slot: s.slot,
  valueJson: JSON.stringify(plainTextToTiptap(s.text)),
  schemaVersion: CURRENT_SCHEMA_VERSION,
}));
```

- [ ] **Step 2: Convex seeder**

Create `convex/seed.ts`:

```ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/** Seed siteContent rows that don't exist yet. Idempotent. */
export const seedSiteContent = internalMutation({
  args: {
    rows: v.array(
      v.object({
        page: v.string(),
        slot: v.string(),
        valueJson: v.string(),
        schemaVersion: v.number(),
      }),
    ),
  },
  handler: async (ctx, { rows }) => {
    let inserted = 0;
    for (const row of rows) {
      const existing = await ctx.db
        .query("siteContent")
        .withIndex("by_page_slot", (q) => q.eq("page", row.page).eq("slot", row.slot))
        .unique();
      if (!existing) {
        await ctx.db.insert("siteContent", {
          ...row,
          updatedAt: Date.now(),
        });
        inserted++;
      }
    }
    return { inserted, total: rows.length };
  },
});
```

- [ ] **Step 3: Push Convex**

`pnpm dlx convex dev --once`. Expected clean.

- [ ] **Step 4: Run the seed once via the Convex CLI**

Run:
```bash
cd /Users/siddharthagrawal/portfolio && cat > /tmp/seed-payload.json <<'EOF'
{ "rows": [] }
EOF
node -e "const {DEFAULT_CONTENT_PAYLOAD} = require('./lib/content/defaultContent.ts'); process.stdout.write(JSON.stringify({rows: DEFAULT_CONTENT_PAYLOAD}))" > /tmp/seed-payload.json 2>/dev/null || true
```

The above tries to resolve the TS file directly; if Node can't import TS, fall back to writing the JSON manually:

```bash
cd /Users/siddharthagrawal/portfolio && pnpm tsx -e "import('./lib/content/defaultContent').then(m => process.stdout.write(JSON.stringify({rows: m.DEFAULT_CONTENT_PAYLOAD})))" > /tmp/seed-payload.json
```

(If `tsx` is not installed, install it: `pnpm add -D tsx`.)

Then call the internal mutation:
```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx convex run seed:seedSiteContent "$(cat /tmp/seed-payload.json)"
```

Expected output: `{ inserted: 7, total: 7 }` (or `inserted: 0` if already seeded).

- [ ] **Step 5: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(content): default home content seeder

HOME_DEFAULTS map and idempotent seedSiteContent internal mutation.
Run once at setup time; safe to re-run.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.2: SiteNav and StickyResumePill

**Files:**
- Create: `components/nav/SiteNav.tsx`
- Create: `components/nav/StickyResumePill.tsx`

- [ ] **Step 1: StickyResumePill (uses settings.resumeUrl with hardcoded fallback for v1)**

Create `components/nav/StickyResumePill.tsx`:

```tsx
"use client";

export function StickyResumePill({
  resumeHref = "#",
  workHref = "#work",
}: {
  resumeHref?: string;
  workHref?: string;
}) {
  return (
    <div className="flex gap-2">
      <a
        href={workHref}
        className="rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs text-white/85 backdrop-blur hover:bg-white/10"
      >
        ↓ Skip to work
      </a>
      <a
        href={resumeHref}
        className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-white/90"
      >
        Résumé
      </a>
    </div>
  );
}
```

- [ ] **Step 2: SiteNav**

Create `components/nav/SiteNav.tsx`:

```tsx
import Link from "next/link";
import { StickyResumePill } from "./StickyResumePill";

export function SiteNav() {
  return (
    <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-5">
      <Link href="/" className="flex items-center gap-2.5 text-sm">
        <span
          aria-hidden
          className="inline-block size-5 rounded-md bg-gradient-to-br from-violet-400 to-cyan-400"
        />
        <span className="font-medium">Siddharth Agrawal</span>
      </Link>
      <div className="hidden gap-6 text-[13px] text-white/70 md:flex">
        <Link href="/work">Work</Link>
        <Link href="/notes">Writing</Link>
        <Link href="/talks">Talks</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </div>
      <StickyResumePill />
    </nav>
  );
}
```

- [ ] **Step 3: Build**

`pnpm build`. Expected clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(nav): SiteNav and StickyResumePill components

Pill is a permanent recruiter escape hatch. Nav links route to pages
created in later phases; placeholders for now.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.3: Hero section (editable)

**Files:**
- Create: `components/home/Hero.tsx`

- [ ] **Step 1: Implement Hero**

Create `components/home/Hero.tsx`:

```tsx
import { EditableText } from "@/components/editable/EditableText";

export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#05060a] text-white">
      {/* Static gradient stand-in for the future WebGL orb (Phase 3). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[55%] top-[35%] -z-10 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[60px]"
        style={{
          background:
            "conic-gradient(from 120deg, #7c3aed, #06b6d4, #f472b6, #7c3aed)",
        }}
      />

      <div className="relative max-w-[880px] px-10 pt-32">
        <EditableText
          page="home"
          slot="hero.eyebrow"
          fallback="PRODUCT MANAGER · BUILDER · 2018 — NOW"
          as="div"
          singleLine
          className="text-[11px] tracking-[0.3em] text-white/50"
        />

        <h1 className="mt-6 text-[62px] font-light leading-none tracking-[-2.5px]">
          <EditableText
            page="home"
            slot="hero.headlineTop"
            fallback="I build products"
            as="span"
            singleLine
          />
          <br />
          <em
            className="not-italic font-normal bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #a78bfa 20%, #22d3ee 60%, #f472b6)",
            }}
          >
            <EditableText
              page="home"
              slot="hero.headlineBottom"
              fallback="people actually use."
              as="span"
              singleLine
            />
          </em>
        </h1>

        <EditableText
          page="home"
          slot="hero.subtext"
          fallback="PM at the intersection of AI, health, and consumer."
          as="p"
          className="mt-6 max-w-[560px] text-base font-light leading-[1.55] text-white/75"
        />

        <div className="mt-9 flex items-center gap-3">
          <a
            href="#work"
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black"
          >
            <EditableText
              page="home"
              slot="hero.ctaPrimary"
              fallback="View selected work →"
              as="span"
              singleLine
            />
          </a>
          <a
            href="/contact"
            className="rounded-full border border-white/20 px-5 py-3 text-sm text-white"
          >
            <EditableText
              page="home"
              slot="hero.ctaSecondary"
              fallback="Book a call"
              as="span"
              singleLine
            />
          </a>
          <span className="ml-3 inline-flex items-center gap-2 text-xs text-white/50">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <EditableText
              page="home"
              slot="hero.statusPill"
              fallback="Open to senior PM roles"
              as="span"
              singleLine
            />
          </span>
        </div>
      </div>

      <div className="absolute bottom-6 left-10 text-[10px] tracking-[0.25em] text-white/45">
        SCROLL ↓ TO ENTER
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build**

`pnpm build`. Expected clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(home): hero section with seven editable text slots

Eyebrow, headline (top + bottom), subtext, two CTA labels, and status
pill all wired through EditableText. Static gradient stand-in for the
WebGL orb landing in Phase 3.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.4: Placeholder sections + ContactCTA

**Files:**
- Create: `components/home/HeroCaseStudiesPlaceholder.tsx`
- Create: `components/home/ProjectGridPlaceholder.tsx`
- Create: `components/home/AboutPreviewPlaceholder.tsx`
- Create: `components/home/ContactCTA.tsx`

- [ ] **Step 1: Three placeholder sections + a Contact CTA, wired so the page is structurally complete**

Create `components/home/HeroCaseStudiesPlaceholder.tsx`:

```tsx
export function HeroCaseStudiesPlaceholder() {
  return (
    <section id="work" className="bg-[#0a0c12] px-10 py-24 text-white">
      <p className="text-[10px] tracking-[0.3em] text-white/40">SELECTED WORK · 03</p>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900"
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  i === 1
                    ? "radial-gradient(circle at 30% 40%, rgba(167,139,250,.5), transparent 60%)"
                    : i === 2
                    ? "radial-gradient(circle at 70% 60%, rgba(34,211,238,.5), transparent 60%)"
                    : "radial-gradient(circle at 50% 50%, rgba(244,114,182,.5), transparent 60%)",
              }}
            />
            <div className="absolute bottom-3 left-3 text-xs">Project {i} →</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-white/40">
        Real case studies land in Phase 4. This grid is structural.
      </p>
    </section>
  );
}
```

Create `components/home/ProjectGridPlaceholder.tsx`:

```tsx
export function ProjectGridPlaceholder() {
  return (
    <section className="bg-black px-10 py-24 text-white">
      <p className="text-[10px] tracking-[0.3em] text-white/40">MORE WORK</p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] rounded-lg bg-white/5" />
        ))}
      </div>
    </section>
  );
}
```

Create `components/home/AboutPreviewPlaceholder.tsx`:

```tsx
export function AboutPreviewPlaceholder() {
  return (
    <section className="bg-[#05060a] px-10 py-24 text-white">
      <p className="text-[10px] tracking-[0.3em] text-white/40">ABOUT</p>
      <p className="mt-4 max-w-[640px] text-2xl font-light leading-tight tracking-tight">
        Story page goes here in Phase 7 — origin, key bets, philosophy, what I'm doing
        now. For now, this section reserves the layout.
      </p>
    </section>
  );
}
```

Create `components/home/ContactCTA.tsx`:

```tsx
export function ContactCTA() {
  return (
    <section className="bg-black px-10 py-24 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] tracking-[0.3em] text-white/40">CONTACT</p>
        <h2 className="mt-4 text-4xl font-light tracking-tight">
          The fastest way to reach me is the calendar.
        </h2>
        <a
          href="/contact"
          className="mt-8 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-black"
        >
          Book a call
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build**

`pnpm build`. Expected clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(home): placeholder sections + contact CTA

Reserves layout for hero case studies, project grid, about preview,
and contact CTA. Real content lands in subsequent phases.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.5: Wire everything into `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx` (add `<SiteNav />`)

- [ ] **Step 1: Mount SiteNav globally**

Edit `app/layout.tsx`. Replace its body with:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AdminBar } from "@/components/admin/AdminBar";
import { SiteNav } from "@/components/nav/SiteNav";

export const metadata: Metadata = {
  title: "Siddharth Agrawal — Portfolio",
  description: "Product manager and builder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white">
        <Providers>
          <AdminBar />
          <SiteNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import { Hero } from "@/components/home/Hero";
import { HeroCaseStudiesPlaceholder } from "@/components/home/HeroCaseStudiesPlaceholder";
import { ProjectGridPlaceholder } from "@/components/home/ProjectGridPlaceholder";
import { AboutPreviewPlaceholder } from "@/components/home/AboutPreviewPlaceholder";
import { ContactCTA } from "@/components/home/ContactCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HeroCaseStudiesPlaceholder />
      <ProjectGridPlaceholder />
      <AboutPreviewPlaceholder />
      <ContactCTA />
    </>
  );
}
```

- [ ] **Step 3: Build and dev-check**

Run: `pnpm build && pnpm dev`. Visit `/`. Confirm:
- Nav with logo + links + Skip/Résumé pill renders top.
- Hero with gradient backdrop, eyebrow, headline, subtext, CTAs, status pill.
- Three placeholder sections below.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
feat(home): wire Hero + placeholders into / and mount SiteNav

Layout now mounts AdminBar (admin-only) and SiteNav (always). Page
composition matches the spec's homepage structure.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.6: E2E test — admin can edit hero headline

**Files:**
- Create: `tests/e2e/home-edit.spec.ts`

> This test requires a way to authenticate in CI without sending real magic-link emails. We use Convex's test bypass: a CLI mutation pre-creates an admin session token that the test injects as a cookie.

- [ ] **Step 1: Add a Convex helper to mint a test session for an allowlisted admin**

Append to `convex/users.ts`:

```ts
import { internalMutation } from "./_generated/server";

/** Test-only: ensure a users row exists with admin role. Used by E2E. */
export const testEnsureAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const norm = email.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", norm))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { role: "admin" });
      return existing._id;
    }
    return ctx.db.insert("users", {
      email: norm,
      role: "admin",
      createdAt: Date.now(),
    });
  },
});
```

(Note: the test imports `v` already; verify the import is present.)

Push: `pnpm dlx convex dev --once`.

- [ ] **Step 2: Write the E2E test**

Create `tests/e2e/home-edit.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

// This test requires the magic-link to be skippable in dev:
//   - AUTH_RESEND_KEY may be set to "test"
//   - Convex Auth dev mode logs the magic-link URL to stdout
// Strategy: visit /admin/login, intercept the link from Convex dev logs
// is brittle. Instead, we go via a programmatic sign-in helper page that
// is only available when NODE_ENV !== 'production'. Add it in a follow-up
// task if this approach is rejected.

test.skip("admin edits hero headline inline", async ({ page }) => {
  // Intentionally skipped: requires a dev-only auth helper route, added
  // in Task 2.7 below.
});
```

- [ ] **Step 3: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
test(e2e): scaffold admin-edit E2E spec (skipped pending dev auth helper)

Convex testEnsureAdmin internalMutation added. Real test enabled in
Task 2.7 once a dev-only programmatic sign-in route exists.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.7: Dev-only programmatic sign-in route + enable E2E

**Files:**
- Create: `app/dev-auth/route.ts`
- Modify: `tests/e2e/home-edit.spec.ts`

> This route is gated by `NODE_ENV !== 'production'` and a shared dev secret. It exists only to support E2E tests; in production it returns 404.

- [ ] **Step 1: Implement the dev sign-in route**

Create `app/dev-auth/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

const DEV_SECRET = process.env.DEV_AUTH_SECRET;

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!DEV_SECRET) {
    return new NextResponse("DEV_AUTH_SECRET not set", { status: 500 });
  }
  const body = (await req.json()) as { secret?: string; email?: string };
  if (body.secret !== DEV_SECRET || !body.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  // Set a marker cookie the AdminProvider can read in dev to short-circuit
  // auth. Real production auth is unaffected.
  const res = NextResponse.json({ ok: true, email: body.email });
  res.cookies.set("dev_admin_email", body.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return res;
}
```

- [ ] **Step 2: Make `useViewer` honor the dev cookie**

Edit `lib/auth/useViewer.ts`. Replace its body with:

```ts
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type Viewer =
  | { state: "loading" }
  | { state: "anonymous" }
  | { state: "authenticated"; isAdmin: boolean; email: string; name?: string };

function readDevAdminCookie(): string | null {
  if (typeof document === "undefined") return null;
  if (process.env.NODE_ENV === "production") return null;
  const match = document.cookie.match(/(?:^|;\s*)dev_admin_email=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function useViewer(): Viewer {
  const user = useQuery(api.users.currentUser);
  const devAdmin = readDevAdminCookie();

  if (devAdmin) {
    return { state: "authenticated", isAdmin: true, email: devAdmin };
  }
  if (user === undefined) return { state: "loading" };
  if (user === null) return { state: "anonymous" };
  return {
    state: "authenticated",
    isAdmin: user.role === "admin",
    email: user.email,
    name: user.name,
  };
}
```

> Note: this makes the dev cookie a *client-side* admin flag for UI purposes only. The Convex `upsert` mutation still requires a real authenticated identity, so saves from dev-cookie sessions will fail server-side. To make E2E saves persist, the dev route must additionally call `signIn` server-to-server with a debug provider — out of scope for this task, but the test below verifies the *editor opens and accepts input*, which is enough to validate the wiring.

Update the failing-server-save scenario so the test asserts only the affordance is reachable, not the persistence. Persistence is exercised manually in Task 2.8.

- [ ] **Step 3: Add the env var**

```bash
cd /Users/siddharthagrawal/portfolio && echo "DEV_AUTH_SECRET=local-only-dev-secret" >> .env.local
```

- [ ] **Step 4: Replace the skipped test with a real one**

Replace `tests/e2e/home-edit.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("admin sees edit affordances on the hero in dev", async ({ page, request }) => {
  // Programmatic dev sign-in
  const res = await request.post("/dev-auth", {
    data: { secret: "local-only-dev-secret", email: "siddharth@example.com" },
  });
  expect(res.ok()).toBe(true);

  await page.goto("/");
  // AdminBar appears
  await expect(page.getByText(/EDITING/)).toBeVisible();
  // Hero headline shows the dashed-outline cursor (admin hover state)
  const headline = page.getByText("I build products", { exact: true });
  await expect(headline).toBeVisible();
  await headline.click();
  // Tiptap editor mounts (border + bg style); we assert by the editor textbox role.
  await expect(page.getByRole("textbox")).toBeVisible({ timeout: 5000 });
});

test("public visitor sees no admin affordances", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/EDITING/)).toHaveCount(0);
});
```

- [ ] **Step 5: Run E2E**

```bash
cd /Users/siddharthagrawal/portfolio && pnpm test:e2e
```
Expected: 2 passed (and the smoke spec from Task 0.4).

- [ ] **Step 6: Commit**

```bash
cd /Users/siddharthagrawal/portfolio && git add -A && git commit -m "$(cat <<'EOF'
test(e2e): dev-only auth helper enables admin affordance test

POST /dev-auth sets a dev_admin_email cookie (NODE_ENV !== production
only). useViewer honors it for UI gating. E2E asserts AdminBar is
visible, hero headline opens a Tiptap editor, and visitors see no
affordances.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.8: Manual smoke + final preview deploy

- [ ] **Step 1: Manually verify the full edit loop**

In one terminal: `pnpm dlx convex dev`. In another: `pnpm dev`.

1. Visit `/admin/login`.
2. Enter your allowlisted email. Click "Send magic link."
3. Click the link in your inbox. You're redirected back.
4. Visit `/`. Confirm the AdminBar shows "EDITING · LIVE" top-left.
5. Click the headline "I build products" — Tiptap editor opens with a purple border.
6. Type a change. Wait 1.5s. The text persists (verify by hard-refreshing — change should still be there).
7. Click "View as visitor" — affordances disappear, Tiptap stops mounting.
8. Click "Resume editing" — affordances return.
9. Open an incognito window, visit `/`. Confirm no affordances and the latest text shows.

If anything fails, do not advance — debug and fix.

- [ ] **Step 2: Push to Vercel preview**

Before deploying, set Convex env vars on Vercel:

```bash
cd /Users/siddharthagrawal/portfolio && \
  pnpm dlx vercel env add CONVEX_DEPLOY_KEY production && \
  pnpm dlx vercel env add CONVEX_DEPLOY_KEY preview
```

(Get the deploy key from `pnpm dlx convex deployment-key`.)

Then:

```bash
cd /Users/siddharthagrawal/portfolio && pnpm dlx vercel
```

Visit the preview URL. Confirm public render works. (Auth-gated edit is a manual flow on production; covered in Phase 9 polish.)

- [ ] **Step 3: Commit any final tweaks and tag the milestone**

```bash
cd /Users/siddharthagrawal/portfolio && git tag -a phase-2-complete -m "Phase 2 complete: editable home hero deployed"
```

---

## Self-review

**Spec coverage (against `2026-05-08-portfolio-design.md`):**
- §3 content shape — partial (hero + placeholders for projects/about; full coverage in later plans).
- §5 architecture — Next.js 16 + Convex + Tiptap + Vercel landed (R3F/GSAP/Lenis/Mux deferred to Phase 3+ plans).
- §6 data model — `users`, `siteContent`, `media`, `settings` tables created. `projects`, `caseStudies`, `notes`, `talks` deferred.
- §8 components — `EditableText`, `EditableMedia`, `AdminBar`, `StickyResumePill`, `SiteNav` landed.
- §9 inline-edit pattern — implemented end-to-end (read mode, click-to-edit, debounced auto-save, Cmd+S, Escape, View-as-visitor).
- §10 auth — Convex Auth magic link + admin allowlist + recovery via CLI.
- §11 a11y / perf — partial (semantic HTML and focus styles in place; full audit in Phase 9).
- §13 phases — Phases 0–2 covered; 3–10 deferred to follow-up plans.

**Gaps logged for follow-up plans:**
- Phase 3: WebGL hero, Lenis, GSAP scroll choreography, mobile fallback.
- Phase 4: `projects` schema + admin CRUD + grid + detail.
- Phase 5: `caseStudies` Tiptap section editor + render + Mux video card.
- Phase 6: Mux integration; replaces raw `<video>` in `EditableMedia`.
- Phase 7: About / Notes / Talks pages + schemas.
- Phase 8: Contact + Calendly.
- Phase 9: SEO, OG, sitemap, perf budget, full a11y audit.
- Phase 10: Domain, content seed, polish.

**Placeholder scan:** All code blocks contain real implementation. No "TBD"/"TODO"/"add appropriate error handling". The single deliberate stub (`EditableTextEditor` in Task 1.9) is replaced in Task 1.10 of the same plan.

**Type consistency:** `EditableText` props in 1.9 match usage in 2.3 (`page`, `slot`, `fallback`, `as`, `className`, `singleLine`). `EditableMedia` props in 1.11 match usage that will land in Phase 4. `useViewer` shape stable across 1.5 and 2.7.

**Known limitations called out in the plan:**
- Task 2.7 dev cookie is UI-only; server-side mutations still require real Convex Auth. Manual flow validates end-to-end persistence in Task 2.8.
- Resume URL on the pill is a placeholder `#` until Phase 8 wires `settings.resumeUrl`.
- `/work`, `/notes`, `/talks`, `/about`, `/contact` link targets in nav are placeholders until their phases land.

---

## Execution handoff

**Plan complete and saved to `docs/plans/2026-05-08-portfolio-foundation.md`.** Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints for review.

Which approach?


