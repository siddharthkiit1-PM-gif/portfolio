import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Issues a short-lived authorization code at the end of the OAuth authorize
 * flow. `expiresAt` should be Date.now() + 10 minutes; the MCP server sets it.
 */
export const create = mutation({
  args: {
    code: v.string(),
    clientId: v.string(),
    userId: v.id("users"),
    redirectUri: v.string(),
    codeChallenge: v.string(),
    codeChallengeMethod: v.literal("S256"),
    scopes: v.array(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthAuthCodes", args);
    return { code: args.code };
  },
});

/**
 * Atomic single-use consume. Validates code, clientId, redirectUri, expiry,
 * and not-already-consumed in one transaction, then marks consumed. Returns
 * the authcode payload (codeChallenge + userId + scopes) for the token
 * endpoint to verify PKCE and mint tokens. Returns null if any check fails.
 */
export const consume = mutation({
  args: {
    code: v.string(),
    clientId: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("oauthAuthCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!row) return null;
    if (row.consumedAt !== undefined) return null;
    if (row.expiresAt < Date.now()) return null;
    if (row.clientId !== args.clientId) return null;
    if (row.redirectUri !== args.redirectUri) return null;
    await ctx.db.patch(row._id, { consumedAt: Date.now() });
    return {
      userId: row.userId,
      codeChallenge: row.codeChallenge,
      codeChallengeMethod: row.codeChallengeMethod,
      scopes: row.scopes,
    };
  },
});
