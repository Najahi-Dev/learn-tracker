"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TopicCard, type TopicItem } from "@/components/topic-card";
import { CreateTopicDialog } from "@/components/create-topic-dialog";
import { AiRoadmapDialog } from "@/components/ai/ai-roadmap-dialog";
import { PdfUploadDialog } from "@/components/ai/pdf-upload-dialog";
import { StreakBadge } from "@/components/analytics/streak-badge";
import { ActivityHeatmap } from "@/components/analytics/activity-heatmap";
import { AchievementBadges } from "@/components/analytics/achievement-badges";
import { ViewSwitcher } from "@/components/views/view-switcher";
import {
  BookOpen,
  Search,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const topics = useQuery(api.topics.getTopics) as TopicItem[] | undefined;
  const analytics = useQuery(api.analytics.getUserAnalytics);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTopics = useMemo(() => {
    if (!topics) return [];
    return topics.filter((t: TopicItem) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [topics, searchQuery, statusFilter]);

  return (
    <div className="space-y-8 w-full">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            My Learning Topics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize skills, track milestones, and build lasting retention.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <ViewSwitcher />
          <PdfUploadDialog />
          <AiRoadmapDialog />
          <CreateTopicDialog />
        </div>
      </div>

      {/* Streaks & Level XP Widget */}
      {analytics && (
        <StreakBadge
          currentStreak={analytics.currentStreak}
          longestStreak={analytics.longestStreak}
          xp={analytics.xp}
          level={analytics.level}
        />
      )}

      {/* Activity Heatmap */}
      {analytics && analytics.activityData && (
        <ActivityHeatmap data={analytics.activityData} />
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "in_progress", "not_started", "done"] as const).map((filter) => {
            const labels = {
              all: "All",
              in_progress: "In Progress",
              not_started: "Not Started",
              done: "Done",
            };
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topics Content Area */}
      {topics === undefined ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading your topics...</p>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">
            {searchQuery || statusFilter !== "all"
              ? "No topics match your filter"
              : "No learning topics yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search query or clear the filter to see all topics."
              : "Create your first learning topic or use AI Roadmap to generate a structured curriculum."}
          </p>
          {searchQuery || statusFilter !== "all" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-xs text-primary font-medium hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <AiRoadmapDialog />
              <CreateTopicDialog />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTopics.map((topic) => (
            <TopicCard key={topic._id} topic={topic} />
          ))}
        </div>
      )}

      {/* Achievement Badges Section */}
      {analytics && analytics.badges && analytics.badges.length > 0 && (
        <div className="pt-4">
          <AchievementBadges badges={analytics.badges} />
        </div>
      )}
    </div>
  );
}
