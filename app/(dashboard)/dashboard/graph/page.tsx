"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KnowledgeGraph } from "@/components/views/knowledge-graph";
import { ViewSwitcher } from "@/components/views/view-switcher";
import { CreateTopicDialog } from "@/components/create-topic-dialog";
import { AiRoadmapDialog } from "@/components/ai/ai-roadmap-dialog";
import { Loader2 } from "lucide-react";
import type { TopicItem } from "@/components/topic-card";

export default function KnowledgeGraphPage() {
  const topics = useQuery(api.topics.getTopics) as TopicItem[] | undefined;

  return (
    <div className="space-y-6 w-full">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Interactive Knowledge Graph
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize connections, prerequisites, and learning clusters in an orbital skill tree.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ViewSwitcher />
          <AiRoadmapDialog />
          <CreateTopicDialog />
        </div>
      </div>

      {/* Graph View */}
      {topics === undefined ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Mapping knowledge graph...</p>
        </div>
      ) : (
        <KnowledgeGraph topics={topics} />
      )}
    </div>
  );
}
