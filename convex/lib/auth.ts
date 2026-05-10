import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Verifies the caller is an authenticated admin and returns their `users` row.
 * Throws on any failure: not authenticated, no email on identity, no matching
 * users row, or role !== "admin".
 */
export async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) throw new Error("Not authenticated");
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("No identity email");
  const userRow = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", identity.email!.toLowerCase()))
    .unique();
  if (!userRow || userRow.role !== "admin") throw new Error("Forbidden");
  return userRow;
}
