import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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

export const upsert = mutation({
  args: {
    page: v.string(),
    slot: v.string(),
    valueJson: v.string(),
    schemaVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("No identity email");

    const userRow = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();
    if (!userRow || userRow.role !== "admin") {
      throw new Error("Forbidden: admin only");
    }

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
