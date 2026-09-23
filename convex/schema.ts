import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  topics: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("done")
    ),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  tasks: defineTable({
    topicId: v.id("topics"),
    userId: v.string(),
    title: v.string(),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("done")
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_topic", ["topicId"])
    .index("by_user", ["userId"]),

  reviews: defineTable({
    taskId: v.id("tasks"),
    userId: v.string(),
    nextReviewDate: v.number(),
    intervalDays: v.number(),
    easeFactor: v.number(),
    lastReviewedAt: v.optional(v.number()),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"]),
});
