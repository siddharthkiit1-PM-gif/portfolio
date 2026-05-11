import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { SITE_URL } from "@/lib/site";

/**
 * Sitemap covers the homepage plus every published project detail. Projects
 * are pulled live from Convex so adding a new project via /admin/edit
 * automatically extends the sitemap on the next build.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await fetchQuery(api.projects.list, {}).catch(() => []);

  const projectEntries: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified: new Date(p.updatedAt ?? Date.now()),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...projectEntries,
  ];
}
