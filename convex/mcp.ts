"use node";
import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { embed } from "./lib/gemini";

/**
 * Node action entrypoints for the MCP server's semantic search.
 *
 * Convex requires `"use node"` modules to export only actions — queries and
 * mutations must live in a V8-isolate file. The internal query
 * `getEmbeddingProjections` lives in `mcpHelpers.ts`. Pure helpers like
 * `validateK` are fine alongside actions in a Node module.
 */

const MAX_QUERY_CHARS = 2000;

/**
 * Normalises the `k` parameter for `searchBullets`. Defaults to 5 when
 * undefined, `NaN`, or `-Infinity` (nonsensical inputs); positive `Infinity`
 * clamps to the upper bound (20). Otherwise clamps into `[1, 20]` and floors
 * fractional values so the vector-search `limit` is always a sane positive
 * integer.
 */
export function validateK(k: number | undefined): number {
  if (k === undefined || Number.isNaN(k) || k === -Infinity) return 5;
  return Math.max(1, Math.min(20, Math.floor(k)));
}

/**
 * Semantic search over resume bullets. Embeds the query via Gemini
 * gemini-embedding-001 (1536-dim, RETRIEVAL_QUERY), runs Convex's vectorSearch over
 * `bulletEmbeddings.by_embedding`, then batch-joins each hit back to its
 * bullet text + metadata via `internal.mcpHelpers.getEmbeddingProjections`
 * (single round-trip instead of N).
 */
export const searchBullets = action({
  args: { query: v.string(), k: v.optional(v.number()) },
  handler: async (ctx, { query, k }) => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      throw new ConvexError({
        code: "invalid_query",
        message: "query must be a non-empty string",
      });
    }
    if (trimmed.length > MAX_QUERY_CHARS) {
      throw new ConvexError({
        code: "invalid_query",
        message: `query must be at most ${MAX_QUERY_CHARS} characters`,
      });
    }

    const limit = validateK(k);

    let vector: number[];
    try {
      vector = await embed(trimmed, "RETRIEVAL_QUERY");
    } catch (err) {
      throw new ConvexError({
        code: "embedding_unavailable",
        message:
          err instanceof Error
            ? `failed to embed query: ${err.message}`
            : "failed to embed query",
      });
    }

    const hits = await ctx.vectorSearch("bulletEmbeddings", "by_embedding", {
      vector,
      limit,
    });

    const projections = await ctx.runQuery(
      internal.mcpHelpers.getEmbeddingProjections,
      { ids: hits.map((h) => h._id) },
    );

    const out: Array<{
      roleCompany: string;
      roleDates: string;
      pillarLabel: string;
      text: string;
      metric: string | undefined;
      score: number;
    }> = [];
    for (let i = 0; i < hits.length; i++) {
      const doc = projections[i];
      if (!doc) continue;
      out.push({
        roleCompany: doc.roleCompany,
        roleDates: doc.roleDates,
        pillarLabel: doc.pillarLabel,
        text: doc.bulletText,
        metric: doc.metric,
        score: hits[i]._score,
      });
    }
    return { hits: out };
  },
});
