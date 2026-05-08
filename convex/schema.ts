import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // smoke-test table; used only by Task 0.3 verification.
  // Will be removed in Task 1.1 when the real schema lands.
  smokeTest: defineTable({
    note: v.string(),
  }),
});
