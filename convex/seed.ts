import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { EXPERIENCE_ROLE_DEFAULTS } from "../lib/defaults/experienceRoles";
import { PROJECT_DEFAULTS } from "../lib/defaults/projects";

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

/**
 * Seed the singleton siteContacts row keyed `"primary"`. Idempotent: if the
 * row already exists, this is a no-op. Mirrors the literal fallbacks in
 * `components/home/HeroRecruiterRail.tsx` so a freshly-seeded DB renders
 * identically to a clean DB with no rows.
 */
export const seedSiteContacts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("siteContacts")
      .withIndex("by_key", (q) => q.eq("key", "primary"))
      .unique();
    if (existing) return { inserted: 0 as const };
    await ctx.db.insert("siteContacts", {
      key: "primary",
      email: "hello@siddharthagrawal.com",
      linkedinUrl: "https://www.linkedin.com/in/siddharthagrawal18/",
      resumeUrl: "/Siddharth_Agrawal_Resume.pdf",
      githubUrl: "https://github.com/siddharthkiit1-PM-gif",
      updatedAt: Date.now(),
    });
    return { inserted: 1 as const };
  },
});

/**
 * Seed the three default experience roles. Idempotent on `(company, dates)`
 * pairs — re-running will not double-insert. `order` is assigned by the
 * array index below so the list lands in the same top-down order the static
 * component used to render.
 */
export const seedExperienceRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    for (let i = 0; i < EXPERIENCE_ROLE_DEFAULTS.length; i++) {
      const role = EXPERIENCE_ROLE_DEFAULTS[i];
      const existing = await ctx.db
        .query("experienceRoles")
        .withIndex("by_company_dates", (q) =>
          q.eq("company", role.company).eq("dates", role.dates),
        )
        .first();
      if (existing) continue;
      await ctx.db.insert("experienceRoles", {
        order: i,
        dates: role.dates,
        company: role.company,
        title: role.title,
        metric: role.metric,
        outcome: role.outcome,
        location: role.location,
        pillars: role.pillars,
        updatedAt: Date.now(),
      });
      inserted++;
    }
    return { inserted };
  },
});

/**
 * One-shot upsert for the Portfolio MCP case study. Looks up the row by
 * either the legacy stub slug (`untitled-4`) or the final slug
 * (`portfolio-mcp`) and patches it with the full case-study payload.
 * Idempotent: re-runs are no-ops on content, only updating `updatedAt`.
 */
export const seedPortfolioMcpProject = internalMutation({
  args: {},
  handler: async (ctx) => {
    const FINAL_SLUG = "portfolio-mcp";
    const STUB_SLUG = "untitled-4";

    const content = {
      slug: FINAL_SLUG,
      order: 4,
      featured: false,
      title: "Portfolio MCP — an MCP server for my résumé",
      year: "2026",
      role: "Solo build · PM × engineer",
      tagline:
        "A small backend that lets any LLM client semantic-search my work history, instead of squinting at a two-page PDF.",
      techStack: [
        "Convex",
        "Gemini gemini-embedding-001",
        "OAuth 2.1 + PKCE",
        "Hono",
        "Vercel Functions",
        "TypeScript",
      ],
      problem:
        "Every time a recruiter's AI screens a candidate, it gets a two-page PDF and a vibe. The bullets that should be earning me the interview — the $500K ARR signals product, the eval pipeline, the captain-cancellation work — get flattened into tokens and tossed at GPT with no structure. I wanted to skip the PDF middle layer.",
      users:
        "Recruiters running LLM-assisted screening. AI agents doing reference-style lookups before someone reaches out. And me, mostly, when I want to grep my own history without opening Notion.",
      value:
        "Connect an MCP-compatible client (Claude, Cursor, anything that speaks MCP) once, OAuth through, and you get one tool: searchBullets(query, k). Type 'experience with vector search' and the server returns the actual bullet that mentions it — with company, dates, pillar label, and a similarity score. No PDF parsing. No hallucinated impact numbers.",
      goal: "Make my work history queryable by an AI client the same way a database is queryable by an app — structured, typed, and grounded in the real bullets I wrote, not whatever the model reconstructs from a flattened PDF.",
      approach:
        "Two moving parts. The embeddings pipeline walks every bullet in the experienceRoles table, sha256-hashes each one, and only embeds the deltas. Cheap re-runs only pay for what changed. Orphan rows whose source bullet got deleted are reaped in the same pass. Gemini's gemini-embedding-001 at 1536 dims (Matryoshka truncation), task-typed as RETRIEVAL_DOCUMENT, L2-normalised so the Convex cosine index is actually cosine.\n\nThe query side mirrors that: same model, task-typed as RETRIEVAL_QUERY this time, fed into Convex's vectorSearch with a clamped k. The asymmetric task type meaningfully beats single-mode embedding for retrieval — not a small gain, the kind of thing you notice in the first ten queries.\n\nAuth is the part I overbuilt. RFC 7591 dynamic client registration, PKCE only (S256, plain explicitly rejected), opaque bearer tokens stored as random bytes for single-lookup revocation. None of this was strictly needed for v1; the MCP spec calls for it and I wanted the server to be reusable beyond my own résumé.\n\nTransport is Hono on Vercel Functions, sitting in its own repo so it can scale and version independently of this portfolio site. Both point at the same Convex deployment, so the bullets in the admin editor and the bullets the MCP server serves are the same row, embedded once.",
      outcomeNarrative:
        "Live on the same Convex deployment that backs this site. Single-digit-millisecond search latency in prod. Bullet count is small enough that the vector index never breaks a sweat, but the architecture scales the same way at 10x or 100x.\n\nCost so far is essentially zero. Gemini's free tier covers the embedding volume, Convex bills are noise, the Vercel function runs inside the free plan. The whole thing is a sub-five-dollar-a-month project if it ever gets real traffic.\n\nThe honest take: zero recruiter LLMs are speaking MCP yet. Today the value is mostly for myself and for agents I wire up by hand. The bet is that MCP-style structured retrieval becomes how AI clients ingest candidate data over the next eighteen months, and I'd rather have the server already running when that happens than ship it after.",
      learnings:
        "Two things I'd do differently.\n\nFirst, I started with OpenAI for embeddings out of tutorial inertia. Switching to Gemini got me three things I should've cared about from day one: asymmetric task types, Matryoshka truncation (so I can re-rank at 768 dims later without re-embedding), and a free tier that makes the whole project cost nothing. Pick the embedding model for the index, not because it's the one in the README.\n\nSecond, I built the OAuth flow before a single client had connected. PKCE plus dynamic registration is the right spec answer, but it's two days I could have shelved until someone was actually trying to plug in. Build the auth surface when you have a user staring at it, not before.",
      heroMetricValue: "1536",
      heroMetricLabel: "Vector index dimensions",
    };

    // Prefer the final slug if it exists; fall back to the stub.
    const existing =
      (await ctx.db
        .query("projects")
        .withIndex("by_slug", (q) => q.eq("slug", FINAL_SLUG))
        .unique()) ??
      (await ctx.db
        .query("projects")
        .withIndex("by_slug", (q) => q.eq("slug", STUB_SLUG))
        .unique());

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...content, updatedAt: now });
      return { action: "patched" as const, id: existing._id };
    }
    const id = await ctx.db.insert("projects", { ...content, updatedAt: now });
    return { action: "inserted" as const, id };
  },
});

/**
 * One-shot upsert for the Rental Recourse case study. Idempotent on
 * `slug` — re-runs patch the existing row with the latest content.
 */
export const seedRentalRecourseProject = internalMutation({
  args: {},
  handler: async (ctx) => {
    const SLUG = "rental-recourse";

    const content = {
      slug: SLUG,
      order: 1,
      featured: true,
      title: "Rental Recourse — AI legal assistant for Indian tenants",
      year: "2026",
      role: "Solo build · PM × engineer",
      tagline:
        "File-ready legal notices for Indian tenants in ~30 seconds, grounded in verbatim state-law citations. Free, no login, no lawyer.",
      liveUrl: "https://rental-recourse.vercel.app",
      githubUrl: "https://github.com/siddharthkiit1-PM-gif/rental-recourse",
      articleUrl:
        "https://analyticsindiamag.com/ai-features/how-a-28-year-old-product-manager-built-an-ai-tool-to-help-tenants-recover-rental-deposits",
      techStack: [
        "Next.js 16",
        "React 19",
        "Gemini 2.5 Flash",
        "Vercel AI SDK v6",
        "Upstash Vector",
        "Upstash Redis",
        "Resend",
        "TypeScript",
      ],
      problem:
        "Indian tenants lose their deposits because filing a legal notice means ₹500–2,000 for a lawyer, days of waiting, and a document most renters don't know how to read, let alone draft. Most just give up. The friction protects landlords; the status quo is the problem.",
      users:
        "Indian renters with security-deposit non-return, illegal eviction threats, forced lockouts, harassment, or landlord-unreachable situations. Covers 10 state jurisdictions (7 dedicated state Rent Acts + 3 via the Model Tenancy Act) plus Consumer Protection Act, Indian Contract Act, and CPC §80 as a nationwide fallback.",
      value:
        "A 6-step intake feeds a live-streaming agent that classifies the situation, routes to the right forum deterministically (no LLM in the decision path), retrieves verbatim bare-act sections, verifies citations against the corpus, and drafts a filing-ready legal notice in ~30 seconds. Users edit inline, download a PDF, and send it themselves — no middleman, no ₹1,499 markup.",
      goal: "Collapse the cost and time of filing a tenant legal notice from ₹500+ and multiple days to zero rupees and thirty seconds — while being more jurisdiction-accurate than a template and more trustworthy than a raw LLM output.",
      approach:
        "The retrieval layer is the trust layer. The corpus is verbatim bare-act text — Karnataka, Maharashtra, Delhi, Tamil Nadu, Telangana, West Bengal, and Rajasthan Rent Acts, plus Model Tenancy Act 2021, Consumer Protection Act 2019, Indian Contract Act 1872, and CPC §80. Nothing is summarised at index time. Gemini embeddings at 1536 dims land in Upstash Vector, namespaced v1, task-typed as RETRIEVAL_DOCUMENT.\n\nThe agent is five steps: classify (situation type) → route (forum, deterministic rule matrix in lib/agent/route.ts) → retrieve (vector + jurisdiction filter) → verify (citation verifier rejects any section number not in the corpus) → draft (Gemini 2.5 Flash with the retrieved sections pinned into context). A forbidden-terms filter catches fabricated attorney claims and promises of outcome before anything streams back.\n\nSessions are anonymous and expire in 24h. Rate limit is 30 drafts per IP per day via Upstash sliding window. Admin dashboard sits behind a custom HMAC cookie + Resend magic link — no user accounts, no PII beyond the active session. The whole thing is one Next.js 16 app on Vercel Fluid Compute (300s function budget for the agent route) talking to Upstash Vector and Redis.",
      outcomeNarrative:
        "Launched 2026-08-10. The launch post hit 400K impressions on LinkedIn, 8K engagements, 90+ reposts, and sent 3,000+ active users through the product on Day 1 with a 51% completion rate. Analytics India Magazine ran a dedicated feature on it.\n\nThe app shipped with 10-state coverage and verbatim-cited drafts out of the gate. Peak day — Aug 11 — saw 500 draft attempts from 383 unique IPs, with the agent route holding under single-digit-second time-to-first-token through the spike. Costs stayed inside Gemini's free tier plus Upstash's noise band — the whole stack ran sub-₹500/month at peak.\n\nThe honest take: completion rate is the real metric. 51% of users finishing a six-step legal intake form is unusual for Indian consumer products, and it's the signal that the drafting output is actually useful — not just interesting.",
      learnings:
        "Two things.\n\nOne, the verbatim corpus was the right call. Every tenant-facing legal product I'd seen was either a generic template dump or a lawyer marketplace — neither solves the trust problem. Pinning the LLM to real bare-act text at retrieval time, then rejecting hallucinated section numbers at verify time, let me ship a free tool that reads more credibly than paid competitors. The citation verifier earns its keep every single draft.\n\nTwo, don't gate on auth for v1. Anonymous sessions + 24h TTL + rate limits per IP gave me instrumentation, abuse protection, and launch speed in one choice. The DPDP compliance surface is almost zero because almost nothing persists. When monetization starts, auth will come with it — but shipping without it was the right trade for day one.",
      heroMetricValue: "400K",
      heroMetricLabel: "LinkedIn impressions · launch week",
    };

    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", SLUG))
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...content, updatedAt: now });
      return { action: "patched" as const, id: existing._id };
    }
    const id = await ctx.db.insert("projects", { ...content, updatedAt: now });
    return { action: "inserted" as const, id };
  },
});

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
