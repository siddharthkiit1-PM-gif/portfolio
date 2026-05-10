/**
 * Shared defaults for the Experience block on the home page.
 *
 * Used in two places:
 *   • `components/home/Experience.tsx` — first-paint / empty-DB fallback so
 *     `HeroPinController` always finds three rows to stage at mount.
 *   • `convex/seed.ts`'s `seedExperienceRoles` — idempotent seed that mirrors
 *     these literals so a freshly-seeded DB renders identically to a clean DB
 *     with no rows.
 *
 * Lives at the top-level `lib/` (not under `convex/`) so both Convex's TS
 * compiler and the Next.js client can import it; Convex doesn't expose
 * arbitrary paths to the client and vice versa.
 */

export type RoleDefault = {
  order: number;
  dates: string;
  company: string;
  title: string;
  metric: string;
  outcome?: string;
  location?: string;
  pillars?: {
    label: string;
    bullets: { text: string; metric?: string }[];
  }[];
};

export const EXPERIENCE_ROLE_DEFAULTS: RoleDefault[] = [
  {
    order: 0,
    dates: "2024 — Now",
    company: "6sense",
    title: "Product Manager",
    metric: "$100K ARR · 0 → 1",
  },
  {
    order: 1,
    dates: "2022 — 24",
    company: "6sense",
    title: "Business Analyst",
    metric: "+18% retention",
  },
  {
    order: 2,
    dates: "2020 — 22",
    company: "Accenture",
    title: "SE · AT&T",
    metric: "98% ops cut via AI",
  },
];
