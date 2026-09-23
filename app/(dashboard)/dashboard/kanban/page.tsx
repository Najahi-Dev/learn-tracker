"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KanbanBoard } from "@/components/views/kanban-board";
import { ViewSwitcher } from "@/components/views/view-switcher";
import { CreateTopicDialog } from "@/components/create-topic-dialog";
import { AiRoadmapDialog } from "@/components/ai/ai-roadmap-dialog";
import { Loader2 } from "lucide-react";
import type { TopicItem } from "@/components/topic-card";

export default function KanbanPage() {
  const topics = useQuery(api.topics.getTopics) as TopicItem[] | undefined;

  return (
    <div className="space-y-6 w-full">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Topic Workflow Board
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your learning pipeline from backlog to mastery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ViewSwitcher />
          <AiRoadmapDialog />
          <CreateTopicDialog />
        </div>
      </div>

      {/* Kanban Board View */}
      {topics === undefined ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading workflow board...</p>
        </div>
      ) : (
        <KanbanBoard topics={topics} />
      )}
    </div>
  );
}
