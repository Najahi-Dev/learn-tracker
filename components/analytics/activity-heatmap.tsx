"use client";

import * as React from "react";
import { Sparkles, Calendar, Flame, CheckCircle2, TrendingUp } from "lucide-react";

interface ActivityItem {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityItem[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const [range, setRange] = React.useState<"year" | "6months" | "3months">("year");
  const [hoveredDay, setHoveredDay] = React.useState<ActivityItem | null>(null);
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter based on selected timeframe
  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    if (range === "3months") return data.slice(-91);
    if (range === "6months") return data.slice(-182);
    return data;
  }, [data, range]);

  // Group into columns of 7 days (Sunday = 0 to Saturday = 6)
  const { weeks, monthLabels } = React.useMemo(() => {
    if (filteredData.length === 0) return { weeks: [], monthLabels: [] };

    // Align start so that Sunday is at index 0 of first week
    const firstDate = new Date(filteredData[0].date);
    const startDayOfWeek = firstDate.getDay(); // 0 = Sun, 6 = Sat

    const paddedList: Array<ActivityItem | null> = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      paddedList.push(null);
    }
    filteredData.forEach((d) => paddedList.push(d));

    const cols: Array<Array<ActivityItem | null>> = [];
    let currentWeek: Array<ActivityItem | null> = [];

    paddedList.forEach((item, index) => {
      currentWeek.push(item);
      if (currentWeek.length === 7 || index === paddedList.length - 1) {
        // Pad the end if needed
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        cols.push(currentWeek);
        currentWeek = [];
      }
    });

    // Compute month label positions
    const months: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;

    cols.forEach((col, wIdx) => {
      const validDay = col.find((d) => d !== null);
      if (validDay) {
        const d = new Date(validDay.date);
        const month = d.getMonth();
        if (month !== lastMonth) {
          months.push({
            label: d.toLocaleString("default", { month: "short" }),
            weekIndex: wIdx,
          });
          lastMonth = month;
        }
      }
    });

    return { weeks: cols, monthLabels: months };
  }, [filteredData]);

  // Key stats
  const stats = React.useMemo(() => {
    const totalCompletions = filteredData.reduce((acc, curr) => acc + curr.count, 0);
    const activeDays = filteredData.filter((d) => d.count > 0).length;
    const maxCount = filteredData.reduce((max, curr) => Math.max(max, curr.count), 0);
    const consistencyRate = filteredData.length > 0 
      ? Math.round((activeDays / filteredData.length) * 100) 
      : 0;

    return {
      totalCompletions,
      activeDays,
      maxCount,
      consistencyRate,
    };
  }, [filteredData]);

  const getColor = (count: number | null) => {
    if (count === null) return "opacity-0 pointer-events-none";
    if (count === 0) return "bg-muted/70 hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted/60";
    if (count === 1) return "bg-emerald-300 dark:bg-emerald-900/90 hover:brightness-110";
    if (count <= 3) return "bg-emerald-400 dark:bg-emerald-700 hover:brightness-110";
    if (count <= 5) return "bg-emerald-500 dark:bg-emerald-500 hover:brightness-110";
    return "bg-emerald-600 dark:bg-emerald-400 hover:brightness-110 shadow-xs";
  };

  const formatFullDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Study Consistency Heatmap
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3 w-3" />
              Real-time Sync
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualize your daily study momentum, task completions, and spaced reviews.
          </p>
        </div>

        {/* Timeframe selector & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-border/70 bg-muted/30 p-0.5 text-xs font-medium">
            <button
              onClick={() => setRange("3months")}
              className={`rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                range === "3months"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => setRange("6months")}
              className={`rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                range === "6months"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setRange("year")}
              className={`rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                range === "year"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              1 Year
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-2 border-l border-border/60">
            <span>Less</span>
            <div className="h-2.5 w-2.5 rounded-xs bg-muted/60" />
            <div className="h-2.5 w-2.5 rounded-xs bg-emerald-300 dark:bg-emerald-900" />
            <div className="h-2.5 w-2.5 rounded-xs bg-emerald-400 dark:bg-emerald-700" />
            <div className="h-2.5 w-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-500" />
            <div className="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Completed</p>
            <p className="text-sm font-bold text-foreground">
              {stats.totalCompletions} <span className="text-[11px] font-normal text-muted-foreground">milestones</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active Days</p>
            <p className="text-sm font-bold text-foreground">
              {stats.activeDays} <span className="text-[11px] font-normal text-muted-foreground">days</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Consistency</p>
            <p className="text-sm font-bold text-foreground">
              {stats.consistencyRate}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Daily Peak</p>
            <p className="text-sm font-bold text-foreground">
              {stats.maxCount} <span className="text-[11px] font-normal text-muted-foreground">tasks/day</span>
            </p>
          </div>
        </div>
      </div>

      {/* The Heatmap Grid */}
      <div className="relative overflow-x-auto rounded-lg border border-border/50 bg-background/50 p-4">
        <div className="min-w-fit">
          {/* Month Labels Row */}
          <div className="flex pb-2 text-[10px] font-medium text-muted-foreground pl-7 select-none">
            {monthLabels.map((m, idx) => (
              <div
                key={idx}
                style={{
                  // approx 14px cell width + 3px gap = 17px per week
                  width: `${(monthLabels[idx + 1] ? monthLabels[idx + 1].weekIndex - m.weekIndex : weeks.length - m.weekIndex) * 17}px`,
                }}
                className="truncate"
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid with Day-of-Week labels */}
          <div className="flex gap-2">
            {/* Day of Week Labels (Sun, Mon, Tue, Wed, Thu, Fri, Sat) */}
            <div className="flex flex-col justify-between text-[9px] font-medium text-muted-foreground py-0.5 h-[116px] select-none">
              <span></span>
              <span>Mon</span>
              <span></span>
              <span>Wed</span>
              <span></span>
              <span>Fri</span>
              <span></span>
            </div>

            {/* Week Columns */}
            <div className="flex gap-[3px] flex-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      onMouseEnter={(e) => {
                        if (day) {
                          setHoveredDay(day);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMousePos({ x: rect.left + rect.width / 2, y: rect.top });
                        }
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-[13.5px] w-[13.5px] rounded-[3px] transition-all duration-150 cursor-pointer ${
                        day ? getColor(day.count) : "opacity-0 pointer-events-none"
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Custom Tooltip */}
        {hoveredDay && (
          <div
            className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-full pb-2 animate-in fade-in zoom-in-95 duration-100"
            style={{ left: mousePos.x, top: mousePos.y }}
          >
            <div className="rounded-md border border-border/80 bg-popover/95 px-3 py-1.5 text-xs text-popover-foreground shadow-lg backdrop-blur-md">
              <p className="font-semibold">{formatFullDate(hoveredDay.date)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {hoveredDay.count === 0 ? (
                  "No activity recorded"
                ) : (
                  <span className="text-emerald-500 font-medium">
                    {hoveredDay.count} milestone{hoveredDay.count > 1 ? "s" : ""} completed
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
