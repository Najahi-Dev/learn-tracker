import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen, Layers, Calendar, BrainCircuit } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandMenu } from "@/components/command-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* App Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-base font-bold">LearnTracker</span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-foreground transition-colors hover:text-primary"
              >
                <Layers className="h-4 w-4 text-muted-foreground" />
                Topics
              </Link>

              <Link
                href="/dashboard/planner"
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Calendar className="h-4 w-4" />
                Daily Planner
              </Link>

              <Link
                href="/dashboard/reviews"
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <BrainCircuit className="h-4 w-4" />
                Reviews
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <CommandMenu />
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
