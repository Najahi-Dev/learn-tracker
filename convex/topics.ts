import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTopics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    // Compute task counts and progress for each topic
    const topicsWithStats = await Promise.all(
      topics.map(async (topic) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
          .collect();

        const totalTasks = tasks.length;
        const doneTasks = tasks.filter((t) => t.status === "done").length;
        const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

        return {
          ...topic,
          totalTasks,
          doneTasks,
          progress,
        };
      })
    );

    return topicsWithStats;
  },
});

export const getTopicById = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.userId !== identity.subject) {
      return null;
    }
    return topic;
  },
});

export const createTopic = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("not_started"),
        v.literal("in_progress"),
        v.literal("done")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const topicId = await ctx.db.insert("topics", {
      userId: identity.subject,
      name: args.name.trim(),
      description: args.description?.trim(),
      status: args.status ?? "not_started",
      createdAt: Date.now(),
    });

    return topicId;
  },
});

export const updateTopicStatus = mutation({
  args: {
    topicId: v.id("topics"),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("done")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.userId !== identity.subject) {
      throw new Error("Topic not found or unauthorized");
    }

    await ctx.db.patch(args.topicId, {
      status: args.status,
    });

    return true;
  },
});

export const deleteTopic = mutation({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.userId !== identity.subject) {
      throw new Error("Topic not found or unauthorized");
    }

    // Delete associated tasks and any reviews
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    for (const task of tasks) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      for (const review of reviews) {
        await ctx.db.delete(review._id);
      }
      await ctx.db.delete(task._id);
    }

    await ctx.db.delete(args.topicId);
    return true;
  },
});
