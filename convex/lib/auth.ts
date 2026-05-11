import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Verifies the caller is an authenticated admin and returns their `users` row.
 * Throws on any failure: not authenticated, no matching users row, or
 * role !== "admin".
 *
 * Resolves the row directly via the auth user id. We do NOT route through
 * `ctx.auth.getUserIdentity().email` — the Resend provider does not populate
 * the `email` claim on the identity token, so that path threw "No identity
 * email" on every admin save right after sign-in. Convex Auth's `users`
 * table is the same one this app defines in `schema.ts`, so a direct id
 * lookup is the canonical resolution.
 */
export async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) throw new Error("Not authenticated");
  const userRow = await ctx.db.get(authUserId);
  if (!userRow || userRow.role !== "admin") throw new Error("Forbidden");
  return userRow;
}
