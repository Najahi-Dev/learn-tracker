"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTheme } from "@/components/providers/theme-provider";
import {
  Layers,
  Calendar,
  BrainCircuit,
  Sun,
  Moon,
  Laptop,
  Search,
  BookOpen,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const topics = useQuery(api.topics.getTopics);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground transition-all hover:bg-accent/60 hover:text-foreground cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          <span>Quick search...</span>
        </div>
        <kbd className="pointer-events-none rounded border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-2xs">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-[550px]">
          <Command className="flex flex-col overflow-hidden bg-background text-foreground">
            <div className="flex items-center border-b border-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                placeholder="Search topics, pages, or commands..."
                className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <Command.List className="max-h-[320px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No matching results found.
              </Command.Empty>

              <Command.Group heading="Navigation" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard"))}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Topics Overview</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard/planner"))}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <span>Daily Planner & Focus Queue</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => runCommand(() => router.push("/dashboard/reviews"))}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <BrainCircuit className="h-4 w-4 text-indigo-500" />
                  <span>Spaced Repetition Reviews</span>
                </Command.Item>
              </Command.Group>

              {topics && topics.length > 0 && (
                <Command.Group heading="Your Topics" className="text-xs font-medium text-muted-foreground px-2 py-1.5 mt-2">
                  {topics.map((topic: { _id: string; name: string }) => (
                    <Command.Item
                      key={topic._id}
                      onSelect={() =>
                        runCommand(() => router.push(`/dashboard/topics/${topic._id}`))
                      }
                      className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="truncate">{topic.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Theme" className="text-xs font-medium text-muted-foreground px-2 py-1.5 mt-2">
                <Command.Item
                  onSelect={() => runCommand(() => setTheme("light"))}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => setTheme("dark"))}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => setTheme("system"))}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Laptop className="h-4 w-4" />
                  <span>System Theme</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
