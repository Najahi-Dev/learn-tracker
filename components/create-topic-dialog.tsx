"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Loader2 } from "lucide-react";
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
import { Select2Dropdown } from "@/components/ui/select2-dropdown";

export function CreateTopicDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"not_started" | "in_progress" | "done">("not_started");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTopic = useMutation(api.topics.createTopic);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a topic name.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await createTopic({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      });
      setName("");
      setDescription("");
      setStatus("not_started");
      setOpen(false);
    } catch (err: unknown) {
      console.error("Failed to create topic:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to create topic. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>New Topic</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Learning Topic</DialogTitle>
            <DialogDescription>
              Add a new skill, subject, or technology you want to learn.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="topic-name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Topic Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="topic-name"
                placeholder="e.g. Next.js App Router, Rust Basics, Distributed Systems"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="topic-desc"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Description <span className="text-xs text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="topic-desc"
                placeholder="e.g. Core concepts, Server Components, and mutations"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Initial Status
              </label>
              <Select2Dropdown
                options={[
                  {
                    value: "not_started",
                    label: "Not Started",
                    icon: <div className="h-2 w-2 rounded-full bg-zinc-400" />,
                  },
                  {
                    value: "in_progress",
                    label: "In Progress",
                    icon: <div className="h-2 w-2 rounded-full bg-blue-500" />,
                  },
                  {
                    value: "done",
                    label: "Mastered",
                    icon: <div className="h-2 w-2 rounded-full bg-emerald-500" />,
                  },
                ]}
                value={status}
                onChange={(val) => setStatus(val as "not_started" | "in_progress" | "done")}
                isSearchable={false}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Topic
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
