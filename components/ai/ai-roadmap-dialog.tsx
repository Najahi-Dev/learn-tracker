"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface RoadmapPreset {
  topic: string;
  description: string;
  tasks: string[];
}

const PRESETS: Record<string, RoadmapPreset> = {
  "Docker & Containers": {
    topic: "Docker & Containers Mastery",
    description: "Container fundamentals, multi-stage builds, and Compose orchestration.",
    tasks: [
      "Understand container architecture vs VMs",
      "Write a multi-stage Dockerfile with caching optimization",
      "Manage persistent storage with Docker Volumes and Bind Mounts",
      "Set up multi-container environment using Docker Compose",
      "Implement healthchecks and environment secrets",
      "Push images to registry and optimize layer sizes",
    ],
  },
  "System Design": {
    topic: "System Design & Scalability",
    description: "Architecting high-throughput distributed systems.",
    tasks: [
      "Master horizontal scaling, load balancers (L4 vs L7), and DNS routing",
      "Implement database sharding, replication, and CAP Theorem trade-offs",
      "Design caching strategies with Redis (Write-Through vs Cache-Aside)",
      "Implement asynchronous messaging with Message Queues (Kafka / RabbitMQ)",
      "Design API Rate Limiters with Token Bucket algorithm",
      "Architect end-to-end resilient distributed microservices",
    ],
  },
  "TypeScript Pro": {
    topic: "Advanced TypeScript Patterns",
    description: "Generics, conditional types, template literals, and type narrowing.",
    tasks: [
      "Master Generics and Generic Constraints (extends keyof)",
      "Implement Conditional Types and type inference with infer",
      "Build dynamic schema validation with Template Literal Types",
      "Create complex Mapped Types and utility helpers",
      "Handle Discriminated Unions and Custom Type Guards",
      "Enforce strict nominal typing and branding patterns",
    ],
  },
};

export function AiRoadmapDialog() {
  const [open, setOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [isGenerating, setIsGenerating] = useState(false);

  const createAiRoadmap = useMutation(api.ai.createAiRoadmap);

  const handleGenerate = async (presetKey?: string) => {
    const topicToUse = presetKey ? PRESETS[presetKey].topic : skillInput.trim();
    if (!topicToUse) {
      toast.error("Please enter a skill or topic.");
      return;
    }

    try {
      setIsGenerating(true);

      let tasksToInsert: Array<{ title: string; priority: "low" | "medium" | "high" }> = [];
      let description = `Curriculum covering core foundations, best practices, and practical application.`;

      if (presetKey && PRESETS[presetKey]) {
        description = PRESETS[presetKey].description;
        tasksToInsert = PRESETS[presetKey].tasks.map((t, idx) => ({
          title: t,
          priority: idx < 2 ? "high" : idx < 4 ? "medium" : "low",
        }));
      } else {
        // Generate structured milestone roadmap based on input & difficulty
        tasksToInsert = [
          { title: `Core fundamentals & mental model for ${topicToUse}`, priority: "high" },
          { title: `Set up local sandbox & explore basic syntax/primitives`, priority: "high" },
          { title: `Deep dive: Essential APIs and standard patterns (${difficulty})`, priority: "medium" },
          { title: `Hands-on mini project implementing real-world use case`, priority: "medium" },
          { title: `Performance optimization, debugging & edge cases`, priority: "low" },
          { title: `Mastery review & self-assessment test`, priority: "low" },
        ];
      }

      await createAiRoadmap({
        topicName: topicToUse,
        description,
        difficulty,
        tasks: tasksToInsert,
      });

      toast.success(`Generated roadmap for "${topicToUse}" with ${tasksToInsert.length} milestones!`);
      setSkillInput("");
      setOpen(false);
    } catch (err) {
      console.error("Failed to generate AI roadmap:", err);
      toast.error("Failed to generate roadmap.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/30 hover:border-primary shadow-xs">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI Study Roadmap</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Learning Roadmap Generator
          </DialogTitle>
          <DialogDescription>
            Enter any skill or technology to automatically generate a structured milestone curriculum.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              What do you want to learn?
            </label>
            <Input
              placeholder="e.g. Next.js Performance, Golang Concurrency, Rust..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Target Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`rounded-lg border py-2 text-xs font-medium capitalize transition-all cursor-pointer ${
                    difficulty === lvl
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/40">
            <label className="text-xs font-medium text-muted-foreground">
              Or pick an instant curated curriculum:
            </label>
            <div className="space-y-1.5">
              {Object.keys(PRESETS).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleGenerate(key)}
                  disabled={isGenerating}
                  className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-2.5 text-left text-xs transition-colors hover:bg-accent hover:border-primary/40 cursor-pointer"
                >
                  <span className="font-semibold text-foreground">{key}</span>
                  <span className="text-[11px] text-primary flex items-center gap-1">
                    6 milestones <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isGenerating || !skillInput.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Roadmap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
