"use client";

import { use, useState, useMemo } from "react";
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
  Search,
  Check,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MarkdownNotes } from "@/components/notes/markdown-notes";
import { FeynmanEvaluatorDialog } from "@/components/ai/feynman-evaluator-dialog";
import { ZenFocusModal } from "@/components/focus/zen-focus-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select2Dropdown, type Select2Option } from "@/components/ui/select2-dropdown";
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
  const updateTopicStatus = useMutation(api.topics.updateTopicStatus);
  const toggleTaskScheduled = useMutation(api.tasks.toggleTaskScheduled);
  const deleteTask = useMutation(api.tasks.deleteTask);
  const deleteTopic = useMutation(api.topics.deleteTopic);

  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "done" | "high">("all");
  const [taskSearch, setTaskSearch] = useState("");
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
      toast.success("Milestone added to topic!");
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
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
          toast.success(`Topic "${topic?.name}" 100% Completed!`);
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
        toast.success("Added to today's focus queue!");
      } else {
        toast.info("Removed from today's plan.");
      }
    } catch (err) {
      console.error("Failed to toggle task schedule:", err);
    }
  };

  const handleChangeTopicStatus = async (newStatus: "not_started" | "in_progress" | "done") => {
    try {
      await updateTopicStatus({
        topicId,
        status: newStatus,
      });
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteTask = async (taskId: Id<"tasks">) => {
    try {
      await deleteTask({ taskId });
      toast.success("Milestone removed");
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleConfirmDeleteTopic = async () => {
    try {
      await deleteTopic({ topicId });
      toast.info("Topic deleted");
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to delete topic:", err);
      toast.error("Failed to delete topic");
    }
  };

  // Filtered tasks calculation
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(taskSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (taskFilter === "pending") return task.status !== "done";
      if (taskFilter === "done") return task.status === "done";
      if (taskFilter === "high") return task.priority === "high";
      return true;
    });
  }, [tasks, taskFilter, taskSearch]);

  if (topic === undefined || tasks === undefined) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading topic workspace...</p>
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
  const pendingTasks = totalTasks - doneTasks;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 w-full">
      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Topics
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">
            {topic.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ZenFocusModal />
          <FeynmanEvaluatorDialog topicName={topic.name} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive text-xs h-9 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Hero Workspace Banner Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {topic.name}
              </h1>

              {/* Interactive Status Selector (Select2 Style) */}
              <div className="w-48">
                <Select2Dropdown
                  options={[
                    {
                      value: "not_started",
                      label: "Not Started",
                      icon: <div className="h-2 w-2 rounded-full bg-zinc-400" />,
                    },
                    {
                      value: "in_progress",
                      label: "In Progress",
                      icon: <div className="h-2 w-2 rounded-full bg-blue-500" />,
                    },
                    {
                      value: "done",
                      label: "Mastered",
                      icon: <div className="h-2 w-2 rounded-full bg-emerald-500" />,
                    },
                  ]}
                  value={topic.status}
                  onChange={(val) =>
                    handleChangeTopicStatus(
                      val as "not_started" | "in_progress" | "done"
                    )
                  }
                  isSearchable={false}
                />
              </div>
            </div>

            {topic.description ? (
              <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                {topic.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/70 italic">
                No description provided. Add study notes and milestones below.
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/60 shrink-0">
            <Calendar className="h-3.5 w-3.5" />
            <span>Started {new Date(topic.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Metric Badges & Progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">Total Milestones</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{totalTasks}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">Completed</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{doneTasks}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">In Progress / Pending</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{pendingTasks}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">Overall Mastery</p>
            <p className="text-lg font-bold text-primary mt-0.5">{progress}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Mastery Trajectory
            </span>
            <span className="font-semibold text-foreground">
              {doneTasks} of {totalTasks} milestones ({progress}%)
            </span>
          </div>
          <Progress value={progress} className="h-2.5 rounded-full" />
        </div>
      </div>

      {/* View Tabs: Tasks vs Notes */}
      <div className="flex items-center gap-2 border-b border-border/80">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "tasks"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListTodo className="h-4 w-4" />
          Milestones & Checklist ({totalTasks})
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
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2.5">
              <Input
                placeholder="Add a milestone or study task... (Press Enter to add)"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 h-10"
              />

              <div className="flex items-center gap-2">
                <div className="w-44">
                  <Select2Dropdown
                    options={[
                      {
                        value: "high",
                        label: "High Priority",
                        icon: <div className="h-2 w-2 rounded-full bg-red-500" />,
                      },
                      {
                        value: "medium",
                        label: "Medium Priority",
                        icon: <div className="h-2 w-2 rounded-full bg-amber-500" />,
                      },
                      {
                        value: "low",
                        label: "Low Priority",
                        icon: <div className="h-2 w-2 rounded-full bg-blue-500" />,
                      },
                    ]}
                    value={priority}
                    onChange={(val) => setPriority(val as "low" | "medium" | "high")}
                    isSearchable={false}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !newTaskTitle.trim()}
                  className="gap-1.5 shrink-0 h-9 font-semibold text-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Add Milestone
                </Button>
              </div>
            </form>
            {taskError && (
              <p className="text-xs text-destructive">{taskError}</p>
            )}
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setTaskFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({totalTasks})
              </button>
              <button
                onClick={() => setTaskFilter("pending")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "pending"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending ({pendingTasks})
              </button>
              <button
                onClick={() => setTaskFilter("done")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "done"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Completed ({doneTasks})
              </button>
              <button
                onClick={() => setTaskFilter("high")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "high"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                High Priority
              </button>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search milestones..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 px-4 text-center">
                <CheckCircle2 className="h-9 w-9 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-semibold text-foreground">
                  {taskSearch || taskFilter !== "all"
                    ? "No milestones match this filter"
                    : "No learning milestones yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {taskSearch || taskFilter !== "all"
                    ? "Try clearing your search or switching to 'All'."
                    : "Add your first milestone above to start mastering this topic."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const isDone = task.status === "done";
                  const isScheduled = !!task.scheduledForToday;

                  return (
                    <div
                      key={task._id}
                      className={`group flex items-center justify-between rounded-xl border p-4 transition-all ${
                        isDone
                          ? "border-border/50 bg-muted/20 text-muted-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/50 shadow-2xs hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                        <Checkbox
                          checked={isDone}
                          onCheckedChange={() => handleToggleTask(task._id, task.status)}
                          id={`task-${task._id}`}
                          aria-label={`Mark task ${task.title} as ${isDone ? "incomplete" : "complete"}`}
                          className="h-4.5 w-4.5 rounded-md"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <label
                            htmlFor={`task-${task._id}`}
                            className={`text-sm cursor-pointer select-none truncate ${
                              isDone ? "line-through text-muted-foreground" : "font-medium text-foreground"
                            }`}
                          >
                            {task.title}
                          </label>
                          {task.completedAt && isDone && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                              Completed {new Date(task.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.priority && (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              task.priority === "high"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : task.priority === "medium"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleScheduled(task)}
                          title={isScheduled ? "Remove from Daily Planner" : "Add to Daily Planner"}
                          className={`h-8 w-8 rounded-lg ${
                            isScheduled ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          <Star className={`h-4 w-4 ${isScheduled ? "fill-amber-500" : ""}`} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task._id)}
                          className="h-8 w-8 rounded-lg text-muted-foreground opacity-70 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete milestone"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Professional Confirm Modal for Deleting Topic */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={`Delete "${topic.name}"?`}
        description="Are you sure you want to delete this learning topic? All milestones, study notes, and spaced repetition cards associated with it will be permanently deleted."
        confirmText="Delete Topic"
        onConfirm={handleConfirmDeleteTopic}
      />
    </div>
  );
}
