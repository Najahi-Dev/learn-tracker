import { query } from "./_generated/server";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export const getUserAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalCompletedTasks: 0,
        totalTopics: 0,
        xp: 0,
        level: 1,
        activityData: [],
        badges: [],
      };
    }

    const activityLogs = await ctx.db
      .query("activity_logs")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const topics = await ctx.db
      .query("topics")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const completedTasks = tasks.filter((t) => t.status === "done");
    const totalCompletedTasks = completedTasks.length;

    // Build Activity Map
    const activityMap = new Map<string, number>();
    for (const log of activityLogs) {
      activityMap.set(log.date, (activityMap.get(log.date) || 0) + log.count);
    }

    // Generate last 180 days array for heatmap
    const activityData: Array<{ date: string; count: number }> = [];
    const today = new Date();
    for (let i = 180; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      activityData.push({
        date: dateStr,
        count: activityMap.get(dateStr) || 0,
      });
    }

    // Calculate Streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayStr = formatDate(today);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    const hasToday = (activityMap.get(todayStr) || 0) > 0;
    const hasYesterday = (activityMap.get(yesterdayStr) || 0) > 0;

    if (hasToday || hasYesterday) {
      let checkDate = hasToday ? today : yesterday;
      while (true) {
        const dateStr = formatDate(checkDate);
        if ((activityMap.get(dateStr) || 0) > 0) {
          currentStreak++;
          const prev = new Date(checkDate);
          prev.setDate(checkDate.getDate() - 1);
          checkDate = prev;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    const sortedDates = Array.from(activityMap.keys()).sort();
    if (sortedDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Calculate XP and Level
    const xp = totalCompletedTasks * 25 + topics.length * 50;
    const level = Math.floor(xp / 100) + 1;

    // Badges definitions & unlocked criteria
    const badges = [
      {
        id: "first_milestone",
        title: "First Step",
        description: "Completed your first learning milestone",
        icon: "🌱",
        unlocked: totalCompletedTasks >= 1,
        progress: `${Math.min(totalCompletedTasks, 1)}/1`,
      },
      {
        id: "momentum_5",
        title: "Building Momentum",
        description: "Completed 5 learning milestones",
        icon: "⚡",
        unlocked: totalCompletedTasks >= 5,
        progress: `${Math.min(totalCompletedTasks, 5)}/5`,
      },
      {
        id: "streak_3",
        title: "Habit Builder",
        description: "Maintained a 3-day active study streak",
        icon: "🔥",
        unlocked: longestStreak >= 3,
        progress: `${Math.min(longestStreak, 3)}/3 days`,
      },
      {
        id: "streak_7",
        title: "Relentless Focus",
        description: "Maintained a 7-day study streak",
        icon: "👑",
        unlocked: longestStreak >= 7,
        progress: `${Math.min(longestStreak, 7)}/7 days`,
      },
      {
        id: "polymath_3",
        title: "Polymath",
        description: "Created 3 learning topics",
        icon: "📚",
        unlocked: topics.length >= 3,
        progress: `${Math.min(topics.length, 3)}/3`,
      },
      {
        id: "scholar_25",
        title: "Mastery Scholar",
        description: "Completed 25 milestones across topics",
        icon: "🏆",
        unlocked: totalCompletedTasks >= 25,
        progress: `${Math.min(totalCompletedTasks, 25)}/25`,
      },
    ];

    return {
      currentStreak,
      longestStreak,
      totalCompletedTasks,
      totalTopics: topics.length,
      xp,
      level,
      activityData,
      badges,
    };
  },
});
