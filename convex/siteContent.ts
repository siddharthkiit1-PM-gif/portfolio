import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const get = query({
  args: { page: v.string(), slot: v.string() },
  handler: async (ctx, { page, slot }) => {
    const row = await ctx.db
      .query("siteContent")
      .withIndex("by_page_slot", (q) => q.eq("page", page).eq("slot", slot))
      .unique();
    return row;
  },
});

/** All slots for a single page. */
export const list = query({
  args: { page: v.string() },
  handler: async (ctx, { page }) => {
    const rows = await ctx.db
      .query("siteContent")
      .withIndex("by_page_slot", (q) => q.eq("page", page))
      .collect();
    return rows.map((r) => ({ _id: r._id, slot: r.slot, valueJson: r.valueJson }));
  },
});

/** Unique page identifiers across all siteContent rows. Small dataset; in-JS dedupe. */
export const listPages = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("siteContent").collect();
    const seen = new Set<string>();
    for (const r of rows) seen.add(r.page);
    return Array.from(seen);
  },
});

export const upsert = mutation({
  args: {
    page: v.string(),
    slot: v.string(),
    valueJson: v.string(),
    schemaVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const userRow = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_page_slot", (q) => q.eq("page", args.page).eq("slot", args.slot))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        valueJson: args.valueJson,
        schemaVersion: args.schemaVersion,
        updatedAt: Date.now(),
        updatedBy: userRow._id,
      });
      return existing._id;
    }
    return ctx.db.insert("siteContent", {
      page: args.page,
      slot: args.slot,
      valueJson: args.valueJson,
      schemaVersion: args.schemaVersion,
      updatedAt: Date.now(),
      updatedBy: userRow._id,
    });
  },
});
