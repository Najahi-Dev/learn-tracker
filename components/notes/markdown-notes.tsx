"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Link as LinkIcon,
  Plus,
  Trash2,
  Save,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import type { Id } from "@/convex/_generated/dataModel";

interface Resource {
  title: string;
  url: string;
}

interface MarkdownNotesProps {
  topicId: Id<"topics">;
  initialNotes?: string;
  initialResources?: Resource[];
}

export function MarkdownNotes({
  topicId,
  initialNotes = "",
  initialResources = [],
}: MarkdownNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);

  const updateNotes = useMutation(api.topics.updateTopicNotes);
  const addResource = useMutation(api.topics.addTopicResource);
  const deleteResource = useMutation(api.topics.deleteTopicResource);

  const handleSaveNotes = async () => {
    try {
      setIsSaving(true);
      await updateNotes({
        topicId,
        notes,
      });
      toast.success("Study notes saved!");
    } catch (err) {
      console.error("Failed to save notes:", err);
      toast.error("Failed to save notes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle.trim() || !resourceUrl.trim()) return;

    try {
      setIsAddingLink(true);
      await addResource({
        topicId,
        title: resourceTitle.trim(),
        url: resourceUrl.trim(),
      });
      setResourceTitle("");
      setResourceUrl("");
      toast.success("Resource bookmark added!");
    } catch (err) {
      console.error("Failed to add resource:", err);
      toast.error("Failed to add resource.");
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleDeleteResource = async (url: string) => {
    try {
      await deleteResource({
        topicId,
        url,
      });
      toast.success("Resource removed");
    } catch (err) {
      console.error("Failed to delete resource:", err);
      toast.error("Failed to delete resource");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Markdown Notes Editor */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Study Notes & Key Takeaways</h3>
          </div>
          <Button
            size="sm"
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="gap-1.5 h-8 text-xs"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Notes"}
          </Button>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`# Core Concepts\n- Write key insights here\n- Formulas, code snippets, or definitions\n\n\`\`\`ts\n// Code snippet\nconst learn = "active recall";\n\`\`\``}
          rows={14}
          className="w-full rounded-xl border border-input bg-card p-4 text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-xs resize-y"
        />
        <p className="text-[11px] text-muted-foreground">
          Tip: You can use Markdown formatting like # Headers, - Bullet lists, and ``` code blocks.
        </p>
      </div>

      {/* Resource Bookmarks */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Reference Links & Docs</h3>
        </div>

        <form onSubmit={handleAddResource} className="space-y-2 rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <Input
            placeholder="Title (e.g. Official Docs, Cheatsheet)"
            value={resourceTitle}
            onChange={(e) => setResourceTitle(e.target.value)}
            disabled={isAddingLink}
            className="h-8 text-xs"
          />
          <Input
            placeholder="URL (https://...)"
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
            disabled={isAddingLink}
            className="h-8 text-xs"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isAddingLink || !resourceTitle.trim() || !resourceUrl.trim()}
            className="w-full h-8 text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Resource
          </Button>
        </form>

        <div className="space-y-2">
          {initialResources.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-1">
              No reference links added yet.
            </p>
          ) : (
            initialResources.map((res) => (
              <div
                key={res.url}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-xs shadow-xs hover:border-primary/40 transition-colors"
              >
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 truncate text-foreground hover:text-primary font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{res.title}</span>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteResource(res.url)}
                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
