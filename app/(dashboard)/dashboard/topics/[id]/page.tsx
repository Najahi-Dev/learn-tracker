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
  ChevronDown,
  CornerDownRight,
  Sparkles,
  Zap,
  Clock,
  CalendarDays,
  Flame,
  GripVertical,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MarkdownNotes } from "@/components/notes/markdown-notes";
import { FeynmanEvaluatorDialog } from "@/components/ai/feynman-evaluator-dialog";
import { PdfUploadDialog } from "@/components/ai/pdf-upload-dialog";
import { ZenFocusModal } from "@/components/focus/zen-focus-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select2Dropdown, type Select2Option } from "@/components/ui/select2-dropdown";
import { FlatpickrDatePicker } from "@/components/ui/flatpickr-date-picker";
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
  dueDate?: number;
  scheduledForToday?: boolean;
  parentTaskId?: Id<"tasks">;
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
  const createSubtask = useMutation(api.tasks.createSubtask);
  const updateTask = useMutation(api.tasks.updateTask);
  const reorderTasks = useMutation(api.tasks.reorderTasks);
  const reorderSubtasks = useMutation(api.tasks.reorderSubtasks);

  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "done" | "high" | "deadlines">("all");
  const [taskSearch, setTaskSearch] = useState("");

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [draggedSubtaskId, setDraggedSubtaskId] = useState<string | null>(null);
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState<string | null>(null);

  // Edit Task State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskPriority, setEditingTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [editingTaskDueDate, setEditingTaskDueDate] = useState<Date | null>(null);
  const [isSavingTaskEdit, setIsSavingTaskEdit] = useState(false);

  // Edit Subtask State
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [isSavingSubtaskEdit, setIsSavingSubtaskEdit] = useState(false);

  // Subtasks State
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<Record<string, string>>({});
  const [isAddingSubtask, setIsAddingSubtask] = useState<Record<string, boolean>>({});

  const toggleExpandTask = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleAddSubtask = async (parentTaskId: Id<"tasks">) => {
    const title = (newSubtaskTitles[parentTaskId] || "").trim();
    if (!title) return;

    try {
      setIsAddingSubtask((prev) => ({ ...prev, [parentTaskId]: true }));
      await createSubtask({
        parentTaskId,
        title,
      });
      setNewSubtaskTitles((prev) => ({ ...prev, [parentTaskId]: "" }));
      setExpandedTaskIds((prev) => new Set(prev).add(parentTaskId));
      toast.success("Subtask added!");
    } catch (err) {
      console.error("Failed to add subtask:", err);
      toast.error("Failed to add subtask.");
    } finally {
      setIsAddingSubtask((prev) => ({ ...prev, [parentTaskId]: false }));
    }
  };

  const handleDropTask = async (targetTaskId: Id<"tasks">) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const currentTaskIds = mainTasks.map((t) => t._id);
    const fromIndex = currentTaskIds.indexOf(draggedTaskId as Id<"tasks">);
    const toIndex = currentTaskIds.indexOf(targetTaskId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const reordered = [...currentTaskIds];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);

    setDraggedTaskId(null);
    setDragOverTaskId(null);

    try {
      await reorderTasks({
        topicId,
        orderedTaskIds: reordered,
      });
      toast.success("Task position updated!");
    } catch (err) {
      console.error("Failed to reorder tasks:", err);
      toast.error("Failed to update task order.");
    }
  };

  const handleDropSubtask = async (parentTaskId: Id<"tasks">, targetSubtaskId: Id<"tasks">) => {
    if (!draggedSubtaskId || draggedSubtaskId === targetSubtaskId) {
      setDraggedSubtaskId(null);
      setDragOverSubtaskId(null);
      return;
    }

    const currentSubtasks = subtasksByParent[parentTaskId] || [];
    const currentSubtaskIds = currentSubtasks.map((s) => s._id);
    const fromIndex = currentSubtaskIds.indexOf(draggedSubtaskId as Id<"tasks">);
    const toIndex = currentSubtaskIds.indexOf(targetSubtaskId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedSubtaskId(null);
      setDragOverSubtaskId(null);
      return;
    }

    const reordered = [...currentSubtaskIds];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);

    setDraggedSubtaskId(null);
    setDragOverSubtaskId(null);

    try {
      await reorderSubtasks({
        orderedSubtaskIds: reordered,
      });
      toast.success("Subtask position updated!");
    } catch (err) {
      console.error("Failed to reorder subtasks:", err);
    }
  };

  const handleStartEditTask = (task: TaskItem) => {
    setEditingTaskId(task._id);
    setEditingTaskTitle(task.title);
    setEditingTaskPriority(task.priority || "medium");
    setEditingTaskDueDate(task.dueDate ? new Date(task.dueDate) : null);
  };

  const handleSaveEditTask = async (taskId: Id<"tasks">) => {
    if (!editingTaskTitle.trim()) {
      toast.error("Task title cannot be empty.");
      return;
    }

    try {
      setIsSavingTaskEdit(true);
      await updateTask({
        taskId,
        title: editingTaskTitle.trim(),
        priority: editingTaskPriority,
        dueDate: editingTaskDueDate ? editingTaskDueDate.getTime() : undefined,
      });
      setEditingTaskId(null);
      toast.success("Task updated successfully!");
    } catch (err) {
      console.error("Failed to update task:", err);
      toast.error("Failed to update task.");
    } finally {
      setIsSavingTaskEdit(false);
    }
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTaskTitle("");
    setEditingTaskDueDate(null);
  };

  const handleStartEditSubtask = (sub: TaskItem) => {
    setEditingSubtaskId(sub._id);
    setEditingSubtaskTitle(sub.title);
  };

  const handleSaveEditSubtask = async (subId: Id<"tasks">) => {
    if (!editingSubtaskTitle.trim()) {
      toast.error("Subtask title cannot be empty.");
      return;
    }

    try {
      setIsSavingSubtaskEdit(true);
      await updateTask({
        taskId: subId,
        title: editingSubtaskTitle.trim(),
      });
      setEditingSubtaskId(null);
      toast.success("Subtask updated!");
    } catch (err) {
      console.error("Failed to update subtask:", err);
      toast.error("Failed to update subtask.");
    } finally {
      setIsSavingSubtaskEdit(false);
    }
  };

  const handleCancelEditSubtask = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskTitle("");
  };

  // Milestone Creation Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  const [scheduleToday, setScheduleToday] = useState(false);
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
        dueDate: deadlineDate ? deadlineDate.getTime() : undefined,
        scheduledForToday: scheduleToday,
      });
      setNewTaskTitle("");
      setDeadlineDate(null);
      setScheduleToday(false);
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

  // Helper to compute deadline display & urgency
  const getDeadlineInfo = (dueDate?: number, isDone?: boolean) => {
    if (!dueDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (isDone) {
      return {
        label: `Target: ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        isOverdue: false,
        className: "text-muted-foreground/60 border-border/40",
      };
    }

    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)}d (${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })})`,
        isOverdue: true,
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-semibold",
      };
    } else if (diffDays === 0) {
      return {
        label: "Due Today",
        isOverdue: false,
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold",
      };
    } else if (diffDays === 1) {
      return {
        label: "Due Tomorrow",
        isOverdue: false,
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium",
      };
    } else {
      return {
        label: `Due in ${diffDays}d (${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })})`,
        isOverdue: false,
        className: "bg-muted/40 text-muted-foreground border-border/60 font-medium",
      };
    }
  };

  // Group tasks into Main Tasks and Subtasks
  const { mainTasks, subtasksByParent } = useMemo(() => {
    if (!tasks) return { mainTasks: [], subtasksByParent: {} };

    const subs: Record<string, TaskItem[]> = {};
    const mains: TaskItem[] = [];

    tasks.forEach((t) => {
      if (t.parentTaskId) {
        if (!subs[t.parentTaskId]) subs[t.parentTaskId] = [];
        subs[t.parentTaskId].push(t);
      } else {
        mains.push(t);
      }
    });

    return { mainTasks: mains, subtasksByParent: subs };
  }, [tasks]);

  // Filtered main tasks calculation
  const filteredTasks = useMemo(() => {
    return mainTasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(taskSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (taskFilter === "pending") return task.status !== "done";
      if (taskFilter === "done") return task.status === "done";
      if (taskFilter === "high") return task.priority === "high";
      if (taskFilter === "deadlines") return !!task.dueDate;
      return true;
    });
  }, [mainTasks, taskFilter, taskSearch]);

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

  const totalTasks = mainTasks.length;
  const doneTasks = mainTasks.filter((t) => t.status === "done").length;
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
          <PdfUploadDialog topicId={topicId} topicName={topic.name} />
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
          {/* Executive Unified Milestone Composer */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Add Learning Milestone</h3>
                  <p className="text-[11px] text-muted-foreground">Break topic into actionable targets with deadlines & priorities.</p>
                </div>
              </div>

              <PdfUploadDialog
                topicId={topicId}
                topicName={topic.name}
                triggerButton={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 gap-1.5 h-8"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Upload Syllabus / PDF</span>
                  </Button>
                }
              />
            </div>

            <form onSubmit={handleAddTask} className="space-y-3 pt-1">
              {/* Milestone Title Input */}
              <div>
                <Input
                  placeholder="What milestone, concept, or project do you want to accomplish?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  disabled={isSubmitting}
                  className="h-10 text-sm font-medium border-border/80 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {/* Action & Metadata Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-border/40">
                {/* Meta Fields Group */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Target Deadline Flatpickr */}
                  <div className="w-full sm:w-48">
                    <FlatpickrDatePicker
                      value={deadlineDate}
                      onChange={(d) => setDeadlineDate(d)}
                      placeholder="Target Deadline"
                      minDate="today"
                    />
                  </div>

                  {/* Priority Selector */}
                  <div className="w-full sm:w-40">
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

                  {/* Schedule for Today Toggle Pill */}
                  <button
                    type="button"
                    onClick={() => setScheduleToday(!scheduleToday)}
                    className={`flex items-center gap-1.5 h-9 rounded-md border px-3 text-xs font-medium transition-all cursor-pointer ${
                      scheduleToday
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                        : "border-input bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${scheduleToday ? "fill-amber-500 text-amber-500" : ""}`} />
                    <span>{scheduleToday ? "Today's Queue" : "Add to Today"}</span>
                  </button>
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !newTaskTitle.trim()}
                  className="gap-1.5 h-9 px-4.5 font-semibold text-xs rounded-lg shadow-xs cursor-pointer shrink-0 ml-auto sm:ml-0"
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
              <button
                onClick={() => setTaskFilter("deadlines")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "deadlines"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                With Deadlines
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
                    ? "Try clearing your search or switching filters."
                    : "Use the form above to add milestones and set target deadlines."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTasks.map((task) => {
                  const isDone = task.status === "done";
                  const isScheduled = !!task.scheduledForToday;
                  const deadlineInfo = getDeadlineInfo(task.dueDate, isDone);
                  const isExpanded = expandedTaskIds.has(task._id);
                  const subtasks = subtasksByParent[task._id] || [];
                  const totalSubs = subtasks.length;
                  const doneSubs = subtasks.filter((s) => s.status === "done").length;
                  const subProgress = totalSubs === 0 ? 0 : Math.round((doneSubs / totalSubs) * 100);
                  const isCurrentlyDragged = draggedTaskId === task._id;
                  const isDragOver = dragOverTaskId === task._id;

                  return (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", task._id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggedTaskId(task._id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverTaskId !== task._id) {
                          setDragOverTaskId(task._id);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverTaskId === task._id) {
                          setDragOverTaskId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropTask(task._id);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverTaskId(null);
                      }}
                      className={`group flex flex-col rounded-2xl border transition-all ${
                        isCurrentlyDragged
                          ? "opacity-40 scale-[0.99] border-dashed border-primary"
                          : isDragOver
                          ? "border-primary ring-2 ring-primary/40 bg-primary/5 shadow-md"
                          : isDone
                          ? "border-border/50 bg-muted/20 text-muted-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/50 shadow-2xs hover:shadow-xs"
                      }`}
                    >
                      {/* Main Task Header Row */}
                      {editingTaskId === task._id ? (
                        <div className="flex flex-col gap-3 p-3.5 sm:p-4 bg-primary/5 rounded-2xl border-2 border-primary/50 shadow-xs">
                          {/* Row 1: Milestone Title Input */}
                          <div className="w-full">
                            <Input
                              value={editingTaskTitle}
                              onChange={(e) => setEditingTaskTitle(e.target.value)}
                              placeholder="Milestone title..."
                              className="h-9 text-xs sm:text-sm font-semibold bg-background w-full border-border/80 focus-visible:ring-primary"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveEditTask(task._id);
                                } else if (e.key === "Escape") {
                                  handleCancelEditTask();
                                }
                              }}
                            />
                          </div>

                          {/* Row 2: Metadata Controls & Action Buttons */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-primary/20">
                            <div className="flex flex-wrap items-center gap-2.5">
                              {/* Priority Dropdown */}
                              <div className="w-full sm:w-40">
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
                                  value={editingTaskPriority}
                                  onChange={(val) =>
                                    setEditingTaskPriority(val as "low" | "medium" | "high")
                                  }
                                  isSearchable={false}
                                />
                              </div>

                              {/* Target Deadline Picker */}
                              <div className="w-full sm:w-44">
                                <FlatpickrDatePicker
                                  value={editingTaskDueDate}
                                  onChange={(d) => setEditingTaskDueDate(d)}
                                  placeholder="Target Deadline"
                                  minDate="today"
                                />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 ml-auto shrink-0 pt-1 sm:pt-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEditTask}
                                disabled={isSavingTaskEdit}
                                className="h-8.5 px-3 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Cancel</span>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSaveEditTask(task._id)}
                                disabled={isSavingTaskEdit || !editingTaskTitle.trim()}
                                className="h-8.5 px-3.5 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs"
                              >
                                {isSavingTaskEdit ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                <span>Save Changes</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3.5 sm:p-4 gap-3">
                          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 min-w-0 pr-2">
                            {/* Drag Handle */}
                            <div
                              className="text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing p-1 -ml-1 rounded touch-none transition-colors"
                              title="Drag to reorder position"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>

                            {/* Chevron Accordion Trigger */}
                            <button
                              type="button"
                              onClick={() => toggleExpandTask(task._id)}
                              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted cursor-pointer shrink-0"
                              title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                            >
                              <ChevronRight
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  isExpanded ? "rotate-90 text-primary" : ""
                                }`}
                              />
                            </button>

                            {/* Checkbox */}
                            <Checkbox
                              checked={isDone}
                              onCheckedChange={() => handleToggleTask(task._id, task.status)}
                              id={`task-${task._id}`}
                              aria-label={`Mark task ${task.title} as ${isDone ? "incomplete" : "complete"}`}
                              className="h-4.5 w-4.5 rounded-md shrink-0"
                            />

                            {/* Title & Metadata */}
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <label
                                  htmlFor={`task-${task._id}`}
                                  className={`text-sm cursor-pointer select-none truncate ${
                                    isDone ? "line-through text-muted-foreground" : "font-semibold text-foreground"
                                  }`}
                                >
                                  {task.title}
                                </label>

                                {/* Subtasks Count Pill */}
                                <button
                                  type="button"
                                  onClick={() => toggleExpandTask(task._id)}
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                                    totalSubs > 0
                                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  }`}
                                >
                                  <CornerDownRight className="h-3 w-3" />
                                  <span>{totalSubs > 0 ? `${doneSubs}/${totalSubs} sub-tasks` : "+ Add sub-tasks"}</span>
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {/* Deadline Badge */}
                                {deadlineInfo && (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] ${deadlineInfo.className}`}
                                  >
                                    {deadlineInfo.isOverdue ? (
                                      <Clock className="h-3 w-3 text-red-500" />
                                    ) : (
                                      <CalendarDays className="h-3 w-3" />
                                    )}
                                    <span>{deadlineInfo.label}</span>
                                  </span>
                                )}

                                {/* Completed Timestamp */}
                                {task.completedAt && isDone && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                    Completed {new Date(task.completedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
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
                              className={`h-8 w-8 rounded-lg cursor-pointer ${
                                isScheduled ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                            >
                              <Star className={`h-4 w-4 ${isScheduled ? "fill-amber-500" : ""}`} />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEditTask(task)}
                              className="h-8 w-8 rounded-lg text-muted-foreground opacity-70 group-hover:opacity-100 hover:text-primary hover:bg-primary/10 cursor-pointer"
                              title="Edit milestone"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(task._id)}
                              className="h-8 w-8 rounded-lg text-muted-foreground opacity-70 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              aria-label="Delete milestone"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Dropdown Sub-tasks Drawer */}
                      {isExpanded && (
                        <div className="border-t border-border/50 bg-muted/20 px-4 sm:px-6 py-3.5 space-y-3 animate-in fade-in duration-200">
                          {totalSubs > 0 && (
                            <div className="space-y-1.5 pb-1">
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <CornerDownRight className="h-3 w-3 text-primary" />
                                  Sub-tasks Progress
                                </span>
                                <span className="font-bold text-foreground">
                                  {doneSubs} of {totalSubs} completed ({subProgress}%)
                                </span>
                              </div>
                              <Progress value={subProgress} className="h-1.5 rounded-full" />
                            </div>
                          )}

                          {/* Subtasks items */}
                          <div className="space-y-1.5 pl-2 border-l-2 border-primary/40">
                            {subtasks.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic py-1">
                                No sub-tasks yet. Add smaller breakdown steps below.
                              </p>
                            ) : (
                              subtasks.map((sub) => {
                                const isSubDone = sub.status === "done";
                                const isSubDragged = draggedSubtaskId === sub._id;
                                const isSubDragOver = dragOverSubtaskId === sub._id;
                                const isSubEditing = editingSubtaskId === sub._id;

                                if (isSubEditing) {
                                  return (
                                    <div
                                      key={sub._id}
                                      className="flex items-center gap-2 p-1.5 rounded-lg border border-primary bg-primary/5 shadow-xs"
                                    >
                                      <Input
                                        value={editingSubtaskTitle}
                                        onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                                        placeholder="Subtask title..."
                                        className="h-7 text-xs bg-background flex-1"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSaveEditSubtask(sub._id);
                                          } else if (e.key === "Escape") {
                                            handleCancelEditSubtask();
                                          }
                                        }}
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveEditSubtask(sub._id)}
                                        disabled={isSavingSubtaskEdit || !editingSubtaskTitle.trim()}
                                        className="h-7 px-2.5 text-xs gap-1 font-semibold cursor-pointer"
                                      >
                                        {isSavingSubtaskEdit ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                        <span>Save</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEditSubtask}
                                        disabled={isSavingSubtaskEdit}
                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={sub._id}
                                    draggable
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      e.dataTransfer.setData("text/plain", sub._id);
                                      e.dataTransfer.effectAllowed = "move";
                                      setDraggedSubtaskId(sub._id);
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      e.dataTransfer.dropEffect = "move";
                                      if (dragOverSubtaskId !== sub._id) {
                                        setDragOverSubtaskId(sub._id);
                                      }
                                    }}
                                    onDragLeave={(e) => {
                                      e.stopPropagation();
                                      if (dragOverSubtaskId === sub._id) {
                                        setDragOverSubtaskId(null);
                                      }
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDropSubtask(task._id, sub._id);
                                    }}
                                    onDragEnd={(e) => {
                                      e.stopPropagation();
                                      setDraggedSubtaskId(null);
                                      setDragOverSubtaskId(null);
                                    }}
                                    className={`group/sub flex items-center justify-between gap-2.5 rounded-lg border bg-card p-2.5 px-3 text-xs shadow-2xs transition-all ${
                                      isSubDragged
                                        ? "opacity-40 border-dashed border-primary scale-[0.99]"
                                        : isSubDragOver
                                        ? "border-primary ring-1 ring-primary/40 bg-primary/5 shadow-xs"
                                        : "border-border/60 hover:border-primary/40"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <div
                                        className="text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing p-0.5 -ml-1 touch-none"
                                        title="Drag to reorder subtask"
                                      >
                                        <GripVertical className="h-3.5 w-3.5" />
                                      </div>
                                      <Checkbox
                                        checked={isSubDone}
                                        onCheckedChange={() => handleToggleTask(sub._id, sub.status)}
                                        id={`subtask-${sub._id}`}
                                        className="h-3.5 w-3.5 rounded-sm"
                                      />
                                      <label
                                        htmlFor={`subtask-${sub._id}`}
                                        className={`select-none truncate cursor-pointer ${
                                          isSubDone ? "line-through text-muted-foreground" : "font-medium text-foreground"
                                        }`}
                                      >
                                        {sub.title}
                                      </label>
                                    </div>

                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditSubtask(sub)}
                                        className="text-muted-foreground hover:text-primary p-1 rounded transition-colors cursor-pointer"
                                        title="Edit subtask"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTask(sub._id)}
                                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                                        title="Delete subtask"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Inline Add Subtask Input Form */}
                          <div className="flex items-center gap-2 pt-1 pl-2">
                            <input
                              type="text"
                              placeholder="Add a sub-task (e.g. Set up API routes) and press Enter..."
                              value={newSubtaskTitles[task._id] || ""}
                              onChange={(e) =>
                                setNewSubtaskTitles((prev) => ({
                                  ...prev,
                                  [task._id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddSubtask(task._id);
                                }
                              }}
                              className="flex-1 h-8 rounded-lg border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddSubtask(task._id)}
                              disabled={
                                isAddingSubtask[task._id] ||
                                !(newSubtaskTitles[task._id] || "").trim()
                              }
                              className="h-8 px-3 text-xs font-semibold gap-1 rounded-lg cursor-pointer"
                            >
                              {isAddingSubtask[task._id] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                              Add Sub-task
                            </Button>
                          </div>
                        </div>
                      )}
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
