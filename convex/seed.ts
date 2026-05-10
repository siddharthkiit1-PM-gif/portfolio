import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { EXPERIENCE_ROLE_DEFAULTS } from "../lib/defaults/experienceRoles";

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

/**
 * Seed the singleton siteContacts row keyed `"primary"`. Idempotent: if the
 * row already exists, this is a no-op. Mirrors the literal fallbacks in
 * `components/home/HeroRecruiterRail.tsx` so a freshly-seeded DB renders
 * identically to a clean DB with no rows.
 */
export const seedSiteContacts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("siteContacts")
      .withIndex("by_key", (q) => q.eq("key", "primary"))
      .unique();
    if (existing) return { inserted: 0 as const };
    await ctx.db.insert("siteContacts", {
      key: "primary",
      email: "hello@siddharthagrawal.com",
      linkedinUrl: "https://www.linkedin.com/in/siddharthagrawal18/?skipRedirect=true",
      resumeUrl: "/Siddharth_Agrawal_Resume.pdf",
      githubUrl: "https://github.com/siddharthkiit1-PM-gif",
      updatedAt: Date.now(),
    });
    return { inserted: 1 as const };
  },
});

/**
 * Seed the three default experience roles. Idempotent on `(company, dates)`
 * pairs — re-running will not double-insert. `order` is assigned by the
 * array index below so the list lands in the same top-down order the static
 * component used to render.
 */
export const seedExperienceRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    for (let i = 0; i < EXPERIENCE_ROLE_DEFAULTS.length; i++) {
      const role = EXPERIENCE_ROLE_DEFAULTS[i];
      const existing = await ctx.db
        .query("experienceRoles")
        .withIndex("by_company_dates", (q) =>
          q.eq("company", role.company).eq("dates", role.dates),
        )
        .first();
      if (existing) continue;
      await ctx.db.insert("experienceRoles", {
        order: i,
        dates: role.dates,
        company: role.company,
        title: role.title,
        metric: role.metric,
        updatedAt: Date.now(),
      });
      inserted++;
    }
    return { inserted };
  },
});
