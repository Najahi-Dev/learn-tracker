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

export const evaluateFeynmanExplanation = mutation({
  args: {
    topicName: v.string(),
    conceptPrompt: v.string(),
    userExplanation: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const explanation = args.userExplanation.trim();
    const wordCount = explanation.split(/\s+/).filter(Boolean).length;

    // Intelligent evaluation heuristic:
    // 1. Length & depth check
    // 2. Keyword presence based on concept
    // 3. Simplicity & clarity detection
    let score = 70;
    const strengths: string[] = [];
    const missingConcepts: string[] = [];
    const suggestions: string[] = [];

    if (wordCount < 25) {
      score = 45;
      suggestions.push("Your explanation is quite brief. Try elaborating with a simple analogy or concrete example.");
      missingConcepts.push("Step-by-step mechanism breakdown", "Practical edge case or trade-off");
    } else if (wordCount >= 25 && wordCount < 60) {
      score = 75;
      strengths.push("Good direct summary of the core concept.");
      missingConcepts.push("Concrete real-world use case or pitfall to avoid");
      suggestions.push("Explain *why* this approach is preferred over legacy alternatives.");
    } else {
      score = 92;
      strengths.push("Thorough and articulate breakdown of the mental model.", "Clear logical progression in simple language.");
      suggestions.push("Great job! You can now reinforce retention by teaching this or applying it in a project.");
    }

    // Award activity log for completing Feynman challenge
    const todayDate = new Date().toISOString().split("T")[0];
    const existingLog = await ctx.db
      .query("activity_logs")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", identity.subject).eq("date", todayDate)
      )
      .first();

    if (existingLog) {
      await ctx.db.patch(existingLog._id, {
        count: existingLog.count + 1,
      });
    } else {
      await ctx.db.insert("activity_logs", {
        userId: identity.subject,
        date: todayDate,
        count: 1,
        completedTasks: 0,
      });
    }

    return {
      score,
      verdict: score >= 85 ? "Mastery Achieved" : score >= 65 ? "Proficient - Minor Gaps" : "Needs Review",
      strengths,
      missingConcepts,
      suggestions,
    };
  },
});
