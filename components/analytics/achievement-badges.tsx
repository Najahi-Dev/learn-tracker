"use client";

import { Award, Lock, CheckCircle2, Sprout, Zap, Flame, Crown, BookOpen, Trophy } from "lucide-react";

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: string;
}

interface AchievementBadgesProps {
  badges: BadgeItem[];
}

export function AchievementBadges({ badges }: AchievementBadgesProps) {
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "sprout":
        return <Sprout className="h-6 w-6 text-emerald-500" />;
      case "zap":
        return <Zap className="h-6 w-6 text-amber-500" />;
      case "flame":
        return <Flame className="h-6 w-6 text-orange-500" />;
      case "crown":
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case "book-open":
        return <BookOpen className="h-6 w-6 text-blue-500" />;
      case "trophy":
        return <Trophy className="h-6 w-6 text-purple-500" />;
      default:
        return <Award className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">Scholar Badges & Mastery Proof</h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {unlockedCount} of {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`flex flex-col items-center justify-between rounded-xl border p-3 text-center transition-all ${
              badge.unlocked
                ? "border-amber-500/30 bg-amber-500/5 shadow-2xs hover:border-amber-500/60"
                : "border-border/60 bg-muted/20 opacity-50 grayscale"
            }`}
          >
            <div className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border/60 shadow-2xs">
              {renderBadgeIcon(badge.icon)}
              {badge.unlocked ? (
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
              ) : (
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/60 text-background">
                  <Lock className="h-2.5 w-2.5" />
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground line-clamp-1">{badge.title}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                {badge.description}
              </p>
            </div>

            <div className="mt-2 text-[10px] font-semibold text-muted-foreground">
              {badge.progress}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
