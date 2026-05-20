import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * V8-isolate helpers for the embedding pipeline.
 *
 * Convex disallows mixing `"use node"` with `internalQuery` / `internalMutation`
 * exports in the same file — Node action modules cannot also host queries or
 * mutations. The Node action entrypoints live in `embeddings.ts`; this file
 * holds the data-access primitives they delegate to via
 * `ctx.runQuery(internal.embeddingsHelpers.*)` and
 * `ctx.runMutation(internal.embeddingsHelpers.*)`.
 */

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
    ctx.db
      .query("bulletEmbeddings")
      .withIndex("by_source_hash", (q) => q.eq("sourceHash", sourceHash))
      .first(),
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
