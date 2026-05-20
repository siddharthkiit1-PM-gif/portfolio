import { internalMutation } from "./_generated/server";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Hourly sweep of OAuth state.
 *
 * - oauthAuthCodes: deletes rows past expiry OR already consumed. Authcodes
 *   are single-use and have a 10-minute TTL; nothing is reachable after that.
 * - oauthTokens: deletes rows that are (a) revoked and >7 days old, or
 *   (b) un-revoked but with an access expiry older than 30 days. A live
 *   refresh token row keeps both its revokedAt empty and a recent enough
 *   expiry (refresh-token rotation creates a new row each time, see
 *   oauthTokens.rotate).
 *
 * Internal mutation only — only the cron invokes this.
 */
export const sweep = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let codesDeleted = 0;
    let tokensDeleted = 0;

    for await (const row of ctx.db.query("oauthAuthCodes")) {
      if (row.consumedAt !== undefined || row.expiresAt < now) {
        await ctx.db.delete(row._id);
        codesDeleted++;
      }
    }

    for await (const row of ctx.db.query("oauthTokens")) {
      const deadByRevoke =
        row.revokedAt !== undefined && row.revokedAt < now - SEVEN_DAYS_MS;
      const deadByStaleExpiry =
        row.revokedAt === undefined && row.expiresAt < now - THIRTY_DAYS_MS;
      if (deadByRevoke || deadByStaleExpiry) {
        await ctx.db.delete(row._id);
        tokensDeleted++;
      }
    }

    return { codesDeleted, tokensDeleted };
  },
});
