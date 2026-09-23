"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FlatpickrDatePicker } from "@/components/ui/flatpickr-date-picker";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Link from "next/link";

import type { Id } from "@/convex/_generated/dataModel";

interface PlannerTask {
  _id: Id<"tasks">;
  topicId: Id<"topics">;
  topicName: string;
  title: string;
  status: "not_started" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  scheduledForToday?: boolean;
}

export default function DailyPlannerPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const todayTasks = useQuery(api.tasks.getTodayTasks) as PlannerTask[] | undefined;
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);
  const toggleTaskScheduled = useMutation(api.tasks.toggleTaskScheduled);

  const handleToggleTask = async (task: PlannerTask) => {
    const nextStatus = task.status === "done" ? "not_started" : "done";
    try {
      await updateTaskStatus({
        taskId: task._id,
        status: nextStatus,
      });

      if (nextStatus === "done") {
        toast.success("Milestone completed! +25 XP");
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
      toast.error("Failed to update task.");
    }
  };

  const handleRemoveFromToday = async (taskId: Id<"tasks">) => {
    try {
      await toggleTaskScheduled({
        taskId,
        scheduledForToday: false,
      });
      toast.info("Removed from today's plan.");
    } catch (err) {
      console.error("Failed to unschedule task:", err);
    }
  };

  const dateFormatted = selectedDate
    ? selectedDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "All Scheduled Milestones";

  const completedCount = todayTasks?.filter((t) => t.status === "done").length || 0;
  const totalCount = todayTasks?.length || 0;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <Calendar className="h-4 w-4" />
            <span>Daily Focus Plan</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-0.5">
            {dateFormatted}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Focus on high-priority milestones to build steady learning momentum.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-56">
            <FlatpickrDatePicker
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                if (date) {
                  toast.info(`Viewing plan for ${date.toLocaleDateString()}`);
                }
              }}
              placeholder="Pick a plan date..."
            />
          </div>

          <div className="rounded-xl border border-border bg-card px-4 py-2 text-right shadow-xs">
            <span className="text-xs text-muted-foreground">Today&apos;s Progress</span>
            <p className="text-lg font-bold text-foreground">
              {completedCount} / {totalCount} Done
            </p>
          </div>
        </div>
      </div>

      {/* Task Queue */}
      {todayTasks === undefined ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading daily tasks...</p>
        </div>
      ) : todayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">Your Daily Queue is Clear!</h3>
          <p className="text-xs text-muted-foreground max-w-md mt-1 mb-5">
            No active tasks scheduled for today. Jump to your topics to pick milestones or start an in-progress study session.
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard">
              <Layers className="mr-1.5 h-4 w-4" /> Explore Topics
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {todayTasks.map((task) => {
            const isDone = task.status === "done";
            return (
              <div
                key={task._id}
                className={`group flex items-center justify-between rounded-xl border p-4 transition-all ${
                  isDone
                    ? "border-border/50 bg-muted/20 opacity-70"
                    : "border-border bg-card text-foreground shadow-xs hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => handleToggleTask(task)}
                    id={`planner-${task._id}`}
                    aria-label={`Mark task ${task.title} as ${isDone ? "incomplete" : "complete"}`}
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <label
                      htmlFor={`planner-${task._id}`}
                      className={`text-sm font-medium cursor-pointer block truncate ${
                        isDone ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {task.topicName}
                      </Badge>
                      {task.priority && (
                        <span
                          className={`text-[10px] font-semibold uppercase ${
                            task.priority === "high"
                              ? "text-red-500"
                              : task.priority === "medium"
                              ? "text-amber-500"
                              : "text-blue-500"
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromToday(task._id)}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Unschedule
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
