"use client";

import * as React from "react";

interface ActivityItem {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityItem[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Group data into weeks (columns of 7 days)
  const weeks = React.useMemo(() => {
    const cols: ActivityItem[][] = [];
    let currentWeek: ActivityItem[] = [];

    data.forEach((item, index) => {
      currentWeek.push(item);
      if (currentWeek.length === 7 || index === data.length - 1) {
        cols.push(currentWeek);
        currentWeek = [];
      }
    });

    return cols;
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/60 dark:bg-muted/40";
    if (count === 1) return "bg-emerald-300 dark:bg-emerald-900";
    if (count <= 3) return "bg-emerald-400 dark:bg-emerald-700";
    if (count <= 5) return "bg-emerald-500 dark:bg-emerald-500";
    return "bg-emerald-600 dark:bg-emerald-400";
  };

  const totalCompletions = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Study Consistency Heatmap
          </h3>
          <p className="text-xs text-muted-foreground">
            {totalCompletions} learning milestones completed in the last 6 months
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-xs bg-muted/60" />
          <div className="h-2.5 w-2.5 rounded-xs bg-emerald-300 dark:bg-emerald-900" />
          <div className="h-2.5 w-2.5 rounded-xs bg-emerald-400 dark:bg-emerald-700" />
          <div className="h-2.5 w-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-500" />
          <div className="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 pt-1">
        <div className="flex gap-1 min-w-[580px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} milestones completed`}
                  className={`h-3 w-3 rounded-xs transition-all hover:ring-2 hover:ring-primary ${getColor(
                    day.count
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
