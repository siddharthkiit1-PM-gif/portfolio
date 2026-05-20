"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { embed } from "./lib/openai";

/**
 * Node action entrypoints for the MCP server's semantic search.
 *
 * Convex requires `"use node"` modules to export only actions — queries and
 * mutations must live in a V8-isolate file. The internal query
 * `getEmbeddingDoc` lives in `mcpHelpers.ts`. Pure helpers like `validateK`
 * are fine alongside actions in a Node module.
 */

/**
 * Normalises the `k` parameter for `searchBullets`. Defaults to 5 when
 * undefined, clamps into `[1, 20]`, and floors fractional values so the
 * vector-search `limit` is always a sane positive integer.
 */
export function validateK(k: number | undefined): number {
  if (k === undefined) return 5;
  return Math.max(1, Math.min(20, Math.floor(k)));
}

/**
 * Semantic search over resume bullets. Embeds the query via OpenAI
 * text-embedding-3-small, runs Convex's vectorSearch over
 * `bulletEmbeddings.by_embedding`, then joins each hit back to its bullet
 * text + metadata via `internal.mcpHelpers.getEmbeddingDoc`.
 */
export const searchBullets = action({
  args: { query: v.string(), k: v.optional(v.number()) },
  handler: async (ctx, { query, k }) => {
    const limit = validateK(k);
    const vector = await embed(query);
    const hits = await ctx.vectorSearch("bulletEmbeddings", "by_embedding", {
      vector,
      limit,
    });
    const out = [] as Array<{
      roleCompany: string;
      roleDates: string;
      pillarLabel: string;
      text: string;
      metric: string | undefined;
      score: number;
    }>;
    for (const hit of hits) {
      const doc = await ctx.runQuery(internal.mcpHelpers.getEmbeddingDoc, {
        id: hit._id,
      });
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
