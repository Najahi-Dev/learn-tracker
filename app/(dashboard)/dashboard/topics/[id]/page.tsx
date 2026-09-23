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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface TaskItem {
  _id: string;
  topicId: string;
  userId: string;
  title: string;
  status: "not_started" | "in_progress" | "done";
  createdAt: number;
  completedAt?: number;
}

export default function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const topicId = resolvedParams.id;
  const router = useRouter();

  const topic = useQuery(api.topics.getTopicById, {
    topicId,
  }) as { _id: string; name: string; description?: string; status: "not_started" | "in_progress" | "done"; createdAt: number } | null | undefined;
  const tasks = useQuery(api.tasks.getTasksByTopic, {
    topicId,
  }) as TaskItem[] | undefined;

  const createTask = useMutation(api.tasks.createTask);
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const deleteTopic = useMutation(api.topics.deleteTopic);

  const [newTaskTitle, setNewTaskTitle] = useState("");
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
      });
      setNewTaskTitle("");
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
    taskId: string,
    currentStatus: "not_started" | "in_progress" | "done"
  ) => {
    const nextStatus = currentStatus === "done" ? "not_started" : "done";
    try {
      await updateTaskStatus({
        taskId,
        status: nextStatus,
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask({ taskId });
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleDeleteTopic = async () => {
    if (window.confirm("Are you sure you want to delete this topic and all its tasks?")) {
      try {
        await deleteTopic({ topicId });
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button & Header */}
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

        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteTopic}
          className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete Topic
        </Button>
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
            <span className="font-medium text-foreground">Progress</span>
            <span>
              {doneTasks} of {totalTasks} completed ({progress}%)
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Add Task Input Section */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <form onSubmit={handleAddTask} className="flex gap-2.5">
          <Input
            placeholder="Add a new task or study milestone... (press Enter)"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button type="submit" disabled={isSubmitting || !newTaskTitle.trim()} className="gap-1.5 shrink-0">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Task
          </Button>
        </form>
        {taskError && (
          <p className="text-xs text-destructive mt-2">{taskError}</p>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold tracking-tight text-foreground px-1">
          Tasks & Milestones ({totalTasks})
        </h2>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 px-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium">No tasks added yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Break down this topic into specific study steps or practice problems above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isDone = task.status === "done";
              return (
                <div
                  key={task._id}
                  className={`group flex items-center justify-between rounded-lg border p-3.5 transition-all ${
                    isDone
                      ? "border-border/50 bg-muted/30 text-muted-foreground"
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

                  <div className="flex items-center gap-2 shrink-0">
                    {task.completedAt && isDone && (
                      <span className="hidden sm:inline-block text-[11px] text-muted-foreground/80">
                        Done {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    )}

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
  );
}
