import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/** Pure helper, exported for unit tests. */
export function isAdminEmail(email: string, allowlist: string[]): boolean {
  const norm = email.trim().toLowerCase();
  return allowlist.some((entry) => entry.trim().toLowerCase() === norm);
}

function getAllowlist(): string[] {
  const raw = process.env.ADMIN_ALLOWLIST ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Called from the front-end after sign-in to ensure a `users` row exists. */
export const ensureUserRecord = mutation({
  args: { email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    const role = isAdminEmail(args.email, getAllowlist()) ? "admin" : "viewer";

    if (existing) {
      await ctx.db.patch(existing._id, { role, name: args.name ?? existing.name });
      return existing._id;
    }
    return ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      name: args.name,
      role,
      createdAt: Date.now(),
    });
  },
});

/** Test-only: ensure a users row exists with admin role. Used by E2E. */
export const testEnsureAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const norm = email.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", norm))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { role: "admin" });
      return existing._id;
    }
    return ctx.db.insert("users", {
      email: norm,
      role: "admin",
      createdAt: Date.now(),
    });
  },
});

/** Returns the current authenticated user record, or null. */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) return null;
    // The auth integration stores its own users table; we mirror via email.
    // Look up our app-level row.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;
    const row = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();
    return row;
  },
});
