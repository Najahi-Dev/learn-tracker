import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getDueReviews = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const now = Date.now();
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    // Find reviews that are due (or overdue)
    const dueReviews = reviews.filter((r) => r.nextReviewDate <= now);

    const enriched = await Promise.all(
      dueReviews.map(async (review) => {
        const task = await ctx.db.get(review.taskId);
        let topicName = "General";
        if (review.topicId) {
          const topic = await ctx.db.get(review.topicId);
          if (topic) topicName = topic.name;
        } else if (task) {
          const topic = await ctx.db.get(task.topicId);
          if (topic) topicName = topic.name;
        }

        return {
          ...review,
          taskTitle: task?.title || "Completed Task",
          topicName,
        };
      })
    );

    return enriched;
  },
});

export const submitReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    rating: v.union(
      v.literal("again"), // 0
      v.literal("hard"),  // 1
      v.literal("good"),  // 2
      v.literal("easy")   // 3
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const review = await ctx.db.get(args.reviewId);
    if (!review || review.userId !== identity.subject) {
      throw new Error("Review not found or unauthorized");
    }

    let intervalDays = review.intervalDays || 1;
    let easeFactor = review.easeFactor || 2.5;
    let repetitions = review.repetitions || 1;

    switch (args.rating) {
      case "again":
        repetitions = 0;
        intervalDays = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        break;
      case "hard":
        repetitions = Math.max(1, repetitions);
        intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        break;
      case "good":
        repetitions += 1;
        if (repetitions === 1) {
          intervalDays = 1;
        } else if (repetitions === 2) {
          intervalDays = 3;
        } else {
          intervalDays = Math.round(intervalDays * easeFactor);
        }
        break;
      case "easy":
        repetitions += 1;
        easeFactor = Math.min(3.0, easeFactor + 0.15);
        if (repetitions === 1) {
          intervalDays = 3;
        } else if (repetitions === 2) {
          intervalDays = 7;
        } else {
          intervalDays = Math.round(intervalDays * easeFactor * 1.3);
        }
        break;
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const nextReviewDate = now + intervalDays * oneDayMs;

    await ctx.db.patch(args.reviewId, {
      intervalDays,
      easeFactor,
      repetitions,
      lastReviewedAt: now,
      nextReviewDate,
    });

    return { nextReviewDate, intervalDays };
  },
});
