import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/** Seed siteContent rows that don't exist yet. Idempotent. */
export const seedSiteContent = internalMutation({
  args: {
    rows: v.array(
      v.object({
        page: v.string(),
        slot: v.string(),
        valueJson: v.string(),
        schemaVersion: v.number(),
      }),
    ),
  },
  handler: async (ctx, { rows }) => {
    let inserted = 0;
    for (const row of rows) {
      const existing = await ctx.db
        .query("siteContent")
        .withIndex("by_page_slot", (q) => q.eq("page", row.page).eq("slot", row.slot))
        .unique();
      if (!existing) {
        await ctx.db.insert("siteContent", {
          ...row,
          updatedAt: Date.now(),
        });
        inserted++;
      }
    }
    return { inserted, total: rows.length };
  },
});
