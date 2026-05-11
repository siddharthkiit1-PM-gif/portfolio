import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

/** Public read of the singleton primary contact row. Returns null if unset. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("siteContacts")
      .withIndex("by_key", (q) => q.eq("key", "primary"))
      .unique();
    return row;
  },
});

/** Admin-only upsert of the singleton primary contact row. */
export const upsert = mutation({
  args: {
    email: v.string(),
    linkedinUrl: v.string(),
    resumeUrl: v.string(),
    githubUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    calendlyUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("siteContacts")
      .withIndex("by_key", (q) => q.eq("key", "primary"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        linkedinUrl: args.linkedinUrl,
        resumeUrl: args.resumeUrl,
        githubUrl: args.githubUrl,
        phone: args.phone,
        calendlyUrl: args.calendlyUrl,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    return ctx.db.insert("siteContacts", {
      key: "primary",
      email: args.email,
      linkedinUrl: args.linkedinUrl,
      resumeUrl: args.resumeUrl,
      githubUrl: args.githubUrl,
      phone: args.phone,
      calendlyUrl: args.calendlyUrl,
      updatedAt: Date.now(),
    });
  },
});
