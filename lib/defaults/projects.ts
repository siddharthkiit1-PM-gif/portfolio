/**
 * Project defaults — used only by `convex/seed.ts`'s `seedProjects` to write
 * 1–2 placeholder rows into a fresh DB so /projects and /projects/[slug]
 * don't 404 at launch. Unlike Experience, public components do NOT fall back
 * to these — they show the empty state when Convex returns nothing.
 *
 * Lives at top-level `lib/` so both Convex's TS compiler and Next.js can
 * import it.
 */

export type ProjectDefault = {
  slug: string;
  order: number;
  featured: boolean;
  title: string;
  outcome?: string;
  year: string;
  role?: string;
  techStack: string[];
  problem: string;
  users: string;
  value: string;
};

export const PROJECT_DEFAULTS: ProjectDefault[] = [
  {
    slug: "replace-via-admin",
    order: 0,
    featured: true,
    title: "Replace via /admin/edit",
    year: "2026",
    role: "Product Manager",
    techStack: [],
    problem:
      "Placeholder row. Edit through /admin/edit → Projects to replace with a real entry.",
    users: "Placeholder.",
    value: "Placeholder.",
  },
];
