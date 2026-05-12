# Portfolio MCP Server — Design Spec

**Date:** 2026-05-13
**Status:** Approved
**Author:** Siddharth Agrawal (with Claude)

---

## Goal

Build and ship a standalone, OAuth-protected Model Context Protocol server that exposes Siddharth's portfolio as a structured, agent-callable API. The server lives at `mcp.siddharth-agrawal.com` in a separate repository, reads from the same Convex backend as the live portfolio, and lets authenticated callers (just Siddharth) mutate select content. Doubles as a flagship resume artifact demonstrating production MCP work: spec-compliant OAuth, semantic search via embeddings, and clean separation of read/write surfaces.

## Non-goals

- Not a generic CMS API. Only exposes resume / portfolio-shaped data.
- No on-site discovery surface on the portfolio itself (v1). Recruiters / agents reach it via resume and LinkedIn only.
- No multi-user write surface. Only Siddharth's Convex Auth admin user can write.
- No new portfolio components, no UI work on the portfolio repo.

## Architecture

```
┌──────────────────────────────────┐         ┌──────────────────────────────────┐
│  Portfolio (existing repo)       │         │  MCP Server (NEW, separate repo) │
│  siddharth-agrawal.com           │         │  mcp.siddharth-agrawal.com       │
│  Next.js 16 + Convex client      │         │  Hono on Vercel Functions        │
│  Vercel project: portfolio       │         │  Vercel project: portfolio-mcp   │
└─────────────┬────────────────────┘         └─────────────┬────────────────────┘
              │                                            │
              │ convex/react (browser)                     │ ConvexHttpClient (server)
              │ ConvexHttpClient (SSR)                     │
              ▼                                            ▼
        ┌─────────────────────────────────────────────────────┐
        │  Convex (shared deployment, single source of truth) │
        │                                                     │
        │  Existing tables:                                   │
        │    users · siteContent · media · settings           │
        │    siteContacts · experienceRoles · projects        │
        │                                                     │
        │  NEW tables (added in portfolio repo):              │
        │    bulletEmbeddings · oauthClients · oauthTokens    │
        └─────────────────────────────────────────────────────┘
                                ▲
                                │ vector search via Convex vectorIndex
                                │
                                └─ OpenAI text-embedding-3-small
                                   (key lives in Convex env, never in MCP repo)
```

### Repository boundaries

| Repo | Responsibility |
|---|---|
| `portfolio` (existing) | UI, content authoring, Convex schema, Convex functions (queries / mutations / actions / crons). Adds the new tables and the embedding action. |
| `portfolio-mcp` (new) | MCP transport (Hono + `@modelcontextprotocol/sdk`), OAuth endpoints, tool dispatchers. **Never imports portfolio components.** Imports only `convex/_generated/api` types via a published Convex deployment URL. |

### Why this split

- Convex schema and embedding action belong in the portfolio repo (single source of truth, single Convex deploy).
- MCP server is a thin transport + auth layer over Convex queries/mutations — it has no UI and no domain logic.
- MCP-shaped read model (e.g. `get_resume`) lives as Convex queries in the portfolio repo, callable from both the MCP server (via `ConvexHttpClient`) and from the portfolio's own admin tooling if needed.

## Data model additions

All additions land in `convex/schema.ts` in the portfolio repo. New fields and tables default to optional / non-breaking.

### `bulletEmbeddings`

```ts
bulletEmbeddings: defineTable({
  roleCompany: v.string(),
  roleDates: v.string(),
  pillarLabel: v.string(),
  bulletText: v.string(),
  metric: v.optional(v.string()),
  embedding: v.array(v.float64()),     // 1536-dim, text-embedding-3-small
  sourceHash: v.string(),               // sha256(bulletText) — change detection
  updatedAt: v.number(),
})
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
  })
  .index("by_source_hash", ["sourceHash"])
```

### `oauthClients`

```ts
oauthClients: defineTable({
  clientId: v.string(),                 // random URL-safe, public
  clientName: v.string(),
  redirectUris: v.array(v.string()),
  createdAt: v.number(),
}).index("by_client_id", ["clientId"])
```

### `oauthTokens`

```ts
oauthTokens: defineTable({
  token: v.string(),                    // opaque random 32-byte URL-safe
  refreshToken: v.optional(v.string()),
  clientId: v.string(),
  userId: v.id("users"),                // must have role: "admin"
  scopes: v.array(v.string()),          // ["admin"] etc.
  expiresAt: v.number(),
  revokedAt: v.optional(v.number()),
})
  .index("by_token", ["token"])
  .index("by_refresh_token", ["refreshToken"])
  .index("by_user", ["userId"])
```

Also: a short-lived `oauthAuthCodes` table for the auth-code-with-PKCE flow.

## Tool surface (v1)

Seven MCP tools.

### Public reads (unauthenticated)

| Tool | Input | Output | Backing Convex fn |
|---|---|---|---|
| `get_resume` | `{}` | `{ name, headline, location, roles[], projects[], contact }` | `mcp.queries.getResume` |
| `get_experience` | `{}` | `{ roles: RolePayload[] }` | `experienceRoles.list` |
| `get_projects` | `{}` | `{ projects: ProjectPayload[] }` | `projects.list` |
| `get_contact` | `{}` | `{ email, linkedin, github, phone, calendly }` | `siteContacts.get` |
| `search_experience` | `{ query: string, k?: number (default 5, max 20) }` | `{ hits: BulletHit[] }` | `mcp.actions.searchBullets` |

### Authenticated write (OAuth bearer, `admin` scope)

| Tool | Input | Behavior |
|---|---|---|
| `update_headline` | `{ slot: string, text: string }` | Validates slot belongs to allowlist (`home.about.headline`, `home.experience.headline`, `home.contact.headline`, `home.hero.headline`). Writes plain text wrapped in a minimal Tiptap JSON shell to `siteContent`. |

### Server self-description (public)

| Tool | Input | Output |
|---|---|---|
| `get_server_info` | `{}` | `{ author, sourceUrl, buildVersion, toolCount, oauthMetadataUrl, capabilities, deployedSha }` |

### Output shapes

```ts
type RolePayload = {
  company: string;
  title: string;
  dates: string;
  location?: string;
  metric: string;
  outcome?: string;
  pillars: { label: string; bullets: { text: string; metric?: string }[] }[];
};

type ProjectPayload = {
  slug: string;
  title: string;
  problem?: string;
  approach?: string;
  outcome?: string;
  metric?: { value: string; label: string };
  links: { live?: string; github?: string };
};

type BulletHit = {
  roleCompany: string;
  roleDates: string;
  pillarLabel: string;
  text: string;
  metric?: string;
  score: number;
};
```

## OAuth design (MCP spec compliant)

Implements [MCP Authorization spec](https://modelcontextprotocol.io/specification/draft/basic/authorization), which builds on OAuth 2.1 with PKCE and Dynamic Client Registration (RFC 7591).

### Endpoints

| Path | Method | Purpose |
|---|---|---|
| `/.well-known/oauth-authorization-server` | GET | Authorization server metadata (RFC 8414) |
| `/.well-known/oauth-protected-resource` | GET | Resource metadata (RFC 9728) |
| `/oauth/register` | POST | Dynamic client registration |
| `/oauth/authorize` | GET | Consent page (browser) |
| `/oauth/authorize` | POST | Form submission from consent page |
| `/oauth/token` | POST | Exchange code for token; refresh token |
| `/oauth/revoke` | POST | Token revocation |

### Scopes

- `read` — implicit; all read tools work without a token
- `admin` — required for `update_headline`; only Siddharth's `users` row with `role: "admin"` can grant

### Flow (summary)

1. Agent hits `POST /mcp` calling `update_headline` with no token → server returns `401` + `WWW-Authenticate: Bearer resource_metadata=".../oauth-protected-resource"`.
2. Agent fetches resource metadata → discovers authorization server.
3. Agent fetches `/.well-known/oauth-authorization-server` → discovers endpoints.
4. Agent registers a client at `/oauth/register` (dynamic). Receives `client_id`.
5. Agent opens `/oauth/authorize?response_type=code&client_id=...&code_challenge=...&code_challenge_method=S256&scope=admin&redirect_uri=...` in user's browser.
6. Authorize endpoint: if not signed in, redirects to a Convex Auth sign-in page on the MCP domain; else shows consent screen ("Agent X is requesting admin scope").
7. User approves → server creates an `oauthAuthCodes` row → redirects to `redirect_uri` with `?code=...`.
8. Agent calls `POST /oauth/token` with code + PKCE verifier → server validates → returns `{ access_token, refresh_token, expires_in: 3600, scope: "admin" }`.
9. Agent retries `update_headline` with `Authorization: Bearer <token>` → middleware validates token, looks up `userId`, confirms `role === "admin"`, then dispatches the tool.

### Token shape

Opaque random tokens (not JWTs). `access_token` is 32 random bytes base64url-encoded. `refresh_token` similar, longer-lived (30 days). Validation is a single Convex `by_token` index lookup per request — fast, revocable instantly.

### Authentication for the consent page

The MCP repo proxies Convex Auth via a thin sign-in route that uses Convex's HTTP client. On successful sign-in the MCP server sets a session cookie scoped to `mcp.siddharth-agrawal.com`. This is the only stateful surface in the MCP server; everything else is request-scoped.

## Semantic search pipeline

### Embedding lifecycle

| Trigger | Action | Behavior |
|---|---|---|
| Convex cron, nightly | `embeddings.rebuildAll` | Walk `experienceRoles`; for each bullet, compute `sha256(text)`; if no `bulletEmbeddings` row with that hash, embed via OpenAI and upsert; delete orphans whose source bullet no longer exists. |
| `experienceRoles.update` mutation | `embeddings.refreshRole(roleId)` (scheduled as action) | Re-embed only that role's bullets immediately so admin edits propagate within seconds. |

### Query path

```
search_experience(query, k=5)
  ↓ MCP server (Hono handler)
ConvexHttpClient.action("mcp:searchBullets", { query, k })
  ↓ Convex action
1. OpenAI embeddings.create({ model: "text-embedding-3-small", input: query })
2. ctx.vectorSearch("bulletEmbeddings", "by_embedding", { vector, limit: k })
3. For each {_id, _score}: ctx.runQuery(api.bulletEmbeddings.get, { id: _id })
4. Return BulletHit[]
```

### Cost

- Seed: ~30 bullets × `text-embedding-3-small` ≈ $0.001 one-time
- Query: ~$0.0000002 per query (effectively free)
- Cron: only re-embeds changed bullets, near-zero ongoing cost

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js on Vercel Functions (Fluid Compute, default) | Same host as portfolio; full Node support for `@modelcontextprotocol/sdk` |
| Router | Hono | Lightweight, agent-infra native, fast cold start |
| MCP SDK | `@modelcontextprotocol/sdk` (official) | Spec compliance, Streamable HTTP transport |
| OAuth helpers | hand-rolled, no library | Spec is small enough; control the surface |
| Convex client | `convex` + `ConvexHttpClient` | Server-side, no React |
| Token / hash crypto | Node built-in `crypto` | No deps |
| Env | `process.env` + Zod validation at boot | Fail fast on missing keys |
| Deployment | Vercel project `portfolio-mcp`, auto-deploy from `main` | Mirror portfolio deploy story |

### Files (target structure)

```
portfolio-mcp/
├── api/
│   └── [[...path]].ts                 # Hono app handler (single Vercel function)
├── src/
│   ├── app.ts                          # Hono router setup
│   ├── env.ts                          # Zod-validated env loader
│   ├── convex.ts                       # ConvexHttpClient singleton
│   ├── mcp/
│   │   ├── server.ts                   # MCP server bootstrap, Streamable HTTP transport
│   │   ├── tools/
│   │   │   ├── getResume.ts
│   │   │   ├── getExperience.ts
│   │   │   ├── getProjects.ts
│   │   │   ├── getContact.ts
│   │   │   ├── searchExperience.ts
│   │   │   ├── updateHeadline.ts       # admin scope required
│   │   │   └── getServerInfo.ts
│   │   └── auth.ts                     # token validation middleware
│   ├── oauth/
│   │   ├── metadata.ts                 # /.well-known/* handlers
│   │   ├── register.ts
│   │   ├── authorize.ts                # GET + POST
│   │   ├── token.ts
│   │   └── revoke.ts
│   └── session/
│       └── cookie.ts                   # signed cookie helpers
├── tests/
│   ├── tools/*.test.ts                 # vitest, mock Convex
│   ├── oauth/*.test.ts
│   └── integration/mcp-flow.test.ts    # full OAuth + tool call flow
├── package.json
├── tsconfig.json
├── vercel.ts                           # Vercel config (vercel.ts not vercel.json)
└── README.md
```

## Deployment

- New Vercel project `portfolio-mcp`, linked to new GitHub repo `portfolio-mcp`
- Custom domain `mcp.siddharth-agrawal.com` (CNAME on whichever DNS provider hosts the apex)
- Env vars (set via `vercel env add` or dashboard):
  - `CONVEX_URL` — same as portfolio's `NEXT_PUBLIC_CONVEX_URL`
  - `CONVEX_DEPLOY_KEY` — read-only is fine; writes happen via Convex's mutation surface
  - `SESSION_SECRET` — 32-byte random for signed session cookies
  - `OPENAI_API_KEY` — actually lives in Convex env, NOT here (embeddings happen server-side in Convex)
- Auto-deploy from `main` on push

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| OAuth implementation bugs leak admin scope | Keep token validation in one place (`mcp/auth.ts`); table-driven scope check; integration test covering full flow |
| Vector index returns stale results after admin edit | `experienceRoles.update` mutation schedules an immediate `embeddings.refreshRole` action |
| OpenAI key exposure | Key never leaves Convex env; MCP server only sees vector search results, never the embedding call |
| Schema drift between repos | MCP repo imports `convex/_generated/api` types via Convex's published API; if portfolio schema changes, MCP repo's typecheck fails on build |
| Public read tools used to scrape / spam | Vercel rate limiting via `@vercel/firewall` or simple per-IP token bucket in middleware (v2) |
| Convex Auth session forging in consent page | Signed session cookie with `SESSION_SECRET`; cookie is httpOnly, secure, SameSite=Lax |

## Out of scope (explicit non-goals)

- Search beyond `experienceRoles` bullets — projects/about not indexed in v1
- Streaming tool responses — every tool returns a single JSON payload
- Multi-user OAuth — only Siddharth's admin user can be granted `admin` scope
- Portfolio UI surface (`/projects/mcp`, `/mcp`, `.well-known/mcp.json`) — explicit user decision to defer; not part of this build
- Rate limiting — v2

## Acceptance criteria

1. `curl https://mcp.siddharth-agrawal.com/.well-known/oauth-authorization-server` returns valid OAuth metadata JSON.
2. `curl -X POST https://mcp.siddharth-agrawal.com/mcp -H "Content-Type: application/json" -d '{"method":"tools/list",...}'` returns all 7 tools.
3. Calling `get_resume` returns Siddharth's live resume JSON matching what `siddharth-agrawal.com` renders.
4. Calling `search_experience({ query: "retention work" })` returns the 18% retention bullet at top rank.
5. Calling `update_headline` without a token returns `401` with a `WWW-Authenticate` header.
6. Completing the OAuth flow from a fresh MCP client (Claude.ai or `npx @modelcontextprotocol/inspector`) yields a usable token.
7. Calling `update_headline` with that token updates a `siteContent` slot and the change appears on the live portfolio within seconds.
8. Nightly cron successfully re-embeds bullets; admin edit triggers an immediate role-scoped re-embed.
9. `get_server_info` returns repo URL, version, and tool count.

## Open questions

None — all architectural decisions resolved during brainstorming.

## References

- MCP spec — https://modelcontextprotocol.io/specification/draft
- MCP Authorization — https://modelcontextprotocol.io/specification/draft/basic/authorization
- RFC 8414 — OAuth 2.0 Authorization Server Metadata
- RFC 7591 — OAuth 2.0 Dynamic Client Registration
- RFC 9728 — OAuth 2.0 Protected Resource Metadata
- Convex vector search — https://docs.convex.dev/search/vector-search
- Hono on Vercel — https://hono.dev/docs/getting-started/vercel
