import { query } from "./_generated/server";

/**
 * Public read aggregator that returns a single MCP-shaped resume snapshot.
 *
 * Lives in a V8-isolate file (no "use node") because Convex prohibits
 * exporting queries from Node action modules. The Node-only siblings
 * (`mcp.ts`, `embeddings.ts`) hold actions; this file holds queries that
 * the MCP HTTP server will hit through the public API.
 *
 * Field selection mirrors `convex/schema.ts` exactly — `projects.metric` is
 * intentionally absent because no such column exists (the schema exposes
 * `heroMetricValue` / `heroMetricLabel` instead, which are case-study UI
 * concerns rather than resume metrics).
 */
export const getResume = query({
  args: {},
  handler: async (ctx) => {
    const [roles, projects, contact] = await Promise.all([
      ctx.db.query("experienceRoles").withIndex("by_order").order("asc").collect(),
      ctx.db.query("projects").withIndex("by_order").order("asc").collect(),
      ctx.db
        .query("siteContacts")
        .withIndex("by_key", (q) => q.eq("key", "primary"))
        .unique(),
    ]);

    return {
      name: "Siddharth Agrawal",
      headline: "Product Manager",
      location: "Bangalore",
      roles: roles.map((r) => ({
        company: r.company,
        title: r.title,
        dates: r.dates,
        location: r.location,
        metric: r.metric,
        outcome: r.outcome,
        pillars: r.pillars ?? [],
      })),
      projects: projects.map((p) => ({
        slug: p.slug,
        title: p.title,
        problem: p.problem,
        approach: p.approach,
        outcome: p.outcomeNarrative,
        links: { live: p.liveUrl, github: p.githubUrl },
      })),
      contact: {
        email: contact?.email,
        linkedin: contact?.linkedinUrl,
        github: contact?.githubUrl,
        phone: contact?.phone,
        calendly: contact?.calendlyUrl,
      },
    };
  },
});
