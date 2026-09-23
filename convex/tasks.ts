import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export const getTasksByTopic = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

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

export const getTodayTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    // Filter tasks that are either explicitly scheduled for today or not completed yet
    const todayTasks = await Promise.all(
      tasks
        .filter((t) => t.scheduledForToday || t.status === "in_progress")
        .map(async (task) => {
          const topic = await ctx.db.get(task.topicId);
          return {
            ...task,
            topicName: topic?.name || "Unknown Topic",
          };
        })
    );

    return todayTasks;
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
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    dueDate: v.optional(v.number()),
    scheduledForToday: v.optional(v.boolean()),
    parentTaskId: v.optional(v.id("tasks")),
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
      priority: args.priority ?? "medium",
      dueDate: args.dueDate,
      scheduledForToday: args.scheduledForToday ?? false,
      parentTaskId: args.parentTaskId,
      createdAt: now,
      completedAt: status === "done" ? now : undefined,
    });

    if (topic.status === "not_started") {
      await ctx.db.patch(args.topicId, { status: "in_progress" });
    }

    return taskId;
  },
});

export const createSubtask = mutation({
  args: {
    parentTaskId: v.id("tasks"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const parentTask = await ctx.db.get(args.parentTaskId);
    if (!parentTask || parentTask.userId !== identity.subject) {
      throw new Error("Parent task not found or unauthorized");
    }

    const now = Date.now();
    const subtaskId = await ctx.db.insert("tasks", {
      topicId: parentTask.topicId,
      userId: identity.subject,
      title: args.title.trim(),
      status: "not_started",
      parentTaskId: args.parentTaskId,
      createdAt: now,
    });

    return subtaskId;
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
    const isNowDone = args.status === "done";
    const wasDone = task.status === "done";

    await ctx.db.patch(args.taskId, {
      status: args.status,
      completedAt: isNowDone ? now : undefined,
    });

    // Update Activity Log & Spaced Repetition if task marked as done
    if (isNowDone && !wasDone) {
      const todayDate = getTodayDateString();
      const existingLog = await ctx.db
        .query("activity_logs")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", identity.subject).eq("date", todayDate)
        )
        .first();

      if (existingLog) {
        await ctx.db.patch(existingLog._id, {
          count: existingLog.count + 1,
          completedTasks: existingLog.completedTasks + 1,
        });
      } else {
        await ctx.db.insert("activity_logs", {
          userId: identity.subject,
          date: todayDate,
          count: 1,
          completedTasks: 1,
        });
      }

      // Initialize spaced repetition review for this task if it doesn't exist
      const existingReview = await ctx.db
        .query("reviews")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .first();

      if (!existingReview) {
        // Schedule next review for tomorrow (1 day interval)
        const oneDayMs = 24 * 60 * 60 * 1000;
        await ctx.db.insert("reviews", {
          taskId: task._id,
          topicId: task.topicId,
          userId: identity.subject,
          nextReviewDate: now + oneDayMs,
          intervalDays: 1,
          easeFactor: 2.5,
          lastReviewedAt: now,
          repetitions: 1,
        });
      }
    }

    // Update Topic Status
    const allTopicTasks = await ctx.db
      .query("tasks")
      .withIndex("by_topic", (q) => q.eq("topicId", task.topicId))
      .collect();

    const otherTasks = allTopicTasks.filter((t) => t._id !== task._id);
    const allDone = isNowDone && otherTasks.every((t) => t.status === "done");

    if (allDone && allTopicTasks.length > 0) {
      await ctx.db.patch(task.topicId, { status: "done" });
    } else if (!isNowDone) {
      const topic = await ctx.db.get(task.topicId);
      if (topic && topic.status === "done") {
        await ctx.db.patch(task.topicId, { status: "in_progress" });
      }
    }

    return true;
  },
});

export const toggleTaskScheduled = mutation({
  args: {
    taskId: v.id("tasks"),
    scheduledForToday: v.boolean(),
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

    await ctx.db.patch(args.taskId, {
      scheduledForToday: args.scheduledForToday,
    });

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

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    for (const review of reviews) {
      await ctx.db.delete(review._id);
    }

    // Also cascade delete child subtasks
    const subtasks = await ctx.db
      .query("tasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.taskId))
      .collect();
    for (const sub of subtasks) {
      await ctx.db.delete(sub._id);
    }

    await ctx.db.delete(args.taskId);
    return true;
  },
});

export const getAllTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    const tasksWithTopic = await Promise.all(
      tasks.map(async (task) => {
        const topic = await ctx.db.get(task.topicId);
        return {
          ...task,
          topicName: topic?.name || "Topic",
        };
      })
    );

    return tasksWithTopic;
  },
});

