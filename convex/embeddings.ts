"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { embed } from "./lib/openai";
import { sha256OfText } from "./lib/hash";

/**
 * Node action entrypoints for the embedding pipeline.
 *
 * Convex requires `"use node"` modules to export only actions — queries and
 * mutations must live in a V8-isolate file. The internal queries/mutations
 * these actions delegate to are in `embeddingsHelpers.ts`.
 */

/**
 * Walks every `experienceRoles` row, embeds bullets whose sha256 source-hash
 * is not yet present in `bulletEmbeddings`, and deletes orphan rows whose
 * source bullet no longer exists. Idempotent: cheap re-runs only embed deltas.
 */
export const rebuildAll = action({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.runQuery(api.experienceRoles.list);
    const existing = await ctx.runQuery(internal.embeddingsHelpers.listAllHashes);
    const seenHashes = new Set<string>();

    for (const role of roles) {
      for (const pillar of role.pillars ?? []) {
        for (const bullet of pillar.bullets) {
          const hash = sha256OfText(bullet.text);
          seenHashes.add(hash);
          if (existing.some((e) => e.sourceHash === hash)) continue;
          const vector = await embed(bullet.text);
          await ctx.runMutation(internal.embeddingsHelpers.upsert, {
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

    // Delete orphans (bullets that no longer exist in any role).
    for (const e of existing) {
      if (!seenHashes.has(e.sourceHash)) {
        await ctx.runMutation(internal.embeddingsHelpers.deleteById, { id: e._id });
      }
    }

    return { embedded: seenHashes.size };
  },
});

/**
 * Re-embeds bullets for a single role. Called by `experienceRoles.upsert`
 * after admin edits so the vector index stays in sync without a full rebuild.
 * Only bullets whose hash is not already in the table get embedded.
 */
export const refreshRole = action({
  args: { roleId: v.id("experienceRoles") },
  handler: async (ctx, { roleId }) => {
    const role = await ctx.runQuery(internal.embeddingsHelpers.getRole, { roleId });
    if (!role) return { embedded: 0 };
    let count = 0;
    for (const pillar of role.pillars ?? []) {
      for (const bullet of pillar.bullets) {
        const hash = sha256OfText(bullet.text);
        const existing = await ctx.runQuery(internal.embeddingsHelpers.findByHash, {
          sourceHash: hash,
        });
        if (existing) continue;
        const vector = await embed(bullet.text);
        await ctx.runMutation(internal.embeddingsHelpers.upsert, {
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
