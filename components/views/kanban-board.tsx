"use client";

import Link from "next/link";
import { useMutation } from "convex/react";
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
import { CheckCircle2, Clock, Layers, ArrowRight, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import type { TopicItem, TopicStatus } from "@/components/topic-card";
import type { Id } from "@/convex/_generated/dataModel";

interface KanbanBoardProps {
  topics: TopicItem[];
}

export function KanbanBoard({ topics }: KanbanBoardProps) {
  const updateTopicStatus = useMutation(api.topics.updateTopicStatus);

  const columns: Array<{ id: TopicStatus; title: string; icon: LucideIcon; color: string }> = [
    {
      id: "not_started",
      title: "Not Started / Backlog",
      icon: Layers,
      color: "text-zinc-500 dark:text-zinc-400",
    },
    {
      id: "in_progress",
      title: "Currently Learning",
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "done",
      title: "Mastered",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const handleMoveStatus = async (topicId: Id<"topics">, nextStatus: TopicStatus) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col) => {
        const colTopics = topics.filter((t) => t.status === col.id);
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-xl border border-border bg-muted/20 p-4 shadow-2xs space-y-3 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${col.color}`} />
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              </div>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {colTopics.length}
              </Badge>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1">
              {colTopics.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/80 text-xs text-muted-foreground italic">
                  No topics in this column
                </div>
              ) : (
                colTopics.map((topic) => {
                  const totalTasks = topic.totalTasks || 0;
                  const doneTasks = topic.doneTasks || 0;
                  const progress = topic.progress || 0;

                  return (
                    <div
                      key={topic._id}
                      className="group relative rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/dashboard/topics/${topic._id}`}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex-1 line-clamp-1"
                        >
                          {topic.name}
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={topic.status === "not_started"}
                              onClick={() => handleMoveStatus(topic._id, "not_started")}
                            >
                              Move to Not Started
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={topic.status === "in_progress"}
                              onClick={() => handleMoveStatus(topic._id, "in_progress")}
                            >
                              Move to Currently Learning
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={topic.status === "done"}
                              onClick={() => handleMoveStatus(topic._id, "done")}
                            >
                              Move to Mastered
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {topic.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {topic.description}
                        </p>
                      )}

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            {doneTasks}/{totalTasks} milestones
                          </span>
                          <span className="font-semibold text-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        <Link
                          href={`/dashboard/topics/${topic._id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                        >
                          Open details <ArrowRight className="h-3 w-3" />
                        </Link>
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
  );
}
