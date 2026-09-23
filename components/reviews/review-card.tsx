"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Brain, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";

import type { Id } from "@/convex/_generated/dataModel";

export interface ReviewItem {
  _id: Id<"reviews">;
  taskId: Id<"tasks">;
  topicName: string;
  taskTitle: string;
  intervalDays: number;
  easeFactor: number;
  repetitions?: number;
  nextReviewDate: number;
}

interface ReviewCardProps {
  review: ReviewItem;
  onReviewed?: () => void;
}

export function ReviewCard({ review, onReviewed }: ReviewCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitReview = useMutation(api.reviews.submitReview);

  const handleRating = async (rating: "again" | "hard" | "good" | "easy") => {
    try {
      setIsSubmitting(true);
      const res = await submitReview({
        reviewId: review._id,
        rating,
      });
      const days = res?.intervalDays || 1;
      toast.success(`Review recorded! Next review in ${days} day${days === 1 ? "" : "s"}.`);
      setIsFlipped(false);
      onReviewed?.();
    } catch (err: unknown) {
      console.error("Failed to submit review:", err);
      toast.error("Failed to record review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="flex flex-col justify-between border-border bg-card shadow-sm transition-all hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs font-normal">
            {review.topicName}
          </Badge>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Interval: {review.intervalDays}d</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 py-6 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-1">
          <Brain className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Concept / Milestone
          </p>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {review.taskTitle}
          </h3>
        </div>

        {isFlipped ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-foreground/90 animate-in fade-in zoom-in-95">
            <p className="font-medium text-emerald-600 dark:text-emerald-400 mb-1">
              Active Recall Prompt
            </p>
            <p className="text-muted-foreground">
              Recall the core principles, syntax, or implementation details of this concept. How well did you remember it?
            </p>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFlipped(true)}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Show Recall Answer
          </Button>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-2 pb-5 border-t border-border/40">
        {isFlipped ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleRating("again")}
              className="text-xs border-red-500/30 hover:bg-red-500/10 hover:text-red-600"
            >
              🔄 Again (1d)
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleRating("hard")}
              className="text-xs border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600"
            >
              ⚡ Hard ({Math.max(1, Math.round(review.intervalDays * 1.2))}d)
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleRating("good")}
              className="text-xs border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600"
            >
              👍 Good ({Math.round(review.intervalDays * review.easeFactor)}d)
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleRating("easy")}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              🎯 Easy ({Math.round(review.intervalDays * review.easeFactor * 1.3)}d)
            </Button>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Click &quot;Show Recall Answer&quot; to test your memory and rate difficulty.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
