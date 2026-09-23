"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  MoreHorizontal,
  GripVertical,
  Calendar,
  Sparkles,
  ArrowDown,
  BookOpen,
  CheckSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import type { TopicItem, TopicStatus } from "@/components/topic-card";
import type { Id } from "@/convex/_generated/dataModel";

interface KanbanBoardProps {
  topics: TopicItem[];
}

type BoardMode = "topics" | "tasks";

export function KanbanBoard({ topics }: KanbanBoardProps) {
  const [boardMode, setBoardMode] = useState<BoardMode>("topics");
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<string | null>(null);

  const updateTopicStatus = useMutation(api.topics.updateTopicStatus);
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);
  const allTasks = useQuery(api.tasks.getAllTasks);

  const columns: Array<{
    id: "not_started" | "in_progress" | "done";
    title: string;
    icon: LucideIcon;
    color: string;
    badgeBg: string;
  }> = [
    {
      id: "not_started",
      title: "Not Started / Backlog",
      icon: Layers,
      color: "text-zinc-500 dark:text-zinc-400",
      badgeBg: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    },
    {
      id: "in_progress",
      title: "Currently Learning",
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      badgeBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    },
    {
      id: "done",
      title: "Mastered / Done",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      badgeBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
  ];

  // Drag & Drop handlers for Topics
  const handleTopicDragStart = (e: React.DragEvent, topic: TopicItem) => {
    e.dataTransfer.setData("text/plain", topic._id);
    e.dataTransfer.setData("application/type", "topic");
    e.dataTransfer.setData("application/current-status", topic.status);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTopicId(topic._id);
  };

  const handleTaskDragStart = (e: React.DragEvent, task: { _id: string; status: string; title: string }) => {
    e.dataTransfer.setData("text/plain", task._id);
    e.dataTransfer.setData("application/type", "task");
    e.dataTransfer.setData("application/current-status", task.status);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(task._id);
  };

  const handleDragEnd = () => {
    setDraggedTopicId(null);
    setDraggedTaskId(null);
    setActiveDropCol(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (colId: string) => {
    setActiveDropCol(colId);
  };

  const handleDragLeave = (e: React.DragEvent, colId: string) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (activeDropCol === colId) {
        setActiveDropCol(null);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColId: "not_started" | "in_progress" | "done") => {
    e.preventDefault();
    setActiveDropCol(null);
    setDraggedTopicId(null);
    setDraggedTaskId(null);

    const itemId = e.dataTransfer.getData("text/plain");
    const itemType = e.dataTransfer.getData("application/type");
    const currentStatus = e.dataTransfer.getData("application/current-status");

    if (!itemId || currentStatus === targetColId) {
      return;
    }

    if (itemType === "topic") {
      try {
        await updateTopicStatus({
          topicId: itemId as Id<"topics">,
          status: targetColId,
        });
        const statusLabel = targetColId === "not_started" ? "Not Started" : targetColId === "in_progress" ? "Currently Learning" : "Mastered";
        toast.success(`Topic moved to "${statusLabel}"`);
      } catch (err) {
        console.error("Failed to move topic:", err);
        toast.error("Failed to update topic status.");
      }
    } else if (itemType === "task") {
      try {
        await updateTaskStatus({
          taskId: itemId as Id<"tasks">,
          status: targetColId,
        });
        const statusLabel = targetColId === "not_started" ? "Not Started" : targetColId === "in_progress" ? "In Progress" : "Done";
        toast.success(`Task moved to "${statusLabel}"`);
      } catch (err) {
        console.error("Failed to move task:", err);
        toast.error("Failed to update task status.");
      }
    }
  };

  const handleMoveTopicStatus = async (topicId: Id<"topics">, nextStatus: TopicStatus) => {
    try {
      await updateTopicStatus({
        topicId,
        status: nextStatus,
      });
      toast.success(`Moved topic to ${nextStatus.replace("_", " ")}`);
    } catch (err) {
      console.error("Failed to move topic:", err);
      toast.error("Failed to update topic status.");
    }
  };

  const handleMoveTaskStatus = async (taskId: Id<"tasks">, nextStatus: "not_started" | "in_progress" | "done") => {
    try {
      await updateTaskStatus({
        taskId,
        status: nextStatus,
      });
      toast.success(`Moved task to ${nextStatus.replace("_", " ")}`);
    } catch (err) {
      console.error("Failed to move task:", err);
      toast.error("Failed to update task status.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Board Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            onClick={() => setBoardMode("topics")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              boardMode === "topics"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Topics Board ({topics.length})</span>
          </button>
          <button
            onClick={() => setBoardMode("tasks")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              boardMode === "tasks"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5 text-primary" />
            <span>Tasks / Milestones ({allTasks?.length ?? 0})</span>
          </button>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5" /> Drag & drop cards between columns to update status
        </span>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const isDraggingOver = activeDropCol === col.id;

          if (boardMode === "topics") {
            const colTopics = topics.filter((t) => t.status === col.id);
            const Icon = col.icon;

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-2xl border transition-all duration-200 p-4 space-y-3 min-h-[550px] ${
                  isDraggingOver
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-md"
                    : "border-border/80 bg-muted/20 shadow-2xs"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${col.color}`} />
                    <h3 className="text-sm font-bold text-foreground">{col.title}</h3>
                  </div>
                  <Badge variant="outline" className={`text-xs font-bold px-2 py-0.5 border-0 ${col.badgeBg}`}>
                    {colTopics.length}
                  </Badge>
                </div>

                {/* Drop Zone Visual Indicator */}
                {isDraggingOver && draggedTopicId && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary/10 p-3 text-xs font-bold text-primary animate-pulse">
                    <ArrowDown className="h-4 w-4" />
                    <span>Drop here to mark as {col.title}</span>
                  </div>
                )}

                {/* Column Cards */}
                <div className="space-y-3 flex-1">
                  {colTopics.length === 0 ? (
                    <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                      <Layers className="h-6 w-6 text-muted-foreground/40 mb-1" />
                      <p className="font-medium">No topics here</p>
                      <p className="text-[11px] text-muted-foreground/70">Drag a topic here</p>
                    </div>
                  ) : (
                    colTopics.map((topic) => {
                      const totalTasks = topic.totalTasks || 0;
                      const doneTasks = topic.doneTasks || 0;
                      const progress = topic.progress || 0;
                      const isBeingDragged = draggedTopicId === topic._id;

                      return (
                        <div
                          key={topic._id}
                          draggable
                          onDragStart={(e) => handleTopicDragStart(e, topic)}
                          onDragEnd={handleDragEnd}
                          className={`group relative rounded-xl border bg-card p-4 transition-all duration-200 space-y-3 cursor-grab active:cursor-grabbing select-none ${
                            isBeingDragged
                              ? "opacity-40 border-dashed border-primary ring-2 ring-primary/40 scale-[0.98] shadow-lg"
                              : "border-border/80 shadow-xs hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing shrink-0">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <Link
                                href={`/dashboard/topics/${topic._id}`}
                                className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {topic.name}
                              </Link>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  disabled={topic.status === "not_started"}
                                  onClick={() => handleMoveTopicStatus(topic._id, "not_started")}
                                >
                                  Move to Not Started
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={topic.status === "in_progress"}
                                  onClick={() => handleMoveTopicStatus(topic._id, "in_progress")}
                                >
                                  Move to Currently Learning
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={topic.status === "done"}
                                  onClick={() => handleMoveTopicStatus(topic._id, "done")}
                                >
                                  Move to Mastered
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {topic.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-6">
                              {topic.description}
                            </p>
                          )}

                          {topic.tags && topic.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-6">
                              {topic.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="space-y-1.5 pt-1 pl-6">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>
                                {doneTasks}/{totalTasks} milestones
                              </span>
                              <span className="font-bold text-foreground">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/40 pl-6">
                            <span className="text-[10px] text-muted-foreground font-medium">
                              Drag to change status
                            </span>
                            <Link
                              href={`/dashboard/topics/${topic._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                            >
                              Workspace <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          }

          // Tasks Board Mode
          const colTasks = (allTasks || []).filter((t) => t.status === col.id);
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border transition-all duration-200 p-4 space-y-3 min-h-[550px] ${
                isDraggingOver
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-md"
                  : "border-border/80 bg-muted/20 shadow-2xs"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${col.color}`} />
                  <h3 className="text-sm font-bold text-foreground">{col.title}</h3>
                </div>
                <Badge variant="outline" className={`text-xs font-bold px-2 py-0.5 border-0 ${col.badgeBg}`}>
                  {colTasks.length}
                </Badge>
              </div>

              {/* Drop Zone Visual Indicator */}
              {isDraggingOver && draggedTaskId && (
                <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary/10 p-3 text-xs font-bold text-primary animate-pulse">
                  <ArrowDown className="h-4 w-4" />
                  <span>Drop here to mark as {col.title}</span>
                </div>
              )}

              {/* Task Cards */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                    <CheckSquare className="h-6 w-6 text-muted-foreground/40 mb-1" />
                    <p className="font-medium">No milestones in this stage</p>
                    <p className="text-[11px] text-muted-foreground/70">Drag a milestone here</p>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isBeingDragged = draggedTaskId === task._id;

                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleTaskDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        className={`group relative rounded-xl border bg-card p-3.5 transition-all duration-200 space-y-2.5 cursor-grab active:cursor-grabbing select-none ${
                          isBeingDragged
                            ? "opacity-40 border-dashed border-primary ring-2 ring-primary/40 scale-[0.98] shadow-lg"
                            : "border-border/80 shadow-xs hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing shrink-0 mt-0.5">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-foreground leading-snug">
                              {task.title}
                            </span>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={task.status === "not_started"}
                                onClick={() => handleMoveTaskStatus(task._id, "not_started")}
                              >
                                Move to Not Started
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={task.status === "in_progress"}
                                onClick={() => handleMoveTaskStatus(task._id, "in_progress")}
                              >
                                Move to In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={task.status === "done"}
                                onClick={() => handleMoveTaskStatus(task._id, "done")}
                              >
                                Move to Done
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Topic Tag & Priority */}
                        <div className="flex items-center justify-between gap-2 pl-6">
                          <Link
                            href={`/dashboard/topics/${task.topicId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors truncate max-w-[140px]"
                          >
                            {task.topicName}
                          </Link>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.priority && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold uppercase px-1.5 py-0 h-4 border-0 ${
                                  task.priority === "high"
                                    ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                    : task.priority === "medium"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}
                              >
                                {task.priority}
                              </Badge>
                            )}

                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
