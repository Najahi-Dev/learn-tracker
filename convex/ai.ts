import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createAiRoadmap = mutation({
  args: {
    topicName: v.string(),
    description: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),
    tasks: v.array(
      v.object({
        title: v.string(),
        priority: v.optional(
          v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const topicId = await ctx.db.insert("topics", {
      userId: identity.subject,
      name: args.topicName.trim(),
      description: args.description?.trim(),
      status: "in_progress",
      createdAt: Date.now(),
      tags: [args.difficulty || "curriculum", "ai-generated"],
      resources: [],
    });

    const now = Date.now();
    for (const task of args.tasks) {
      await ctx.db.insert("tasks", {
        topicId,
        userId: identity.subject,
        title: task.title.trim(),
        status: "not_started",
        priority: task.priority || "medium",
        createdAt: now,
      });
    }

    return topicId;
  },
});
