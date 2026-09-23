"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Brain, Sparkles } from "lucide-react";
import type { TopicItem } from "@/components/topic-card";

interface KnowledgeGraphProps {
  topics: TopicItem[];
}

export function KnowledgeGraph({ topics }: KnowledgeGraphProps) {
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(
    topics.length > 0 ? topics[0] : null
  );

  // Arrange nodes dynamically in an orbital circle
  const centerX = 350;
  const centerY = 250;
  const radius = Math.max(160, Math.min(220, topics.length * 30));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* SVG Orbital Knowledge Graph */}
      <div className="lg:col-span-2 relative rounded-2xl border border-border bg-card/60 backdrop-blur-xs p-6 shadow-sm overflow-hidden min-h-[500px] flex items-center justify-center">
        {topics.length === 0 ? (
          <div className="text-center space-y-2 text-muted-foreground">
            <Brain className="h-10 w-10 mx-auto text-primary/60" />
            <p className="text-sm">No topics to map in knowledge graph yet.</p>
          </div>
        ) : (
          <svg
            viewBox="0 0 700 500"
            className="w-full h-full max-h-[500px] select-none"
          >
            {/* Center Core */}
            <circle
              cx={centerX}
              cy={centerY}
              r={38}
              className="fill-primary/15 stroke-primary stroke-2"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={44}
              className="fill-transparent stroke-primary/30 stroke-dashed stroke-1 animate-spin"
              style={{ transformOrigin: `${centerX}px ${centerY}px`, animationDuration: "30s" }}
            />
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              className="fill-foreground text-xs font-bold"
            >
              Knowledge
            </text>
            <text
              x={centerX}
              y={centerY + 12}
              textAnchor="middle"
              className="fill-primary text-[10px] font-semibold"
            >
              Core
            </text>

            {/* Connecting Lines & Topic Nodes */}
            {topics.map((topic, index) => {
              const angle = (index / topics.length) * 2 * Math.PI - Math.PI / 2;
              const nodeX = centerX + radius * Math.cos(angle);
              const nodeY = centerY + radius * Math.sin(angle);
              const isSelected = selectedTopic?._id === topic._id;

              const isDone = topic.status === "done";
              const isInProgress = topic.status === "in_progress";

              const strokeColor = isDone
                ? "#10b981"
                : isInProgress
                ? "#3b82f6"
                : "#71717a";

              return (
                <g key={topic._id} className="cursor-pointer" onClick={() => setSelectedTopic(topic)}>
                  {/* Connection Line */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={nodeX}
                    y2={nodeY}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 2.5 : 1.2}
                    strokeOpacity={isSelected ? 0.9 : 0.35}
                    strokeDasharray={isDone ? undefined : "4 3"}
                  />

                  {/* Pulsing ring if selected or in progress */}
                  {isSelected && (
                    <circle
                      cx={nodeX}
                      cy={nodeY}
                      r={28}
                      className="fill-none stroke-primary/40 stroke-2 animate-ping"
                    />
                  )}

                  {/* Main Topic Node */}
                  <circle
                    cx={nodeX}
                    cy={nodeY}
                    r={22}
                    className={`transition-all duration-200 ${
                      isSelected
                        ? "fill-primary text-primary-foreground stroke-background stroke-2"
                        : isDone
                        ? "fill-emerald-500/20 stroke-emerald-500 stroke-2"
                        : isInProgress
                        ? "fill-blue-500/20 stroke-blue-500 stroke-2"
                        : "fill-muted stroke-border stroke-1"
                    }`}
                  />

                  {/* Node Icon/Letter */}
                  <text
                    x={nodeX}
                    y={nodeY + 4}
                    textAnchor="middle"
                    className={`text-xs font-bold pointer-events-none ${
                      isSelected ? "fill-primary-foreground" : "fill-foreground"
                    }`}
                  >
                    {topic.name.substring(0, 2).toUpperCase()}
                  </text>

                  {/* Node Label */}
                  <text
                    x={nodeX}
                    y={nodeY + 34}
                    textAnchor="middle"
                    className={`text-[11px] font-medium pointer-events-none ${
                      isSelected ? "fill-primary font-bold" : "fill-muted-foreground"
                    }`}
                  >
                    {topic.name.length > 15 ? `${topic.name.substring(0, 14)}...` : topic.name}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Node Inspector Panel */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        {selectedTopic ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Badge variant={selectedTopic.status} className="capitalize text-xs">
                {selectedTopic.status.replace("_", " ")}
              </Badge>
              <h3 className="text-xl font-bold tracking-tight text-foreground pt-1">
                {selectedTopic.name}
              </h3>
              {selectedTopic.description ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedTopic.description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">No description provided</p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Mastery Progress</span>
                <span className="font-bold text-foreground">
                  {selectedTopic.progress || 0}%
                </span>
              </div>
              <Progress value={selectedTopic.progress || 0} className="h-2" />
              <p className="text-[11px] text-muted-foreground">
                {selectedTopic.doneTasks || 0} of {selectedTopic.totalTasks || 0} milestones completed
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Learning Pathway
              </span>
              <p className="text-muted-foreground text-[11px]">
                Active node connected to central knowledge core. Keep practicing active recall to reinforce retention.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
            Click on any node in the graph to inspect its mastery path.
          </div>
        )}

        {selectedTopic && (
          <Button asChild className="w-full gap-2 shadow-xs">
            <Link href={`/dashboard/topics/${selectedTopic._id}`}>
              Open Topic Workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
