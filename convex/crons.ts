import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

/**
 * Convex cron registry.
 *
 * The embedding rebuild is a *public* action (`export const rebuildAll =
 * action(...)` in `convex/embeddings.ts`), so it is reachable via `api.*`,
 * not `internal.*`. Convex's `cronJobs().daily(...)` accepts either; we use
 * the matching reference rather than mismatch the export kind.
 *
 * 3am UTC is 8:30am IST — runs in the early morning local time so any
 * embedding regressions surface during the workday.
 *
 * The OAuth cleanup sweep is an `internalMutation` so it cannot be invoked
 * by any deploy-key holder; only the cron itself can call it. Hourly at :30
 * staggers it off the daily 3:00 embed rebuild.
 */
const crons = cronJobs();

crons.daily(
  "rebuild embeddings",
  { hourUTC: 3, minuteUTC: 0 },
  api.embeddings.rebuildAll,
);

crons.hourly(
  "cleanup oauth state",
  { minuteUTC: 30 },
  internal.oauthCleanup.sweep,
);

export default crons;
