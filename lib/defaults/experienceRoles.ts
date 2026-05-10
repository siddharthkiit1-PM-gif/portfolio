/**
 * Shared defaults for the Experience block on the home page.
 *
 * Used in two places:
 *   • `components/experience/ExperienceSection.tsx` — first-paint / empty-DB
 *     fallback so the section renders correctly before the Convex query
 *     resolves (or against a clean DB with no rows).
 *   • `convex/seed.ts`'s `seedExperienceRoles` — idempotent seed that mirrors
 *     these literals so a freshly-seeded DB renders identically to a clean
 *     DB with no rows.
 *
 * Lives at the top-level `lib/` (not under `convex/`) so both Convex's TS
 * compiler and the Next.js client can import it; Convex doesn't expose
 * arbitrary paths to the client and vice versa.
 *
 * The PM role's `metric` string is `"$500K ARR"` per direct user instruction —
 * this overrides the resume's $100K figure and keeps defaults consistent with
 * the headline metric strip in `MetricStrip.tsx`.
 */

export type RoleBullet = {
  text: string;
  metric?: string;
};

export type RolePillar = {
  label: string;
  bullets: RoleBullet[];
};

export type RoleDefault = {
  order: number;
  dates: string;
  company: string;
  title: string;
  location?: string;
  metric: string;
  outcome?: string;
  pillars?: RolePillar[];
};

export const EXPERIENCE_ROLE_DEFAULTS: RoleDefault[] = [
  {
    order: 0,
    dates: "2024 — Now",
    company: "6sense Insights",
    title: "Product Manager",
    location: "Bangalore",
    metric: "$500K ARR",
    outcome: "Market insight signals 0→1, 30+ enterprise customers",
    pillars: [
      {
        label: "Revenue & Growth",
        bullets: [
          {
            text: "Launched market insight signals 0→1 — 30+ enterprise customers, $500K ARR; owned full lifecycle from customer discovery through data pipeline design to production.",
            metric: "$500K ARR",
          },
        ],
      },
      {
        label: "Retention & Customer Research",
        bullets: [
          {
            text: "Ran 25+ customer interviews to map onboarding and discovery drop-offs; shipped prioritised fixes that drove an 18% lift in retention.",
            metric: "+18%",
          },
          {
            text: "Mapped early churn triggers (D30/D60/D90) with analytics; shipped targeted in-product journeys that closed drop-off gaps and improved early engagement.",
          },
          {
            text: "Collaborated with sales and CS to gather enterprise feedback on signal accuracy; translated findings into a data quality backlog that reduced customer-reported data issues by 40%.",
            metric: "-40%",
          },
        ],
      },
      {
        label: "Data Quality & ML",
        bullets: [
          {
            text: "Rebuilt technographic job-level classification with the data science team using ML models; improved signal accuracy by 85%+ and restored user trust in core search and discovery experiences.",
            metric: "+85%",
          },
          {
            text: "Built historical jobs framework improving technographic data freshness and coverage by 72%, reducing signal staleness and lifting CSAT by 20%.",
            metric: "+72%",
          },
          {
            text: "Integrated external data sources across product areas, expanding technographic signal coverage by 32% and improving reliability of enterprise-facing experiences.",
            metric: "+32%",
          },
        ],
      },
      {
        label: "Operational Leverage",
        bullets: [
          {
            text: "Built AI-assisted threshold workflow automating classification decisions for the Data Ops team — reduced manual effort by 98%, enabling signal processing to scale without adding headcount.",
            metric: "-98%",
          },
          {
            text: "Revamped SI App information architecture using customer-driven research; improved feature discoverability by 30% across high-density technographic data views.",
            metric: "+30%",
          },
        ],
      },
    ],
  },
  {
    order: 1,
    dates: "2022 — 2024",
    company: "6sense Insights",
    title: "Business Analyst",
    location: "Bangalore",
    metric: "+18% retention",
    outcome: "Internal CMS + churn analysis, earned PM transition",
    pillars: [
      {
        label: "Internal Tooling",
        bullets: [
          {
            text: "Launched internal CMS for technographics data — gave ops direct control over signal quality, reduced visible error rate by 98%, and cut escalation tickets by 60%.",
            metric: "-98%",
          },
        ],
      },
      {
        label: "Competitive & Roadmap",
        bullets: [
          {
            text: "Benchmarked technographic data assets against competing platforms on coverage, accuracy, and freshness; gaps identified shaped 3 major roadmap priorities.",
          },
        ],
      },
      {
        label: "Churn & UX",
        bullets: [
          {
            text: "Analysed data accuracy to reduce technographic and psychographic churn by 27%; iterated on product based on user feedback, cutting bounce rate by 18%.",
            metric: "-27%",
          },
        ],
      },
    ],
  },
  {
    order: 2,
    dates: "2020 — 2022",
    company: "Accenture",
    title: "Software Engineer",
    location: "Pune",
    metric: "AT&T platform",
    outcome: "Backend services for high-traffic consumer web",
    pillars: [
      {
        label: "Backend Engineering",
        bullets: [
          {
            text: "Built and maintained backend services and APIs for AT&T's high-traffic consumer web platform (phones & devices); improved system stability and reduced production incidents.",
          },
        ],
      },
      {
        label: "Quality & Release",
        bullets: [
          {
            text: "Collaborated with QA and product teams to debug, ship fixes, and support feature releases; reduced post-release defects through root cause analysis.",
          },
        ],
      },
    ],
  },
];
