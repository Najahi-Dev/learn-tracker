"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

export function ZenFocusModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"pomodoro" | "break" | "stopwatch">("pomodoro");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientSound, setAmbientSound] = useState<"none" | "rain" | "waves">("none");
  const [scratchpad, setScratchpad] = useState("");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Timer Tick
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (mode === "stopwatch") {
            return prev + 1;
          }
          if (prev <= 1) {
            setIsRunning(false);
            toast.success(
              mode === "pomodoro"
                ? "Pomodoro Focus session complete! Time for a short break."
                : "Break time over! Ready for the next deep focus block?"
            );
            return mode === "pomodoro" ? 5 * 60 : 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, mode]);

  // Ambient Sound Synth via Web Audio API (Rain / Waves)
  useEffect(() => {
    if (ambientSound === "none") {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate Pink/Brown Noise for rain and wave sensations
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = ambientSound === "rain" ? 0.2 : 0.3;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = ambientSound === "rain" ? 1000 : 400;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(0);
      noiseNodeRef.current = noise;
    } catch {
      // Audio context may be restricted before user gesture
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [ambientSound]);

  const handleModeChange = (newMode: "pomodoro" | "break" | "stopwatch") => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === "pomodoro") setTimeLeft(25 * 60);
    else if (newMode === "break") setTimeLeft(5 * 60);
    else setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-primary/40 hover:bg-primary/10">
          <Maximize2 className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Zen Focus Studio</span>
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
                onClick={() => handleModeChange("pomodoro")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  mode === "pomodoro"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                25m Focus
              </button>
              <button
                onClick={() => handleModeChange("break")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  mode === "break"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                5m Break
              </button>
              <button
                onClick={() => handleModeChange("stopwatch")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
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
                onClick={() => setIsRunning(!isRunning)}
                className="gap-2 px-6 h-10 shadow-sm"
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
                onClick={() => handleModeChange(mode)}
                className="h-10 w-10"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Ambient Sound Selector */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/40 w-full justify-center">
              <span className="text-[11px] text-muted-foreground">Ambient sound:</span>
              <button
                onClick={() => setAmbientSound(ambientSound === "rain" ? "none" : "rain")}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  ambientSound === "rain"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                🌧️ Rain
              </button>
              <button
                onClick={() => setAmbientSound(ambientSound === "waves" ? "none" : "waves")}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  ambientSound === "waves"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                🌊 Waves
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
              className="text-xs h-8 w-full"
            >
              Copy Notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
