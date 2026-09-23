import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTasksByTopic = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Verify ownership of the topic
    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.userId !== identity.subject) {
      return [];
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .order("desc")
      .collect();

    return tasks;
  },
});

export const createTask = mutation({
  args: {
    topicId: v.id("topics"),
    title: v.string(),
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

    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.userId !== identity.subject) {
      throw new Error("Topic not found or unauthorized");
    }

    const status = args.status ?? "not_started";
    const now = Date.now();

    const taskId = await ctx.db.insert("tasks", {
      topicId: args.topicId,
      userId: identity.subject,
      title: args.title.trim(),
      status,
      createdAt: now,
      completedAt: status === "done" ? now : undefined,
    });

    // If topic was not_started and we're adding tasks, automatically set to in_progress if desired
    if (topic.status === "not_started") {
      await ctx.db.patch(args.topicId, { status: "in_progress" });
    }

    return taskId;
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
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

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== identity.subject) {
      throw new Error("Task not found or unauthorized");
    }

    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: args.status,
      completedAt: args.status === "done" ? now : undefined,
    });

    // Optionally check if all tasks for this topic are done
    const allTopicTasks = await ctx.db
      .query("tasks")
      .withIndex("by_topic", (q) => q.eq("topicId", task.topicId))
      .collect();

    const otherTasks = allTopicTasks.filter((t) => t._id !== task._id);
    const allDone = args.status === "done" && otherTasks.every((t) => t.status === "done");

    if (allDone && allTopicTasks.length > 0) {
      await ctx.db.patch(task.topicId, { status: "done" });
    } else if (args.status !== "done") {
      const topic = await ctx.db.get(task.topicId);
      if (topic && topic.status === "done") {
        await ctx.db.patch(task.topicId, { status: "in_progress" });
      }
    }

    return true;
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== identity.subject) {
      throw new Error("Task not found or unauthorized");
    }

    // Delete associated reviews if any
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    for (const review of reviews) {
      await ctx.db.delete(review._id);
    }

    await ctx.db.delete(args.taskId);
    return true;
  },
});
