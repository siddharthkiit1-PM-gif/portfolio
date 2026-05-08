import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("viewer")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

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
});
