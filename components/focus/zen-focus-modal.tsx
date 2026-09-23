"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Maximize2,
  CloudRain,
  Waves,
  Flame,
  Coffee,
  Timer as TimerIcon,
  Volume2,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { useFocus, FocusMode, AmbientSound } from "@/components/providers/focus-provider";

export function ZenFocusModal() {
  const {
    mode,
    timeLeft,
    isRunning,
    ambientSound,
    scratchpad,
    isModalOpen,
    setIsModalOpen,
    setMode,
    toggleTimer,
    resetTimer,
    setAmbientSound,
    setScratchpad,
    formatTime,
    playChime,
  } = useFocus();

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 border-primary/40 bg-card hover:bg-primary/10 transition-colors shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Zen Focus Studio</span>
          {isRunning && (
            <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono font-bold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              {formatTime(timeLeft)}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] border-border/80 bg-background/95 backdrop-blur-md p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-4 w-4 text-primary" />
              Zen Focus Studio
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Timer Column */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center space-y-4 shadow-xs">
            {/* Mode Pills */}
            <div className="flex rounded-lg border border-border bg-muted/40 p-1">
              <button
                onClick={() => resetTimer("pomodoro")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  mode === "pomodoro"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                25m Focus
              </button>
              <button
                onClick={() => resetTimer("break")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  mode === "break"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                5m Break
              </button>
              <button
                onClick={() => resetTimer("stopwatch")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  mode === "stopwatch"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Stopwatch
              </button>
            </div>

            {/* Display */}
            <div className="text-5xl font-extrabold font-mono tracking-tighter text-foreground py-2">
              {formatTime(timeLeft)}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="lg"
                onClick={toggleTimer}
                className="gap-2 px-6 h-10 shadow-sm cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Start Focus
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => resetTimer(mode)}
                className="h-10 w-10 cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Ambient Sound Selector */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/40 w-full justify-center">
              <span className="text-[11px] text-muted-foreground">Ambient sound:</span>
              <button
                onClick={() => setAmbientSound(ambientSound === "rain" ? "none" : "rain")}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  ambientSound === "rain"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <CloudRain className="h-3.5 w-3.5" />
                <span>Rain</span>
              </button>
              <button
                onClick={() => setAmbientSound(ambientSound === "waves" ? "none" : "waves")}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  ambientSound === "waves"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Waves className="h-3.5 w-3.5" />
                <span>Waves</span>
              </button>

              <button
                onClick={() => {
                  playChime("focus");
                  toast.success("Playing completion chime preview!");
                }}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-muted/50 ml-1"
                title="Preview completion bell"
              >
                <Bell className="h-3 w-3" />
                <span>Test Bell</span>
              </button>
            </div>
          </div>

          {/* Focus Scratchpad Column */}
          <div className="flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Quick Focus Scratchpad
              </label>
              <p className="text-[11px] text-muted-foreground">
                Jot transient thoughts or questions during deep focus.
              </p>
            </div>
            <textarea
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
              placeholder="What are you actively working on or debugging right now?"
              rows={8}
              className="w-full flex-1 rounded-xl border border-input bg-card p-3 text-xs font-mono leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-xs resize-none"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!scratchpad.trim()) return;
                navigator.clipboard.writeText(scratchpad);
                toast.success("Scratchpad copied to clipboard!");
              }}
              className="text-xs h-8 w-full cursor-pointer"
            >
              Copy Notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
