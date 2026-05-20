import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

/**
 * V8-isolate helpers for the MCP server.
 *
 * Convex disallows mixing `"use node"` with `internalQuery` / `internalMutation`
 * exports in the same file — Node action modules cannot also host queries or
 * mutations. The Node action entrypoints live in `mcp.ts`; this file holds the
 * data-access primitives they delegate to via
 * `ctx.runQuery(internal.mcpHelpers.*)`.
 */

/**
 * Batch-fetch the bullet metadata needed by `mcp.searchBullets`, projecting
 * out the heavy fields (`embedding` is 1536 floats; `sourceHash` is unused on
 * the wire) so we avoid serializing them across the V8 ↔ Node boundary. Order
 * matches the input `ids`; deleted rows surface as `null` so the caller can
 * zip with the original vector-search hits and drop misses.
 */
export const getEmbeddingProjections = internalQuery({
  args: { ids: v.array(v.id("bulletEmbeddings")) },
  handler: async (ctx, { ids }) => {
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return docs.map((doc) =>
      doc === null
        ? null
        : {
            id: doc._id,
            roleCompany: doc.roleCompany,
            roleDates: doc.roleDates,
            pillarLabel: doc.pillarLabel,
            bulletText: doc.bulletText,
            metric: doc.metric,
          },
    );
  },
});
