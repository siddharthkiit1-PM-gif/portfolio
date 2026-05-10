import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

/** Public list, ordered ascending by `order`. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("experienceRoles")
      .withIndex("by_order")
      .order("asc")
      .collect();
  },
});

/**
 * Admin-only upsert. If `id` is provided, patches the existing row; otherwise
 * inserts a new row. `order` is required on insert and may be patched.
 */
export const upsert = mutation({
  args: {
    id: v.optional(v.id("experienceRoles")),
    order: v.number(),
    dates: v.string(),
    company: v.string(),
    title: v.string(),
    metric: v.string(),
    outcome: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    if (args.id) {
      await ctx.db.patch(args.id, {
        order: args.order,
        dates: args.dates,
        company: args.company,
        title: args.title,
        metric: args.metric,
        outcome: args.outcome,
        location: args.location,
        pillars: args.pillars,
        updatedAt: now,
      });
      return args.id;
    }
    return ctx.db.insert("experienceRoles", {
      order: args.order,
      dates: args.dates,
      company: args.company,
      title: args.title,
      metric: args.metric,
      outcome: args.outcome,
      location: args.location,
      pillars: args.pillars,
      updatedAt: now,
    });
  },
});

/** Admin-only deletion of a single role. */
export const remove = mutation({
  args: { id: v.id("experienceRoles") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

/**
 * Admin-only reorder. Patches each row in `orderedIds` with its new 0-based
 * `order` index in a single mutation.
 */
export const reorder = mutation({
  args: { orderedIds: v.array(v.id("experienceRoles")) },
  handler: async (ctx, { orderedIds }) => {
    await requireAdmin(ctx);
    const now = Date.now();
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { order: i, updatedAt: now });
    }
  },
});
