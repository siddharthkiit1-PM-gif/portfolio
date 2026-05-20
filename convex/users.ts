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

/**
 * Called from the front-end after sign-in to ensure the caller's `users` row
 * is populated and role-stamped.
 *
 * SECURITY: always resolve the row by `authUserId`. Never look up by the
 * client-supplied `args.email` — that would let any signed-in caller patch
 * (or pre-create) another user's row by passing their email. The Convex Auth
 * provider has already created the row at sign-in keyed by `authUserId`, so
 * the email stored there is the trustworthy one; `args.email` is treated as
 * a hint and only used if the auth row hasn't captured an email yet (Resend
 * provider edge case noted in lib/auth.ts).
 */
export const ensureUserRecord = mutation({
  args: { email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }
    const existing = await ctx.db.get(authUserId);
    if (!existing) {
      // Convex Auth always inserts a row at sign-in; missing row = bad state.
      throw new Error("Auth user row missing");
    }
    const email = (existing.email ?? args.email).toLowerCase();
    const role = isAdminEmail(email, getAllowlist()) ? "admin" : "viewer";
    await ctx.db.patch(authUserId, {
      email,
      role,
      name: args.name ?? existing.name,
    });
    return authUserId;
  },
});

/** Test-only: ensure a users row exists with admin role. Used by E2E. */
export const testEnsureAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const norm = email.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", norm))
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

/**
 * One-time admin sign-in for the MCP OAuth flow. The MCP server's authorize
 * handler accepts a token submitted via the consent page form; this validator
 * matches it against the ADMIN_BOOTSTRAP_TOKEN env var (set on the Convex
 * deployment) and returns the first admin user's _id on success, else null.
 *
 * SECURITY NOTES:
 * - Uses strict equality + length check. Convex V8 isolate does not expose
 *   node:crypto for timing-safe compare. The token is high-entropy and only
 *   used by the admin's own browser, so the timing-attack risk is minimal.
 * - If multiple admins exist, the FIRST admin (oldest by _creationTime) is
 *   returned. Acceptable for a single-operator portfolio site.
 */
export const getAdminByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const expected = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (!expected || expected.length === 0) return null;
    if (token.length !== expected.length) return null;
    if (token !== expected) return null;
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    return admin ?? null;
  },
});

/** Returns the current authenticated user record, or null. */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) return null;
    // Convex Auth writes into the SAME `users` table this app defines (see
    // `schema.ts` — `...authTables` is spread and `users` is overridden with
    // our app-level fields). Resolve directly by id; do NOT go through
    // `ctx.auth.getUserIdentity().email`, because the Resend provider does
    // not populate the `email` claim on the identity token, which made this
    // query return null for freshly-verified sessions and trapped the admin
    // in a redirect loop between `/admin/edit` and `/admin/login`.
    return ctx.db.get(authUserId);
  },
});
