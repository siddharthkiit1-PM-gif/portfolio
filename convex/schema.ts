import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    // `role` and `createdAt` are populated by `users.ensureUserRecord` right
    // after Convex Auth's default `createOrUpdateUser` inserts the bare row
    // with just `email`. They MUST stay optional here so the auth lib's
    // initial insert validates against this schema. Code that reads these
    // fields (e.g. `requireAdmin`) handles the absent case as "not admin".
    role: v.optional(v.union(v.literal("admin"), v.literal("viewer"))),
    createdAt: v.optional(v.number()),
    // Convex Auth's default upsert may also write these standard OAuth-style
    // fields. List them here so the schema accepts the row on first insert.
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })
    // Index name is "email" (not "by_email") because Convex Auth's
    // `uniqueUserWithVerifiedEmail` looks up the users table via an index
    // literally named "email". All in-repo callers use this same name.
    .index("email", ["email"]),

  siteContent: defineTable({
    page: v.string(), // "home" | "about" | ...
    slot: v.string(), // "hero.headline" | ...
    valueJson: v.string(), // Tiptap JSON serialized
    schemaVersion: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_page_slot", ["page", "slot"]),

  media: defineTable({
    type: v.union(v.literal("image"), v.literal("video")),
    storageId: v.id("_storage"),
    muxAssetId: v.optional(v.string()),
    muxPlaybackId: v.optional(v.string()),
    posterUrl: v.optional(v.string()),
    alt: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationSec: v.optional(v.number()),
    createdAt: v.number(),
  }),

  settings: defineTable({
    key: v.literal("site"),
    resumeUrl: v.string(),
    calendlyUrl: v.string(),
    socials: v.array(v.object({ platform: v.string(), url: v.string() })),
    statusPill: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  siteContacts: defineTable({
    key: v.literal("primary"),
    email: v.string(),
    linkedinUrl: v.string(),
    resumeUrl: v.string(),
    phone: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  experienceRoles: defineTable({
    order: v.number(),
    dates: v.string(),
    company: v.string(),
    title: v.string(),
    metric: v.string(),
    outcome: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_company_dates", ["company", "dates"]),
});
