"use client";

import { Flame, Zap, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: number;
}

export function StreakBadge({
  currentStreak,
  longestStreak,
  xp,
  level,
}: StreakBadgeProps) {
  const currentLevelXp = (level - 1) * 100;
  const nextLevelXp = level * 100;
  const progressInLevel = Math.min(
    100,
    Math.max(0, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 shadow-xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Flame className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">{currentStreak}</span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              day{currentStreak === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Active Study Streak</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 shadow-xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">{longestStreak}</span>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              day{longestStreak === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Longest Streak Record</p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-foreground">Level {level} Scholar</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            {xp} XP
          </span>
        </div>
        <div className="space-y-1 mt-2">
          <Progress value={progressInLevel} className="h-1.5" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Level {level}</span>
            <span>{nextLevelXp - xp} XP to Level {level + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
