"use client";

import * as React from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export type FocusMode = "pomodoro" | "break" | "stopwatch";
export type AmbientSound = "none" | "rain" | "waves";

// Web Audio API Melody Synthesizer for Session Completion Chimes
export function playCompletionChime(type: "focus" | "break" = "focus") {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === "focus") {
      // 4-tone Zen Celebration Melody: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
      const notes = [
        { freq: 523.25, time: 0.0, duration: 1.0, gain: 0.4 },
        { freq: 659.25, time: 0.16, duration: 1.2, gain: 0.4 },
        { freq: 783.99, time: 0.32, duration: 1.4, gain: 0.45 },
        { freq: 1046.5, time: 0.48, duration: 2.5, gain: 0.5 },
      ];

      notes.forEach(({ freq, time, duration, gain: targetGain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + time);

        gainNode.gain.setValueAtTime(0.0001, now + time);
        gainNode.gain.linearRampToValueAtTime(targetGain, now + time + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration + 0.1);
      });
    } else {
      // 2-tone Break Completion Chime: A5 (880Hz) -> D6 (1174Hz)
      const notes = [
        { freq: 880.0, time: 0.0, duration: 1.0, gain: 0.35 },
        { freq: 1174.66, time: 0.2, duration: 2.2, gain: 0.4 },
      ];

      notes.forEach(({ freq, time, duration, gain: targetGain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + time);

        gainNode.gain.setValueAtTime(0.0001, now + time);
        gainNode.gain.linearRampToValueAtTime(targetGain, now + time + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration + 0.1);
      });
    }
  } catch (err) {
    console.warn("Audio chime failed to play:", err);
  }
}

interface FocusContextType {
  mode: FocusMode;
  timeLeft: number;
  isRunning: boolean;
  ambientSound: AmbientSound;
  scratchpad: string;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  setMode: (mode: FocusMode) => void;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  setIsRunning: (running: boolean) => void;
  toggleTimer: () => void;
  resetTimer: (newMode?: FocusMode) => void;
  setAmbientSound: (sound: AmbientSound) => void;
  setScratchpad: (text: string) => void;
  formatTime: (seconds: number) => string;
  playChime: (type?: "focus" | "break") => void;
}

const FocusContext = React.createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<FocusMode>("pomodoro");
  const [timeLeft, setTimeLeft] = React.useState(25 * 60);
  const [isRunning, setIsRunning] = React.useState(false);
  const [ambientSound, setAmbientSound] = React.useState<AmbientSound>("none");
  const [scratchpad, setScratchpad] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const audioCtxRef = React.useRef<AudioContext | null>(null);

  // Timer Interval Ticking (Global)
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (mode === "stopwatch") {
            return prev + 1;
          }
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === "pomodoro") {
              playCompletionChime("focus");
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.7 },
              });
              toast.success("Pomodoro Focus block complete! Take a well-earned break.");
              return 5 * 60;
            } else {
              playCompletionChime("break");
              toast.info("Break finished! Ready for the next deep focus session?");
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, mode]);

  // Ambient Audio Synthesizer (Rain / Waves via Web Audio API)
  React.useEffect(() => {
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
    } catch {
      // Audio context restricted until user interaction
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [ambientSound]);

  const toggleTimer = React.useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = React.useCallback((targetMode?: FocusMode) => {
    const nextMode = targetMode || mode;
    setMode(nextMode);
    setIsRunning(false);
    if (nextMode === "pomodoro") setTimeLeft(25 * 60);
    else if (nextMode === "break") setTimeLeft(5 * 60);
    else setTimeLeft(0);
  }, [mode]);

  const formatTime = React.useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  return (
    <FocusContext.Provider
      value={{
        mode,
        timeLeft,
        isRunning,
        ambientSound,
        scratchpad,
        isModalOpen,
        setIsModalOpen,
        setMode,
        setTimeLeft,
        setIsRunning,
        toggleTimer,
        resetTimer,
        setAmbientSound,
        setScratchpad,
        formatTime,
        playChime: playCompletionChime,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = React.useContext(FocusContext);
  if (!context) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
}
