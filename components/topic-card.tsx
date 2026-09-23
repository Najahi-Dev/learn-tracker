"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";

import type { Id } from "@/convex/_generated/dataModel";

export type TopicStatus = "not_started" | "in_progress" | "done";

export interface TopicItem {
  _id: Id<"topics">;
  name: string;
  description?: string;
  status: TopicStatus;
  createdAt: number;
  totalTasks?: number;
  doneTasks?: number;
  progress?: number;
}

interface TopicCardProps {
  topic: TopicItem;
}

export function TopicCard({ topic }: TopicCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteTopic = useMutation(api.topics.deleteTopic);

  const totalTasks = topic.totalTasks ?? 0;
  const doneTasks = topic.doneTasks ?? 0;
  const progress = topic.progress ?? (totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${topic.name}" and all its tasks?`)) {
      try {
        setIsDeleting(true);
        await deleteTopic({ topicId: topic._id });
      } catch (err) {
        console.error("Failed to delete topic:", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const statusLabel = {
    not_started: "Not Started",
    in_progress: "In Progress",
    done: "Done",
  }[topic.status];

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
      <Link
        href={`/dashboard/topics/${topic._id}`}
        className="absolute inset-0 z-0"
        aria-label={`View ${topic.name}`}
      />

      <div>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="space-y-1 pr-4">
            <CardTitle className="line-clamp-1 text-base font-semibold group-hover:text-primary transition-colors">
              {topic.name}
            </CardTitle>
            {topic.description ? (
              <CardDescription className="line-clamp-2 text-xs">
                {topic.description}
              </CardDescription>
            ) : (
              <CardDescription className="text-xs text-muted-foreground/60 italic">
                No description
              </CardDescription>
            )}
          </div>

          <div className="relative z-10 flex items-center gap-1.5 shrink-0">
            <Badge variant={topic.status} className="capitalize font-medium text-[11px] px-2 py-0.5">
              {statusLabel}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Topic
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                {doneTasks} of {totalTasks} tasks done
              </span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-0 pb-4 text-xs text-muted-foreground flex items-center justify-between">
        <span>
          Added {new Date(topic.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
        <span className="inline-flex items-center font-medium text-primary group-hover:translate-x-0.5 transition-transform text-xs">
          View Tasks <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </span>
      </CardFooter>
    </Card>
  );
}
