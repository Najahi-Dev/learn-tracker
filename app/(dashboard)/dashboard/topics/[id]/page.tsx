"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Calendar,
  AlertCircle,
  FileText,
  ListTodo,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MarkdownNotes } from "@/components/notes/markdown-notes";
import { FeynmanEvaluatorDialog } from "@/components/ai/feynman-evaluator-dialog";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import type { Id } from "@/convex/_generated/dataModel";

export interface TaskItem {
  _id: Id<"tasks">;
  topicId: Id<"topics">;
  userId: string;
  title: string;
  status: "not_started" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  scheduledForToday?: boolean;
  createdAt: number;
  completedAt?: number;
}

export default function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const topicId = resolvedParams.id as Id<"topics">;
  const router = useRouter();

  const topic = useQuery(api.topics.getTopicById, {
    topicId,
  }) as {
    _id: Id<"topics">;
    name: string;
    description?: string;
    status: "not_started" | "in_progress" | "done";
    notes?: string;
    resources?: Array<{ title: string; url: string }>;
    createdAt: number;
  } | null | undefined;

  const tasks = useQuery(api.tasks.getTasksByTopic, {
    topicId,
  }) as TaskItem[] | undefined;

  const createTask = useMutation(api.tasks.createTask);
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);
  const toggleTaskScheduled = useMutation(api.tasks.toggleTaskScheduled);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const deleteTopic = useMutation(api.topics.deleteTopic);

  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setIsSubmitting(true);
      setTaskError(null);
      await createTask({
        topicId,
        title: newTaskTitle.trim(),
        status: "not_started",
        priority,
      });
      setNewTaskTitle("");
      toast.success("Task added to topic");
    } catch (err: unknown) {
      console.error("Failed to add task:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to add task.";
      setTaskError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (
    taskId: Id<"tasks">,
    currentStatus: "not_started" | "in_progress" | "done"
  ) => {
    const nextStatus = currentStatus === "done" ? "not_started" : "done";
    try {
      await updateTaskStatus({
        taskId,
        status: nextStatus,
      });

      if (nextStatus === "done") {
        toast.success("Milestone achieved! +25 XP");

        // If this completed all tasks in topic, celebrate!
        const totalOtherIncomplete = tasks?.filter(
          (t) => t._id !== taskId && t.status !== "done"
        ).length;
        if (totalOtherIncomplete === 0) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          toast.success(`Topic "${topic?.name}" 100% Completed! 🎉`);
        }
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleToggleScheduled = async (task: TaskItem) => {
    try {
      const nextVal = !task.scheduledForToday;
      await toggleTaskScheduled({
        taskId: task._id,
        scheduledForToday: nextVal,
      });
      if (nextVal) {
        toast.success("Added to today's study plan!");
      } else {
        toast.info("Removed from today's plan.");
      }
    } catch (err) {
      console.error("Failed to toggle task schedule:", err);
    }
  };

  const handleDeleteTask = async (taskId: Id<"tasks">) => {
    try {
      await deleteTask({ taskId });
      toast.success("Task deleted");
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleDeleteTopic = async () => {
    if (window.confirm("Are you sure you want to delete this topic and all its tasks?")) {
      try {
        await deleteTopic({ topicId });
        toast.info("Topic deleted");
        router.push("/dashboard");
      } catch (err) {
        console.error("Failed to delete topic:", err);
      }
    }
  };

  if (topic === undefined || tasks === undefined) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Loading topic details...</p>
      </div>
    );
  }

  if (topic === null) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">Topic Not Found</h2>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
          This topic may have been removed or you may not have permission to view it.
        </p>
        <Button asChild size="sm">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const statusLabel = {
    not_started: "Not Started",
    in_progress: "In Progress",
    done: "Done",
  }[topic.status];

  return (
    <div className="space-y-6 w-full">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Topics
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <FeynmanEvaluatorDialog topicName={topic.name} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteTopic}
            className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete Topic
          </Button>
        </div>
      </div>

      {/* Topic Info Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {topic.name}
              </h1>
              <Badge variant={topic.status} className="capitalize text-xs font-medium">
                {statusLabel}
              </Badge>
            </div>
            {topic.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {topic.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 sm:pt-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created {new Date(topic.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Mastery Progress</span>
            <span>
              {doneTasks} of {totalTasks} completed ({progress}%)
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* View Tabs: Tasks vs Notes */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "tasks"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListTodo className="h-4 w-4" />
          Tasks & Milestones ({totalTasks})
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "notes"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Study Notes & Links
        </button>
      </div>

      {/* Tab 1: Tasks & Milestones */}
      {activeTab === "tasks" && (
        <div className="space-y-5">
          {/* Add Task Input Section */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2.5">
              <Input
                placeholder="Add a new milestone or study task... (press Enter)"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                disabled={isSubmitting}
                className="flex-1"
              />

              <div className="flex items-center gap-2">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                  className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <Button type="submit" disabled={isSubmitting || !newTaskTitle.trim()} className="gap-1.5 shrink-0">
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Task
                </Button>
              </div>
            </form>
            {taskError && (
              <p className="text-xs text-destructive">{taskError}</p>
            )}
          </div>

          {/* Tasks List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 px-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">No tasks added yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add milestones above to start tracking your learning.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const isDone = task.status === "done";
                  const isScheduled = !!task.scheduledForToday;

                  return (
                    <div
                      key={task._id}
                      className={`group flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                        isDone
                          ? "border-border/50 bg-muted/20 text-muted-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/40 shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                        <Checkbox
                          checked={isDone}
                          onCheckedChange={() => handleToggleTask(task._id, task.status)}
                          id={`task-${task._id}`}
                          aria-label={`Mark task ${task.title} as ${isDone ? "incomplete" : "complete"}`}
                        />
                        <label
                          htmlFor={`task-${task._id}`}
                          className={`text-sm cursor-pointer select-none truncate flex-1 ${
                            isDone ? "line-through text-muted-foreground" : "font-medium"
                          }`}
                        >
                          {task.title}
                        </label>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {task.priority && (
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${
                              task.priority === "high"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : task.priority === "medium"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleScheduled(task)}
                          title={isScheduled ? "Scheduled for Today" : "Schedule for Today"}
                          className={`h-7 w-7 ${
                            isScheduled ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Star className={`h-3.5 w-3.5 ${isScheduled ? "fill-amber-500" : ""}`} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task._id)}
                          className="h-7 w-7 text-muted-foreground opacity-70 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Study Notes & Resources */}
      {activeTab === "notes" && (
        <MarkdownNotes
          topicId={topic._id}
          initialNotes={topic.notes}
          initialResources={topic.resources}
        />
      )}
    </div>
  );
}
