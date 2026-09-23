"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReviewCard, type ReviewItem } from "@/components/reviews/review-card";
import { Brain, Loader2, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SpacedRepetitionPage() {
  const dueReviews = useQuery(api.reviews.getDueReviews) as ReviewItem[] | undefined;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Brain className="h-4 w-4" />
            <span>Spaced Repetition & Recall</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-0.5">
            Active Recall Reviews
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Strengthen long-term neural retention using the scientific SM-2 spaced repetition algorithm.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-2 text-right shadow-xs">
          <span className="text-xs text-muted-foreground">Due for Review</span>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {dueReviews?.length || 0} Cards
          </p>
        </div>
      </div>

      {/* Reviews Content */}
      {dueReviews === undefined ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading review cards...</p>
        </div>
      ) : dueReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">You&apos;re All Caught Up!</h3>
          <p className="text-xs text-muted-foreground max-w-md mt-1 mb-5">
            No concepts are due for review right now. Complete tasks in your topics, and they will automatically be scheduled for spaced retention!
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard">
              <Layers className="mr-1.5 h-4 w-4" /> Go to Topics
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dueReviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
