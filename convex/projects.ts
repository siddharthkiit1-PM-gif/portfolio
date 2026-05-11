import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

/** Public list, ordered ascending by `order`. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("projects")
      .withIndex("by_order")
      .order("asc")
      .collect();
  },
});

/** Public featured list, ordered ascending by `order`. */
export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("projects")
      .withIndex("by_featured_order", (q) => q.eq("featured", true))
      .order("asc")
      .collect();
  },
});

/** Public single-row read by slug. Returns null when not found. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

/**
 * Admin-only upsert. If `id` is provided, patches the existing row;
 * otherwise inserts a new row. Slug uniqueness is validated against
 * any other row that already owns the slug.
 */
export const upsert = mutation({
  args: {
    id: v.optional(v.id("projects")),
    slug: v.string(),
    order: v.number(),
    featured: v.boolean(),
    title: v.string(),
    outcome: v.optional(v.string()),
    year: v.string(),
    role: v.optional(v.string()),
    tagline: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    figmaUrl: v.optional(v.string()),
    loomUrl: v.optional(v.string()),
    prdUrl: v.optional(v.string()),
    techStack: v.array(v.string()),
    heroImageStorageId: v.optional(v.id("_storage")),
    heroImageAlt: v.optional(v.string()),
    problem: v.string(),
    users: v.string(),
    value: v.string(),
    goal: v.optional(v.string()),
    approach: v.optional(v.string()),
    outcomeNarrative: v.optional(v.string()),
    learnings: v.optional(v.string()),
    heroMetricValue: v.optional(v.string()),
    heroMetricLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Slug uniqueness: reject if a different row already owns it.
    const slugOwner = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (slugOwner && slugOwner._id !== args.id) {
      throw new Error(`Slug "${args.slug}" already in use`);
    }

    const now = Date.now();
    const { id, ...rest } = args;
    if (id) {
      await ctx.db.patch(id, { ...rest, updatedAt: now });
      return id;
    }
    return ctx.db.insert("projects", { ...rest, updatedAt: now });
  },
});

/** Admin-only deletion. */
export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

/**
 * Admin-only reorder. Patches each row in `orderedIds` with its new 0-based
 * `order` index in a single mutation. Mirrors experienceRoles.reorder.
 */
export const reorder = mutation({
  args: { orderedIds: v.array(v.id("projects")) },
  handler: async (ctx, { orderedIds }) => {
    await requireAdmin(ctx);
    const now = Date.now();
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i, updatedAt: now });
    }
  },
});

/** Admin-only: generate a one-shot URL for uploading a hero image. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Public: resolve a storage id to a public URL. */
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
