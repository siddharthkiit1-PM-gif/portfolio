import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Dynamic client registration (RFC 7591). Inserts an `oauthClients` row.
 * The MCP server calls this from POST /oauth/register; no client secret is
 * issued (MCP relies on PKCE).
 */
export const create = mutation({
  args: {
    clientId: v.string(),
    clientName: v.string(),
    redirectUris: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthClients", { ...args, createdAt: Date.now() });
    return { clientId: args.clientId };
  },
});

/** Lookup used by /oauth/authorize and /oauth/token to verify the client_id. */
export const getByClientId = query({
  args: { clientId: v.string() },
  handler: (ctx, { clientId }) =>
    ctx.db
      .query("oauthClients")
      .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
      .first(),
});
