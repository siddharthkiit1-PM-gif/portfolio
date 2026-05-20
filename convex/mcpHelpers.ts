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

export const getEmbeddingDoc = internalQuery({
  args: { id: v.id("bulletEmbeddings") },
  handler: (ctx, { id }) => ctx.db.get(id),
});
