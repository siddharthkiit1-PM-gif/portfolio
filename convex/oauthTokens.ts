import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour, matches plan

export const create = mutation({
  args: {
    token: v.string(),
    refreshToken: v.string(),
    clientId: v.string(),
    userId: v.id("users"),
    scopes: v.array(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthTokens", args);
    return { token: args.token };
  },
});

/**
 * Returns the active token row (not revoked, not expired). Used by the MCP
 * server's Bearer auth middleware on every /mcp request.
 */
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("oauthTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!row) return null;
    if (row.revokedAt !== undefined) return null;
    if (row.expiresAt < Date.now()) return null;
    return row;
  },
});

/**
 * Two-step rotation: callers (MCP server) mint new access + refresh tokens
 * with node:crypto, then call this to atomically revoke the old row and
 * insert the new one in a single mutation. Convex V8 isolate has no
 * `node:crypto`, so token minting happens on the MCP server side and the
 * fresh strings are passed in.
 */
export const rotate = mutation({
  args: {
    oldRefreshToken: v.string(),
    clientId: v.string(),
    newToken: v.string(),
    newRefreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    const old = await ctx.db
      .query("oauthTokens")
      .withIndex("by_refresh_token", (q) => q.eq("refreshToken", args.oldRefreshToken))
      .first();
    if (!old) return null;
    if (old.revokedAt !== undefined) return null;
    if (old.clientId !== args.clientId) return null;
    const now = Date.now();
    await ctx.db.patch(old._id, { revokedAt: now });
    await ctx.db.insert("oauthTokens", {
      token: args.newToken,
      refreshToken: args.newRefreshToken,
      clientId: old.clientId,
      userId: old.userId,
      scopes: old.scopes,
      expiresAt: now + ACCESS_TOKEN_TTL_MS,
    });
    return {
      token: args.newToken,
      refreshToken: args.newRefreshToken,
      scopes: old.scopes,
      expiresAt: now + ACCESS_TOKEN_TTL_MS,
    };
  },
});

/** Revoke by access token. Used by POST /oauth/revoke. */
export const revoke = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("oauthTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!row) return false;
    if (row.revokedAt !== undefined) return true;
    await ctx.db.patch(row._id, { revokedAt: Date.now() });
    return true;
  },
});
