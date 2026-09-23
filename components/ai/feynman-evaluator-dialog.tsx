"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Loader2, Award, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface FeynmanEvaluatorDialogProps {
  topicName: string;
  defaultConcept?: string;
  triggerButton?: React.ReactNode;
}

export function FeynmanEvaluatorDialog({
  topicName,
  defaultConcept = "",
  triggerButton,
}: FeynmanEvaluatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [concept, setConcept] = useState(defaultConcept);
  const [explanation, setExplanation] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    verdict: string;
    strengths: string[];
    missingConcepts: string[];
    suggestions: string[];
  } | null>(null);

  const evaluateExplanation = useMutation(api.ai.evaluateFeynmanExplanation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || !explanation.trim()) {
      toast.error("Please provide both a concept title and your explanation.");
      return;
    }

    try {
      setIsEvaluating(true);
      const res = await evaluateExplanation({
        topicName,
        conceptPrompt: concept.trim(),
        userExplanation: explanation.trim(),
      });
      setResult(res);

      if (res.score >= 80) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        });
        toast.success(`High mastery score achieved: ${res.score}/100!`);
      } else {
        toast.info(`Evaluation complete: Score ${res.score}/100`);
      }
    } catch (err) {
      console.error("Failed to evaluate explanation:", err);
      toast.error("Failed to evaluate explanation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setExplanation("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton ? (
          triggerButton
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5 border-indigo-500/30 hover:border-indigo-500 text-xs">
            <Brain className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Feynman AI Grader</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            The Feynman Technique Evaluator
          </DialogTitle>
          <DialogDescription>
            Test your true conceptual mastery by explaining a topic in simple, jargon-free words as if teaching someone else.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Concept / Topic to Explain
              </label>
              <Input
                placeholder="e.g. React Server Components, Database Indexes, Docker Layers..."
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                disabled={isEvaluating}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Your Explanation (Teach the AI)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain the mental model, how it works under the hood, and a real-world analogy in your own words..."
                rows={7}
                disabled={isEvaluating}
                className="w-full rounded-xl border border-input bg-card p-3 text-xs font-sans leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-xs resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Tip: Avoid complex jargon. If you cannot explain it simply, you don&apos;t understand it well enough.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isEvaluating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isEvaluating || !concept.trim() || !explanation.trim()}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isEvaluating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Grade My Explanation
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            {/* Scorecard Header */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Conceptual Mastery Score
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-foreground">
                    {result.score}/100
                  </span>
                  <Badge
                    variant={result.score >= 80 ? "done" : result.score >= 60 ? "in_progress" : "not_started"}
                    className="capitalize text-xs font-semibold"
                  >
                    {result.verdict}
                  </Badge>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Award className="h-6 w-6" />
              </div>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs space-y-1.5">
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Key Strengths
                </div>
                <ul className="list-disc list-inside space-y-1 text-foreground/85">
                  {result.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Concepts */}
            {result.missingConcepts.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs space-y-1.5">
                <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Missing Key Elements to Deepen
                </div>
                <ul className="list-disc list-inside space-y-1 text-foreground/85">
                  {result.missingConcepts.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs space-y-1.5">
                <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4" /> Suggestions for Next Level
                </div>
                <ul className="list-disc list-inside space-y-1 text-foreground/85">
                  {result.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleReset} className="w-full">
                Try Another Explanation
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
