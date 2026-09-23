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
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    resources: v.optional(
      v.array(
        v.object({
          title: v.string(),
          url: v.string(),
        })
      )
    ),
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
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    dueDate: v.optional(v.number()),
    scheduledForToday: v.optional(v.boolean()),
  })
    .index("by_topic", ["topicId"])
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_scheduled", ["userId", "scheduledForToday"]),

  reviews: defineTable({
    taskId: v.id("tasks"),
    topicId: v.optional(v.id("topics")),
    userId: v.string(),
    nextReviewDate: v.number(),
    intervalDays: v.number(),
    easeFactor: v.number(),
    lastReviewedAt: v.optional(v.number()),
    repetitions: v.optional(v.number()),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"])
    .index("by_user_due", ["userId", "nextReviewDate"]),

  activity_logs: defineTable({
    userId: v.string(),
    date: v.string(), // "YYYY-MM-DD"
    count: v.number(),
    completedTasks: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  topic_notes: defineTable({
    topicId: v.id("topics"),
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_topic", ["topicId"])
    .index("by_user", ["userId"]),
});
