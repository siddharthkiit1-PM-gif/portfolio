# Portfolio MCP Server — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Spec:** [`docs/superpowers/specs/2026-05-13-portfolio-mcp-server-design.md`](../specs/2026-05-13-portfolio-mcp-server-design.md)

**Goal:** Ship an OAuth-protected MCP server at `mcp.siddharth-agrawal.com` exposing 7 tools over the shared Convex backend.

**Architecture:** Separate repo `portfolio-mcp` (Hono + `@modelcontextprotocol/sdk` on Vercel Functions). Shared Convex backend gains new tables (`bulletEmbeddings`, `oauthClients`, `oauthTokens`, `oauthAuthCodes`) and helper functions. Embedding refresh runs on a Convex cron and on `experienceRoles.update`.

**Tech Stack:** Hono, `@modelcontextprotocol/sdk`, `convex`, Node `crypto`, Zod, Vitest, Vercel Functions, OpenAI `text-embedding-3-small` (called from Convex actions only).

---

## Phase A — Portfolio repo: Convex schema + embeddings

Lands in the existing `portfolio` repo. No UI changes.

### Task A1: Add new Convex tables to schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add `bulletEmbeddings`, `oauthClients`, `oauthTokens`, `oauthAuthCodes` tables**

Edit `convex/schema.ts`, add inside `defineSchema({ ... })`:

```ts
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

oauthClients: defineTable({
  clientId: v.string(),
  clientName: v.string(),
  redirectUris: v.array(v.string()),
  createdAt: v.number(),
}).index("by_client_id", ["clientId"]),

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

oauthAuthCodes: defineTable({
  code: v.string(),
  clientId: v.string(),
  userId: v.id("users"),
  redirectUri: v.string(),
  codeChallenge: v.string(),
  codeChallengeMethod: v.string(),
  scopes: v.array(v.string()),
  expiresAt: v.number(),
  consumedAt: v.optional(v.number()),
}).index("by_code", ["code"]),
```

- [ ] **Step 2: Run `pnpm exec convex dev` and verify schema validates**

Run: `pnpm exec convex dev --once`
Expected: no schema errors; the four new tables are pushed.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts convex/_generated
git commit -m "feat(convex): add MCP server tables (embeddings, oauth)"
```

### Task A2: OpenAI embedding helper (Convex action)

**Files:**
- Create: `convex/lib/openai.ts`
- Create: `convex/embeddings.ts`
- Test: `convex/embeddings.test.ts`

- [ ] **Step 1: Write the failing test**

Create `convex/embeddings.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { sha256OfText } from "./lib/hash";

describe("sha256OfText", () => {
  it("hashes deterministically", () => {
    expect(sha256OfText("hello")).toBe(sha256OfText("hello"));
    expect(sha256OfText("hello")).not.toBe(sha256OfText("world"));
  });
});
```

Run: `pnpm exec vitest run convex/embeddings.test.ts`
Expected: FAIL — `Cannot find module './lib/hash'`

- [ ] **Step 2: Create `convex/lib/hash.ts`**

```ts
import { createHash } from "node:crypto";
export function sha256OfText(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
```

- [ ] **Step 3: Create `convex/lib/openai.ts`**

```ts
"use node";
export async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured in Convex env");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}
```

- [ ] **Step 4: Create `convex/embeddings.ts` with `rebuildAll` and `refreshRole` actions**

```ts
"use node";
import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { embed } from "./lib/openai";
import { sha256OfText } from "./lib/hash";

export const rebuildAll = action({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.runQuery(api.experienceRoles.list);
    const existing = await ctx.runQuery(internal.embeddings.listAllHashes);
    const seenHashes = new Set<string>();

    for (const role of roles) {
      for (const pillar of role.pillars ?? []) {
        for (const bullet of pillar.bullets) {
          const hash = sha256OfText(bullet.text);
          seenHashes.add(hash);
          if (existing.some((e) => e.sourceHash === hash)) continue;
          const vector = await embed(bullet.text);
          await ctx.runMutation(internal.embeddings.upsert, {
            roleCompany: role.company,
            roleDates: role.dates,
            pillarLabel: pillar.label,
            bulletText: bullet.text,
            metric: bullet.metric,
            embedding: vector,
            sourceHash: hash,
          });
        }
      }
    }

    // Delete orphans (bullets that no longer exist)
    for (const e of existing) {
      if (!seenHashes.has(e.sourceHash)) {
        await ctx.runMutation(internal.embeddings.deleteById, { id: e._id });
      }
    }

    return { embedded: seenHashes.size };
  },
});

export const refreshRole = action({
  args: { roleId: v.id("experienceRoles") },
  handler: async (ctx, { roleId }) => {
    const role = await ctx.runQuery(internal.embeddings.getRole, { roleId });
    if (!role) return { embedded: 0 };
    let count = 0;
    for (const pillar of role.pillars ?? []) {
      for (const bullet of pillar.bullets) {
        const hash = sha256OfText(bullet.text);
        const existing = await ctx.runQuery(internal.embeddings.findByHash, { sourceHash: hash });
        if (existing) continue;
        const vector = await embed(bullet.text);
        await ctx.runMutation(internal.embeddings.upsert, {
          roleCompany: role.company,
          roleDates: role.dates,
          pillarLabel: pillar.label,
          bulletText: bullet.text,
          metric: bullet.metric,
          embedding: vector,
          sourceHash: hash,
        });
        count++;
      }
    }
    return { embedded: count };
  },
});

export const listAllHashes = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("bulletEmbeddings").collect();
    return rows.map((r) => ({ _id: r._id, sourceHash: r.sourceHash }));
  },
});

export const findByHash = internalQuery({
  args: { sourceHash: v.string() },
  handler: async (ctx, { sourceHash }) =>
    ctx.db.query("bulletEmbeddings").withIndex("by_source_hash", (q) => q.eq("sourceHash", sourceHash)).first(),
});

export const getRole = internalQuery({
  args: { roleId: v.id("experienceRoles") },
  handler: async (ctx, { roleId }) => ctx.db.get(roleId),
});

export const upsert = internalMutation({
  args: {
    roleCompany: v.string(),
    roleDates: v.string(),
    pillarLabel: v.string(),
    bulletText: v.string(),
    metric: v.optional(v.string()),
    embedding: v.array(v.float64()),
    sourceHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bulletEmbeddings")
      .withIndex("by_source_hash", (q) => q.eq("sourceHash", args.sourceHash))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert("bulletEmbeddings", { ...args, updatedAt: now });
  },
});

export const deleteById = internalMutation({
  args: { id: v.id("bulletEmbeddings") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
```

- [ ] **Step 5: Re-run hash test**

Run: `pnpm exec vitest run convex/embeddings.test.ts`
Expected: PASS

- [ ] **Step 6: Set `OPENAI_API_KEY` in Convex env**

Run: `pnpm exec convex env set OPENAI_API_KEY sk-...`

- [ ] **Step 7: Seed embeddings**

Run: `pnpm exec convex run embeddings:rebuildAll`
Expected: returns `{ embedded: N }` where N matches the bullet count in `EXPERIENCE_ROLE_DEFAULTS`.

- [ ] **Step 8: Commit**

```bash
git add convex/lib convex/embeddings.ts convex/embeddings.test.ts convex/_generated
git commit -m "feat(convex): embedding pipeline for resume bullets"
```

### Task A3: Vector search action

**Files:**
- Create: `convex/mcp.ts`
- Test: `convex/mcp.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { validateK } from "./mcp";

describe("validateK", () => {
  it("defaults to 5 when k is undefined", () => {
    expect(validateK(undefined)).toBe(5);
  });
  it("clamps to max 20", () => {
    expect(validateK(50)).toBe(20);
  });
  it("rejects negative", () => {
    expect(validateK(-1)).toBe(1);
  });
});
```

Run: `pnpm exec vitest run convex/mcp.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 2: Create `convex/mcp.ts`**

```ts
"use node";
import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { embed } from "./lib/openai";

export function validateK(k: number | undefined): number {
  if (k === undefined) return 5;
  return Math.max(1, Math.min(20, Math.floor(k)));
}

export const searchBullets = action({
  args: { query: v.string(), k: v.optional(v.number()) },
  handler: async (ctx, { query, k }) => {
    const limit = validateK(k);
    const vector = await embed(query);
    const hits = await ctx.vectorSearch("bulletEmbeddings", "by_embedding", {
      vector,
      limit,
    });
    const out = [];
    for (const hit of hits) {
      const doc = await ctx.runQuery(internal.mcp.getEmbeddingDoc, { id: hit._id });
      if (!doc) continue;
      out.push({
        roleCompany: doc.roleCompany,
        roleDates: doc.roleDates,
        pillarLabel: doc.pillarLabel,
        text: doc.bulletText,
        metric: doc.metric,
        score: hit._score,
      });
    }
    return { hits: out };
  },
});

export const getEmbeddingDoc = internal.mcp_getEmbeddingDocPlaceholder; // replaced below
```

Wait — `getEmbeddingDoc` needs to be defined here as an `internalQuery`, not a placeholder. Replace the last line with:

```ts
import { internalQuery } from "./_generated/server";
export const getEmbeddingDoc = internalQuery({
  args: { id: v.id("bulletEmbeddings") },
  handler: (ctx, { id }) => ctx.db.get(id),
});
```

And remove the placeholder line. Final file:

```ts
"use node";
import { v } from "convex/values";
import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { embed } from "./lib/openai";

export function validateK(k: number | undefined): number {
  if (k === undefined) return 5;
  return Math.max(1, Math.min(20, Math.floor(k)));
}

export const searchBullets = action({
  args: { query: v.string(), k: v.optional(v.number()) },
  handler: async (ctx, { query, k }) => {
    const limit = validateK(k);
    const vector = await embed(query);
    const hits = await ctx.vectorSearch("bulletEmbeddings", "by_embedding", { vector, limit });
    const out = [];
    for (const hit of hits) {
      const doc = await ctx.runQuery(internal.mcp.getEmbeddingDoc, { id: hit._id });
      if (!doc) continue;
      out.push({
        roleCompany: doc.roleCompany,
        roleDates: doc.roleDates,
        pillarLabel: doc.pillarLabel,
        text: doc.bulletText,
        metric: doc.metric,
        score: hit._score,
      });
    }
    return { hits: out };
  },
});

export const getEmbeddingDoc = internalQuery({
  args: { id: v.id("bulletEmbeddings") },
  handler: (ctx, { id }) => ctx.db.get(id),
});
```

- [ ] **Step 3: Run test**

Run: `pnpm exec vitest run convex/mcp.test.ts`
Expected: PASS

- [ ] **Step 4: Smoke test the action**

Run: `pnpm exec convex run mcp:searchBullets '{"query":"retention work","k":3}'`
Expected: returns 3 hits with the 18% retention bullet at top.

- [ ] **Step 5: Commit**

```bash
git add convex/mcp.ts convex/mcp.test.ts convex/_generated
git commit -m "feat(convex): vector search action for MCP server"
```

### Task A4: `getResume` aggregator query + cron

**Files:**
- Modify: `convex/mcp.ts` (add `getResume` query)
- Create: `convex/crons.ts` (or modify existing)

- [ ] **Step 1: Add `getResume` query to `convex/mcp.ts`**

```ts
import { query } from "./_generated/server";

export const getResume = query({
  args: {},
  handler: async (ctx) => {
    const [roles, projects, contact] = await Promise.all([
      ctx.db.query("experienceRoles").withIndex("by_order").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("siteContacts").withIndex("by_key", (q) => q.eq("key", "primary")).first(),
    ]);
    return {
      name: "Siddharth Agrawal",
      headline: "Product Manager",
      location: "Bangalore",
      roles: roles.sort((a, b) => a.order - b.order).map((r) => ({
        company: r.company,
        title: r.title,
        dates: r.dates,
        location: r.location,
        metric: r.metric,
        outcome: r.outcome,
        pillars: r.pillars ?? [],
      })),
      projects: projects.map((p) => ({
        slug: p.slug,
        title: p.title,
        problem: p.problem,
        approach: p.approach,
        outcome: p.outcomeNarrative,
        metric: p.metric,
        links: { live: p.liveUrl, github: p.githubUrl },
      })),
      contact: {
        email: contact?.email,
        linkedin: contact?.linkedinUrl,
        github: contact?.githubUrl,
        phone: contact?.phone,
        calendly: contact?.calendlyUrl,
      },
    };
  },
});
```

Note: validate the actual field names in `convex/schema.ts` for `projects` and `siteContacts` — the values above may need adjustment to match real column names.

- [ ] **Step 2: Add nightly cron in `convex/crons.ts`**

If the file doesn't exist, create it:

```ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "rebuild embeddings",
  { hourUTC: 3, minuteUTC: 0 }, // 3am UTC = 8:30am IST
  internal.embeddings.rebuildAll,
);

export default crons;
```

If the file exists, append the `crons.daily(...)` line.

- [ ] **Step 3: Verify cron is registered**

Run: `pnpm exec convex dev --once`
Expected: cron appears in deployment.

- [ ] **Step 4: Commit**

```bash
git add convex/mcp.ts convex/crons.ts convex/_generated
git commit -m "feat(convex): getResume query + nightly embedding cron"
```

### Task A5: Hook embedding refresh into `experienceRoles.update`

**Files:**
- Modify: `convex/experienceRoles.ts`

- [ ] **Step 1: Read current `experienceRoles.update`**

- [ ] **Step 2: Schedule `embeddings.refreshRole` after the mutation completes**

At the end of the existing `update` mutation handler, before `return`:

```ts
await ctx.scheduler.runAfter(0, internal.embeddings.refreshRole, { roleId });
```

(Import `internal` from `./_generated/api` if not already imported. `refreshRole` must be re-declared as `internalAction` if the rest of the file uses `internal.*` — adjust visibility in `convex/embeddings.ts` accordingly.)

- [ ] **Step 3: Test the wire-up**

In `/admin/edit`, change one bullet on a role. Wait ~3 seconds. Run:
`pnpm exec convex run mcp:searchBullets '{"query":"<the new text>"}'`
Expected: the updated bullet is in the top hit.

- [ ] **Step 4: Commit**

```bash
git add convex/experienceRoles.ts convex/embeddings.ts convex/_generated
git commit -m "feat(convex): re-embed role bullets on update"
```

---

## Phase B — New repo: scaffolding

### Task B1: Initialize `portfolio-mcp` repo

**Files:**
- Create: `~/portfolio-mcp/package.json`
- Create: `~/portfolio-mcp/tsconfig.json`
- Create: `~/portfolio-mcp/.gitignore`
- Create: `~/portfolio-mcp/README.md`
- Create: `~/portfolio-mcp/vercel.ts`

- [ ] **Step 1: Create directory and init**

```bash
mkdir -p /Users/siddharthagrawal/portfolio-mcp
cd /Users/siddharthagrawal/portfolio-mcp
git init
pnpm init
```

- [ ] **Step 2: Install deps**

```bash
pnpm add hono @modelcontextprotocol/sdk convex zod
pnpm add -D typescript @types/node tsx vitest @vitest/coverage-v8
pnpm add -D @vercel/config
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": "./",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*", "api/**/*", "tests/**/*", "vercel.ts"]
}
```

- [ ] **Step 4: Write `vercel.ts`**

```ts
import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  buildCommand: "pnpm typecheck",
  framework: null,
};
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules
.env*
.vercel
dist
coverage
.DS_Store
```

- [ ] **Step 6: Update `package.json` scripts**

```json
"scripts": {
  "dev": "vercel dev",
  "build": "tsc --noEmit",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 7: First commit**

```bash
git add -A
git commit -m "chore: scaffold portfolio-mcp repo"
```

### Task B2: Env loader and Convex client

**Files:**
- Create: `src/env.ts`
- Create: `src/convex.ts`
- Test: `src/env.test.ts`

- [ ] **Step 1: Failing test**

`src/env.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { loadEnv } from "./env";

describe("loadEnv", () => {
  it("throws when CONVEX_URL is missing", () => {
    expect(() => loadEnv({})).toThrow(/CONVEX_URL/);
  });
  it("parses a complete env", () => {
    const env = loadEnv({
      CONVEX_URL: "https://example.convex.cloud",
      SESSION_SECRET: "a".repeat(32),
      PUBLIC_BASE_URL: "https://mcp.example.com",
    });
    expect(env.CONVEX_URL).toBe("https://example.convex.cloud");
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement `src/env.ts`**

```ts
import { z } from "zod";

const schema = z.object({
  CONVEX_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  PUBLIC_BASE_URL: z.string().url(),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  return schema.parse(source);
}
```

- [ ] **Step 3: Run test, expect PASS**

- [ ] **Step 4: Create `src/convex.ts`**

```ts
import { ConvexHttpClient } from "convex/browser";
import { loadEnv } from "./env";

let _client: ConvexHttpClient | null = null;

export function getConvex(): ConvexHttpClient {
  if (_client) return _client;
  const env = loadEnv();
  _client = new ConvexHttpClient(env.CONVEX_URL);
  return _client;
}
```

- [ ] **Step 5: Commit**

```bash
git add src tests
git commit -m "feat: env loader + Convex client singleton"
```

### Task B3: Hono app skeleton + Vercel handler

**Files:**
- Create: `src/app.ts`
- Create: `api/[[...path]].ts`

- [ ] **Step 1: Write `src/app.ts`**

```ts
import { Hono } from "hono";

export function createApp() {
  const app = new Hono();
  app.get("/", (c) => c.json({ name: "portfolio-mcp", status: "ok" }));
  return app;
}
```

- [ ] **Step 2: Write `api/[[...path]].ts`**

```ts
import { handle } from "hono/vercel";
import { createApp } from "../src/app";

export const config = { runtime: "nodejs" };
const app = createApp();
export default handle(app);
```

- [ ] **Step 3: Test**

`tests/app.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createApp } from "../src/app";

describe("app", () => {
  it("returns ok at root", async () => {
    const app = createApp();
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: "portfolio-mcp", status: "ok" });
  });
});
```

Run: PASS.

- [ ] **Step 4: Commit**

```bash
git add src api tests
git commit -m "feat: Hono skeleton + Vercel handler"
```

---

## Phase C — OAuth endpoints

### Task C1: Well-known metadata

**Files:**
- Create: `src/oauth/metadata.ts`
- Test: `tests/oauth/metadata.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { createApp } from "../../src/app";

describe("oauth metadata", () => {
  it("returns authorization server metadata", async () => {
    const app = createApp();
    const res = await app.request("/.well-known/oauth-authorization-server");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authorization_endpoint).toContain("/oauth/authorize");
    expect(body.token_endpoint).toContain("/oauth/token");
    expect(body.registration_endpoint).toContain("/oauth/register");
    expect(body.code_challenge_methods_supported).toContain("S256");
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/oauth/metadata.ts
import { Hono } from "hono";
import { loadEnv } from "../env";

export function mountMetadata(app: Hono) {
  app.get("/.well-known/oauth-authorization-server", (c) => {
    const base = loadEnv().PUBLIC_BASE_URL;
    return c.json({
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      registration_endpoint: `${base}/oauth/register`,
      revocation_endpoint: `${base}/oauth/revoke`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["admin"],
    });
  });

  app.get("/.well-known/oauth-protected-resource", (c) => {
    const base = loadEnv().PUBLIC_BASE_URL;
    return c.json({
      resource: `${base}/mcp`,
      authorization_servers: [base],
      scopes_supported: ["admin"],
    });
  });
}
```

Register in `src/app.ts`:

```ts
import { mountMetadata } from "./oauth/metadata";
// inside createApp:
mountMetadata(app);
```

- [ ] **Step 3: Run test → PASS, commit**

```bash
git commit -am "feat(oauth): well-known metadata endpoints"
```

### Task C2: Dynamic client registration

**Files:**
- Create: `src/oauth/register.ts`
- Test: `tests/oauth/register.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { createApp } from "../../src/app";

vi.mock("../../src/convex", () => ({
  getConvex: () => ({
    mutation: vi.fn().mockResolvedValue({ clientId: "client_test123" }),
  }),
}));

describe("/oauth/register", () => {
  it("registers a client", async () => {
    const app = createApp();
    const res = await app.request("/oauth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Test Agent",
        redirect_uris: ["https://example.com/cb"],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.client_id).toBeTruthy();
    expect(body.redirect_uris).toEqual(["https://example.com/cb"]);
  });
});
```

- [ ] **Step 2: Implement `src/oauth/register.ts`**

```ts
import { Hono } from "hono";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { getConvex } from "../convex";
import { api } from "../convex-api";

const RegisterBody = z.object({
  client_name: z.string().min(1).max(200),
  redirect_uris: z.array(z.string().url()).min(1).max(5),
});

export function mountRegister(app: Hono) {
  app.post("/oauth/register", async (c) => {
    const json = await c.req.json().catch(() => null);
    const parsed = RegisterBody.safeParse(json);
    if (!parsed.success) return c.json({ error: "invalid_client_metadata" }, 400);
    const clientId = `mcp_${randomBytes(16).toString("base64url")}`;
    await getConvex().mutation(api.oauthClients.create, {
      clientId,
      clientName: parsed.data.client_name,
      redirectUris: parsed.data.redirect_uris,
    });
    return c.json(
      {
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name: parsed.data.client_name,
        redirect_uris: parsed.data.redirect_uris,
        token_endpoint_auth_method: "none",
      },
      201,
    );
  });
}
```

Note: `src/convex-api.ts` is a thin re-export of the portfolio's generated Convex API types. The plan adds this in Task B4 — if missing, add now:

```ts
// src/convex-api.ts
// Import types from the portfolio's published convex deployment.
// In practice: pnpm add file:../portfolio (if running locally) or copy convex/_generated/api.d.ts.
// Simplest: copy api.d.ts into this repo and re-export.
export * from "./convex-api-generated";
```

This requires a generated API to be copied or linked. The cleanest path is: publish portfolio's `convex/_generated` as a local file dep via `pnpm add file:../portfolio/convex` or copy the d.ts.

Also need portfolio-side mutation `convex/oauthClients.ts` with `create`, `getByClientId`. Add as a side-task to Phase A.

- [ ] **Step 3: Add `convex/oauthClients.ts` in portfolio repo**

```ts
// portfolio/convex/oauthClients.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    clientId: v.string(),
    clientName: v.string(),
    redirectUris: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthClients", { ...args, createdAt: Date.now() });
    return { clientId: args.clientId };
  },
});

export const getByClientId = query({
  args: { clientId: v.string() },
  handler: (ctx, { clientId }) =>
    ctx.db.query("oauthClients").withIndex("by_client_id", (q) => q.eq("clientId", clientId)).first(),
});
```

Commit both repos.

- [ ] **Step 4: Run test → PASS, commit**

```bash
# In portfolio-mcp:
git commit -am "feat(oauth): dynamic client registration"
# In portfolio:
git add convex/oauthClients.ts convex/_generated
git commit -m "feat(convex): oauthClients create/get"
```

### Task C3: Authorize endpoint (GET = consent page, POST = approve)

**Files:**
- Create: `src/oauth/authorize.ts`
- Create: `src/session/cookie.ts`
- Test: `tests/oauth/authorize.test.ts`

- [ ] **Step 1: Implement signed session cookie helper**

`src/session/cookie.ts`:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function sign(value: string, secret: string): string {
  const mac = createHmac("sha256", secret).update(value).digest("base64url");
  return `${value}.${mac}`;
}

export function verify(signed: string, secret: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = createHmac("sha256", secret).update(value).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? value : null;
}
```

- [ ] **Step 2: Implement authorize handler**

`src/oauth/authorize.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { getCookie, setCookie } from "hono/cookie";
import { getConvex } from "../convex";
import { loadEnv } from "../env";
import { sign, verify } from "../session/cookie";
import { api } from "../convex-api";

const AuthorizeQuery = z.object({
  response_type: z.literal("code"),
  client_id: z.string(),
  redirect_uri: z.string().url(),
  code_challenge: z.string(),
  code_challenge_method: z.literal("S256"),
  scope: z.string().optional(),
  state: z.string().optional(),
});

export function mountAuthorize(app: Hono) {
  app.get("/oauth/authorize", async (c) => {
    const parsed = AuthorizeQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
    if (!parsed.success) return c.text("invalid_request", 400);

    const client = await getConvex().query(api.oauthClients.getByClientId, {
      clientId: parsed.data.client_id,
    });
    if (!client) return c.text("unknown_client", 400);
    if (!client.redirectUris.includes(parsed.data.redirect_uri)) {
      return c.text("redirect_uri not registered", 400);
    }

    const env = loadEnv();
    const sessionCookie = getCookie(c, "mcp_sid");
    const userId = sessionCookie ? verify(sessionCookie, env.SESSION_SECRET) : null;

    if (!userId) {
      // Render sign-in page (stub for v1: prompt for admin token)
      return c.html(signInHtml(c.req.url));
    }

    // Render consent page
    return c.html(consentHtml(client.clientName, parsed.data));
  });

  app.post("/oauth/authorize", async (c) => {
    const form = await c.req.formData();
    const action = form.get("action") as string;
    if (action === "sign-in") {
      const token = form.get("admin_token") as string;
      const env = loadEnv();
      // Validate token via Convex
      const user = await getConvex().query(api.users.getAdminByToken, { token });
      if (!user) return c.text("invalid_token", 401);
      setCookie(c, "mcp_sid", sign(user._id, env.SESSION_SECRET), {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return c.redirect(form.get("return_to") as string);
    }

    if (action === "approve") {
      const env = loadEnv();
      const sessionCookie = getCookie(c, "mcp_sid");
      const userId = sessionCookie ? verify(sessionCookie, env.SESSION_SECRET) : null;
      if (!userId) return c.text("unauthorized", 401);

      const clientId = form.get("client_id") as string;
      const redirectUri = form.get("redirect_uri") as string;
      const codeChallenge = form.get("code_challenge") as string;
      const state = form.get("state") as string | null;

      const code = randomBytes(32).toString("base64url");
      await getConvex().mutation(api.oauthAuthCodes.create, {
        code,
        clientId,
        userId: userId as any,
        redirectUri,
        codeChallenge,
        codeChallengeMethod: "S256",
        scopes: ["admin"],
        expiresAt: Date.now() + 60 * 1000,
      });

      const url = new URL(redirectUri);
      url.searchParams.set("code", code);
      if (state) url.searchParams.set("state", state);
      return c.redirect(url.toString());
    }

    return c.text("invalid_action", 400);
  });
}

function signInHtml(returnTo: string): string {
  return `<!doctype html><html><body>
    <h1>Portfolio MCP — admin sign-in</h1>
    <form method="post" action="/oauth/authorize">
      <input type="hidden" name="action" value="sign-in" />
      <input type="hidden" name="return_to" value="${returnTo}" />
      <input name="admin_token" placeholder="paste admin token" autofocus />
      <button>Sign in</button>
    </form>
  </body></html>`;
}

function consentHtml(clientName: string, q: { client_id: string; redirect_uri: string; code_challenge: string; state?: string }): string {
  return `<!doctype html><html><body>
    <h1>${clientName} wants admin access</h1>
    <form method="post" action="/oauth/authorize">
      <input type="hidden" name="action" value="approve" />
      <input type="hidden" name="client_id" value="${q.client_id}" />
      <input type="hidden" name="redirect_uri" value="${q.redirect_uri}" />
      <input type="hidden" name="code_challenge" value="${q.code_challenge}" />
      ${q.state ? `<input type="hidden" name="state" value="${q.state}" />` : ""}
      <button>Approve</button>
    </form>
  </body></html>`;
}
```

Portfolio side: add `convex/oauthAuthCodes.ts` (create, consumeByCode) and `convex/users.getAdminByToken` (validates a one-time admin sign-in token you set in Convex env, e.g. `ADMIN_BOOTSTRAP_TOKEN`).

- [ ] **Step 3: Tests for authorize (happy path + invalid_request)**

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(oauth): authorize + consent + sign-in"
```

### Task C4: Token endpoint

**Files:**
- Create: `src/oauth/token.ts`
- Test: `tests/oauth/token.test.ts`

- [ ] **Step 1: Implement**

```ts
import { Hono } from "hono";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { getConvex } from "../convex";
import { api } from "../convex-api";

const TokenBody = z.discriminatedUnion("grant_type", [
  z.object({
    grant_type: z.literal("authorization_code"),
    code: z.string(),
    redirect_uri: z.string().url(),
    client_id: z.string(),
    code_verifier: z.string(),
  }),
  z.object({
    grant_type: z.literal("refresh_token"),
    refresh_token: z.string(),
    client_id: z.string(),
  }),
]);

export function mountToken(app: Hono) {
  app.post("/oauth/token", async (c) => {
    const form = Object.fromEntries(await c.req.formData());
    const parsed = TokenBody.safeParse(form);
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    if (parsed.data.grant_type === "authorization_code") {
      const consumed = await getConvex().mutation(api.oauthAuthCodes.consume, {
        code: parsed.data.code,
        clientId: parsed.data.client_id,
        redirectUri: parsed.data.redirect_uri,
      });
      if (!consumed) return c.json({ error: "invalid_grant" }, 400);

      // PKCE verification: base64url(sha256(verifier)) === codeChallenge
      const computed = createHash("sha256")
        .update(parsed.data.code_verifier)
        .digest("base64url");
      if (computed !== consumed.codeChallenge) {
        return c.json({ error: "invalid_grant" }, 400);
      }

      const accessToken = randomBytes(32).toString("base64url");
      const refreshToken = randomBytes(32).toString("base64url");
      await getConvex().mutation(api.oauthTokens.create, {
        token: accessToken,
        refreshToken,
        clientId: parsed.data.client_id,
        userId: consumed.userId,
        scopes: consumed.scopes,
        expiresAt: Date.now() + 3600 * 1000,
      });

      return c.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: refreshToken,
        scope: consumed.scopes.join(" "),
      });
    }

    // Refresh flow
    const refreshed = await getConvex().mutation(api.oauthTokens.rotate, {
      refreshToken: parsed.data.refresh_token,
      clientId: parsed.data.client_id,
    });
    if (!refreshed) return c.json({ error: "invalid_grant" }, 400);
    return c.json({
      access_token: refreshed.accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refreshed.refreshToken,
      scope: refreshed.scopes.join(" "),
    });
  });
}
```

Portfolio side: `convex/oauthTokens.ts` with `create`, `rotate`, `getByToken`, `revoke`. `convex/oauthAuthCodes.ts` with `consume` (atomic: lookup + check expiry + mark consumed in one mutation).

- [ ] **Step 2: Tests**

- [ ] **Step 3: Commit**

### Task C5: Revoke endpoint

**Files:**
- Create: `src/oauth/revoke.ts`

- [ ] **Step 1: Implement** (calls `api.oauthTokens.revoke`)
- [ ] **Step 2: Test**
- [ ] **Step 3: Commit**

---

## Phase D — MCP transport + tools

### Task D1: MCP server bootstrap with Streamable HTTP transport

**Files:**
- Create: `src/mcp/server.ts`

- [ ] **Step 1: Implement**

```ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Hono } from "hono";
import { tools } from "./tools/index";
import { validateBearer } from "./auth";

export function mountMcp(app: Hono) {
  app.all("/mcp", async (c) => {
    const server = new Server(
      { name: "portfolio-mcp", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (req) => {
      const tool = tools.find((t) => t.name === req.params.name);
      if (!tool) throw new Error(`Unknown tool: ${req.params.name}`);
      if (tool.requiresScope) {
        const ctx = await validateBearer(c.req.header("authorization"), tool.requiresScope);
        return tool.handler(req.params.arguments ?? {}, ctx);
      }
      return tool.handler(req.params.arguments ?? {}, null);
    });

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    return transport.handleRequest(c.req.raw, c.res);
  });
}
```

(The exact Hono ↔ Streamable HTTP plumbing may need a small adapter — verify against `@modelcontextprotocol/sdk` examples at implementation time.)

- [ ] **Step 2: Auth middleware**

`src/mcp/auth.ts`:

```ts
import { getConvex } from "../convex";
import { api } from "../convex-api";

export type AuthContext = { userId: string; scopes: string[] };

export async function validateBearer(header: string | undefined, requiredScope: string): Promise<AuthContext> {
  if (!header?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer resource_metadata="${process.env.PUBLIC_BASE_URL}/.well-known/oauth-protected-resource"`,
      },
    });
  }
  const token = header.slice(7);
  const row = await getConvex().query(api.oauthTokens.getByToken, { token });
  if (!row || row.revokedAt || row.expiresAt < Date.now()) {
    throw new Response(JSON.stringify({ error: "invalid_token" }), { status: 401 });
  }
  if (!row.scopes.includes(requiredScope)) {
    throw new Response(JSON.stringify({ error: "insufficient_scope" }), { status: 403 });
  }
  return { userId: row.userId, scopes: row.scopes };
}
```

- [ ] **Step 3: Commit**

### Task D2: Tool — `get_resume`

**Files:**
- Create: `src/mcp/tools/getResume.ts`
- Create: `src/mcp/tools/index.ts`

```ts
import { z } from "zod";
import { getConvex } from "../../convex";
import { api } from "../../convex-api";

export const getResumeTool = {
  name: "get_resume",
  description: "Returns the full structured resume for Siddharth Agrawal.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false } as const,
  handler: async () => {
    const resume = await getConvex().query(api.mcp.getResume, {});
    return { content: [{ type: "text" as const, text: JSON.stringify(resume) }] };
  },
};
```

In `src/mcp/tools/index.ts`:

```ts
import { getResumeTool } from "./getResume";
// ... import others as they land

export const tools = [getResumeTool /* , ... */];
```

- [ ] Test, then commit.

### Task D3: Tool — `get_experience`, `get_projects`, `get_contact`

Same pattern as D2. Each is a thin Convex query passthrough.

- [ ] Implement, test, commit each.

### Task D4: Tool — `search_experience`

```ts
export const searchExperienceTool = {
  name: "search_experience",
  description: "Semantic search across resume bullets. Returns top-k matches by cosine similarity.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      k: { type: "integer", minimum: 1, maximum: 20 },
    },
    required: ["query"],
  } as const,
  handler: async (args: { query: string; k?: number }) => {
    const result = await getConvex().action(api.mcp.searchBullets, args);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  },
};
```

Test, commit.

### Task D5: Tool — `update_headline` (admin scope)

```ts
import type { AuthContext } from "../auth";

const ALLOWED_SLOTS = new Set([
  "home.about.headline",
  "home.experience.headline",
  "home.contact.headline",
  "home.hero.headline",
]);

export const updateHeadlineTool = {
  name: "update_headline",
  description: "Update a portfolio headline. Requires admin scope.",
  requiresScope: "admin",
  inputSchema: {
    type: "object",
    properties: {
      slot: { type: "string" },
      text: { type: "string", maxLength: 200 },
    },
    required: ["slot", "text"],
  } as const,
  handler: async (args: { slot: string; text: string }, _auth: AuthContext) => {
    if (!ALLOWED_SLOTS.has(args.slot)) {
      throw new Error(`slot not editable via MCP: ${args.slot}`);
    }
    const [page, ...rest] = args.slot.split(".");
    const slot = rest.join(".");
    const json = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: args.text }] }] };
    await getConvex().mutation(api.siteContent.upsert, { page, slot, valueJson: json });
    return { content: [{ type: "text" as const, text: `ok: ${args.slot} updated` }] };
  },
};
```

Test, commit.

### Task D6: Tool — `get_server_info`

```ts
export const getServerInfoTool = {
  name: "get_server_info",
  description: "Returns metadata about this MCP server: author, source code URL, version.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false } as const,
  handler: async () => {
    const info = {
      author: "Siddharth Agrawal",
      sourceUrl: "https://github.com/siddharthkiit1-PM-gif/portfolio-mcp",
      buildVersion: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      toolCount: 7,
      oauthMetadataUrl: `${process.env.PUBLIC_BASE_URL}/.well-known/oauth-authorization-server`,
      capabilities: ["resume", "experience", "projects", "contact", "semantic-search", "headline-edit"],
    };
    return { content: [{ type: "text" as const, text: JSON.stringify(info) }] };
  },
};
```

Test, commit.

---

## Phase E — Integration tests + Vercel deploy

### Task E1: Full OAuth + tool flow integration test

`tests/integration/full-flow.test.ts`:

- [ ] Spins up the Hono app in-process
- [ ] Walks: register → authorize (with mocked session) → token exchange → call `update_headline`
- [ ] Asserts 200 response and that `siteContent.upsert` was called with expected args

- [ ] Commit.

### Task E2: Create GitHub repo and push

```bash
cd /Users/siddharthagrawal/portfolio-mcp
gh repo create portfolio-mcp --private --source=. --remote=origin
git push -u origin main
```

### Task E3: Create Vercel project, set env, add domain

- [ ] In the Vercel dashboard or via `vercel link`, create project `portfolio-mcp` from the GitHub repo
- [ ] Add env vars: `CONVEX_URL`, `SESSION_SECRET` (32 random bytes), `PUBLIC_BASE_URL=https://mcp.siddharth-agrawal.com`
- [ ] Add custom domain `mcp.siddharth-agrawal.com`
- [ ] First deploy auto-runs on push

### Task E4: Smoke tests against production

- [ ] `curl https://mcp.siddharth-agrawal.com/.well-known/oauth-authorization-server` returns metadata JSON
- [ ] Use `npx @modelcontextprotocol/inspector` against `https://mcp.siddharth-agrawal.com/mcp` and verify all 7 tools list
- [ ] Run `get_resume` from the inspector — confirm output matches live portfolio
- [ ] Run `search_experience({ query: "retention work" })` — confirm top hit is the 18% retention bullet
- [ ] Complete OAuth flow + call `update_headline` — confirm live portfolio updates

### Task E5: README

Write `README.md` with:
- What it is
- Architecture overview (link to spec)
- How to connect from Claude.ai / inspector
- Tool reference table
- OAuth flow diagram

Commit.

---

## Self-Review Notes

Inline checks performed against the spec:

- [x] Every tool from the spec has an implementation task (D2–D6)
- [x] All four new Convex tables defined in A1 with matching indexes from the spec
- [x] Embedding pipeline (rebuildAll + refreshRole + cron) covered in A2–A5
- [x] OAuth metadata, register, authorize, token, revoke all covered in C1–C5
- [x] Auth middleware (`validateBearer`) with WWW-Authenticate header in D1
- [x] Acceptance criteria 1–9 from the spec map to tasks E4 verification
- [x] PKCE verification present in C4 (sha256 + base64url)
- [x] Schema additions are non-breaking (all new tables, no field changes to existing tables)

Known approximations (resolve at implementation time):
- Exact Hono ↔ Streamable HTTP plumbing in D1 needs to match `@modelcontextprotocol/sdk` examples
- `convex-api.ts` strategy: either copy `_generated/api.d.ts` from portfolio repo or set up a workspace link
- Field names in `siteContacts` / `projects` may differ slightly from spec column names — validate in A4 against `convex/schema.ts`

---

## Execution Handoff

Plan complete. Two execution options:

1. **Subagent-Driven (recommended)** — fresh implementer + spec reviewer + code quality reviewer per task
2. **Inline Execution** — execute tasks in this session with checkpoints

Pick one and we proceed.
