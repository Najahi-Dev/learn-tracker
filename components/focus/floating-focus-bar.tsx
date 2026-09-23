"use client";

import React from "react";
import { useFocus } from "@/components/providers/focus-provider";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  CloudRain,
  Waves,
  Sparkles,
  Flame,
  Coffee,
  Timer as TimerIcon,
} from "lucide-react";

export function FloatingFocusBar() {
  const {
    mode,
    timeLeft,
    isRunning,
    ambientSound,
    isModalOpen,
    setIsModalOpen,
    toggleTimer,
    resetTimer,
    formatTime,
  } = useFocus();

  // Show floating bar if timer is running OR if it has been started/paused midway, AND modal is currently closed
  const isPomodoroStarted = mode === "pomodoro" && timeLeft < 25 * 60;
  const isBreakStarted = mode === "break" && timeLeft < 5 * 60;
  const isStopwatchStarted = mode === "stopwatch" && timeLeft > 0;
  const shouldShow =
    !isModalOpen && (isRunning || isPomodoroStarted || isBreakStarted || isStopwatchStarted);

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 right-3 left-3 sm:left-auto sm:right-5 sm:bottom-5 z-50 flex justify-center sm:block animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-between sm:justify-start gap-3 rounded-2xl border border-border/80 bg-background/95 p-2.5 pl-4 shadow-2xl backdrop-blur-md transition-all hover:border-primary/50 max-w-full">
        {/* Mode & Pulse Indicator */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
          title="Click to open Zen Focus Studio"
        >
          <span className="relative flex h-3 w-3">
            {isRunning && (
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  mode === "pomodoro"
                    ? "bg-primary"
                    : mode === "break"
                    ? "bg-amber-500"
                    : "bg-blue-500"
                }`}
              />
            )}
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                mode === "pomodoro"
                  ? "bg-primary"
                  : mode === "break"
                  ? "bg-amber-500"
                  : "bg-blue-500"
              }`}
            />
          </span>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {mode === "pomodoro" && (
                <>
                  <Flame className="h-3 w-3 text-primary" />
                  <span>Deep Focus</span>
                </>
              )}
              {mode === "break" && (
                <>
                  <Coffee className="h-3 w-3 text-amber-500" />
                  <span>Break</span>
                </>
              )}
              {mode === "stopwatch" && (
                <>
                  <TimerIcon className="h-3 w-3 text-blue-500" />
                  <span>Stopwatch</span>
                </>
              )}
              {ambientSound === "rain" && (
                <CloudRain className="h-3 w-3 text-primary animate-pulse ml-1" />
              )}
              {ambientSound === "waves" && (
                <Waves className="h-3 w-3 text-primary animate-pulse ml-1" />
              )}
            </div>
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-border/60 mx-1" />

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant={isRunning ? "secondary" : "default"}
            onClick={toggleTimer}
            className="h-8 w-8 rounded-lg shadow-xs cursor-pointer"
            title={isRunning ? "Pause timer" : "Resume timer"}
          >
            {isRunning ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => resetTimer(mode)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="h-8 w-8 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
            title="Expand Zen Focus Studio"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
