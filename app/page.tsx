"use client";

import Link from "next/link";
import { useAuth, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  BookOpen,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">LearnTracker</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isLoaded && isSignedIn ? (
              <>
                <Button asChild size="sm">
                  <Link href="/dashboard">
                    Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <UserButton />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Get Started</Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto max-w-5xl px-4 py-20 text-center sm:py-28 sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Master topics faster with structured learning</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Track What You Learn.{" "}
            <span className="text-primary block mt-1">Master Every Skill.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            A minimalist, real-time learning workspace to break down subjects into
            focused topics, track bite-sized tasks, and build continuous retention.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {isLoaded && isSignedIn ? (
              <Button asChild size="lg" className="h-11 px-8 text-base shadow-md">
                <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <Button size="lg" className="h-11 px-8 text-base shadow-md cursor-pointer">
                    Start Tracking Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button size="lg" variant="outline" className="h-11 px-6 text-base cursor-pointer">
                    Sign In
                  </Button>
                </SignInButton>
              </>
            )}
          </div>

          {/* Quick Feature Grid */}
          <div className="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base mb-1">Topic-Based Organization</h3>
              <p className="text-sm text-muted-foreground">
                Group what you&apos;re learning into structured topics with real-time status and clear goals.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base mb-1">Micro-Task Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Break complex concepts into actionable checkable milestones and track completion effortlessly.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base mb-1">Real-Time Sync & Spaced Repetition</h3>
              <p className="text-sm text-muted-foreground">
                Instant sync across all your tabs and devices powered by Convex and Clerk.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} LearnTracker. Built with Next.js, Convex & Clerk.</p>
      </footer>
    </div>
  );
}
