import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getNotesByTopic = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const notes = await ctx.db
      .query("topic_notes")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .collect();

    // Sort by updatedAt descending
    return notes.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  },
});

export const createNote = mutation({
  args: {
    topicId: v.id("topics"),
    title: v.string(),
    content: v.optional(v.string()),
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

    const now = Date.now();
    const noteId = await ctx.db.insert("topic_notes", {
      topicId: args.topicId,
      userId: identity.subject,
      title: args.title.trim() || "Untitled Note",
      content: args.content || "<p></p>",
      createdAt: now,
      updatedAt: now,
    });

    return noteId;
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("topic_notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== identity.subject) {
      throw new Error("Note not found or unauthorized");
    }

    const updates: Partial<{
      title: string;
      content: string;
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title.trim() || "Untitled Note";
    }
    if (args.content !== undefined) {
      updates.content = args.content;
    }

    await ctx.db.patch(args.noteId, updates);
    return true;
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("topic_notes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== identity.subject) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.db.delete(args.noteId);
    return true;
  },
});
