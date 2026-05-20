import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    // `role` and `createdAt` are populated by `users.ensureUserRecord` right
    // after Convex Auth's default `createOrUpdateUser` inserts the bare row
    // with just `email`. They MUST stay optional here so the auth lib's
    // initial insert validates against this schema. Code that reads these
    // fields (e.g. `requireAdmin`) handles the absent case as "not admin".
    role: v.optional(v.union(v.literal("admin"), v.literal("viewer"))),
    createdAt: v.optional(v.number()),
    // Convex Auth's default upsert may also write these standard OAuth-style
    // fields. List them here so the schema accepts the row on first insert.
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })
    // Index name is "email" (not "by_email") because Convex Auth's
    // `uniqueUserWithVerifiedEmail` looks up the users table via an index
    // literally named "email". All in-repo callers use this same name.
    .index("email", ["email"]),

  siteContent: defineTable({
    page: v.string(), // "home" | "about" | ...
    slot: v.string(), // "hero.headline" | ...
    valueJson: v.string(), // Tiptap JSON serialized
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

  siteContacts: defineTable({
    key: v.literal("primary"),
    email: v.string(),
    linkedinUrl: v.string(),
    resumeUrl: v.string(),
    // Optional so existing rows (written before GitHub was a tracked field)
    // continue to validate; the rail and admin form fall back to the literal
    // until an admin saves a value.
    githubUrl: v.optional(v.string()),
    // Stored as E.164 digits without the leading "+" (e.g. "917977522907") so
    // the same value works for both the wa.me chat link and the displayed
    // "+91 79775 22907" rendering. Used by the Reach Out section's WhatsApp row.
    phone: v.optional(v.string()),
    // Full Calendly event URL (e.g. https://calendly.com/<user>/30min). Used
    // by the Reach Out section's "Book a meeting" row.
    calendlyUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  experienceRoles: defineTable({
    order: v.number(),
    dates: v.string(),
    company: v.string(),
    title: v.string(),
    metric: v.string(),
    outcome: v.optional(v.string()),
    // Optional so existing rows in production Convex continue to validate
    // without a backfill. Components fall back to EXPERIENCE_ROLE_DEFAULTS
    // when the live row is missing these.
    location: v.optional(v.string()),
    pillars: v.optional(
      v.array(
        v.object({
          label: v.string(),
          bullets: v.array(
            v.object({
              text: v.string(),
              metric: v.optional(v.string()),
            }),
          ),
        }),
      ),
    ),
    updatedAt: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_company_dates", ["company", "dates"]),

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
    /**
     * One-breath pitch line shown beneath the title on the homepage row and
     * as the standfirst on the case-study page. Distinct from `problem` —
     * tagline is "what it is + who it's for", problem is "what was broken".
     */
    tagline: v.optional(v.string()),

    // links
    liveUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    figmaUrl: v.optional(v.string()),
    loomUrl: v.optional(v.string()),
    /** PRD / spec doc link (Notion, Google Doc, Confluence, etc.). */
    prdUrl: v.optional(v.string()),

    // metadata
    techStack: v.array(v.string()),

    // hero media
    heroImageStorageId: v.optional(v.id("_storage")),
    heroImageAlt: v.optional(v.string()),

    // fact sheet (required)
    problem: v.string(),
    users: v.string(),
    value: v.string(),

    // optional extras
    goal: v.optional(v.string()),

    // case-study narrative (optional)
    approach: v.optional(v.string()),
    outcomeNarrative: v.optional(v.string()),
    /**
     * Free-form reflection rendered as the "What I learned" block on the
     * case-study page. Optional — hidden when blank so hobby projects don't
     * carry an empty section.
     */
    learnings: v.optional(v.string()),
    heroMetricValue: v.optional(v.string()),
    heroMetricLabel: v.optional(v.string()),

    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"])
    .index("by_featured_order", ["featured", "order"]),

  // Resume bullet embeddings powering MCP semantic search.
  // `embedding` is 1536-dim because we use Gemini `gemini-embedding-001`
  // with `outputDimensionality: 1536` (Matryoshka truncation). Changing the
  // model or dimension means changing this number and re-embedding.
  // `sourceHash` is sha256(bulletText) — used by the embedding cron and
  // by `experienceRoles.update` to skip re-embedding unchanged bullets.
  bulletEmbeddings: defineTable({
    roleCompany: v.string(),
    roleDates: v.string(),
    pillarLabel: v.string(),
    bulletText: v.string(),
    metric: v.optional(v.string()),
    embedding: v.array(v.float64()),
    sourceHash: v.string(),
    updatedAt: v.number(),
  })
    .vectorIndex("by_embedding", { vectorField: "embedding", dimensions: 1536 })
    .index("by_source_hash", ["sourceHash"]),

  // Dynamically-registered MCP clients (RFC 7591). `clientId` is the public
  // identifier returned to the client during registration; no client secret
  // is issued — MCP relies on PKCE for code-exchange security.
  oauthClients: defineTable({
    clientId: v.string(),
    clientName: v.string(),
    redirectUris: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_client_id", ["clientId"]),

  // OAuth access + refresh tokens issued to MCP clients. `userId` must point
  // at a `users` row with `role: "admin"` — the token endpoint verifies this
  // at issue time. Tokens are opaque random bytes (not JWTs) so revocation
  // is a single index lookup.
  oauthTokens: defineTable({
    token: v.string(),
    refreshToken: v.optional(v.string()),
    clientId: v.string(),
    userId: v.id("users"),
    scopes: v.array(v.string()),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_refresh_token", ["refreshToken"])
    .index("by_user", ["userId"]),

  // Short-lived authorization codes from the OAuth authorize flow. Single-use
  // (consumed during /oauth/token exchange) and TTL'd by `expiresAt`.
  // `codeChallengeMethod` is constrained to `"S256"` per MCP spec — `"plain"`
  // is explicitly rejected.
  oauthAuthCodes: defineTable({
    code: v.string(),
    clientId: v.string(),
    userId: v.id("users"),
    redirectUri: v.string(),
    codeChallenge: v.string(),
    codeChallengeMethod: v.literal("S256"),
    scopes: v.array(v.string()),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
  }).index("by_code", ["code"]),
});
