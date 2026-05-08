import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) throw new Error("Not authenticated");
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("No identity email");
  const userRow = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!.toLowerCase()))
    .unique();
  if (!userRow || userRow.role !== "admin") throw new Error("Forbidden");
  return userRow;
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const createRecord = mutation({
  args: {
    storageId: v.id("_storage"),
    type: v.union(v.literal("image"), v.literal("video")),
    alt: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("media", {
      storageId: args.storageId,
      type: args.type,
      alt: args.alt,
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("media") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row) return null;
    const url = await ctx.storage.getUrl(row.storageId);
    return { ...row, url };
  },
});
