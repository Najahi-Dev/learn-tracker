"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
  BookOpen,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";
import { RichTextEditor } from "@/components/notes/rich-text-editor";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const notes = useQuery(api.notes.getNotesByTopic, { topicId });
  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);

  const addResource = useMutation(api.topics.addTopicResource);
  const deleteResource = useMutation(api.topics.deleteTopicResource);

  const [activeNoteId, setActiveNoteId] = React.useState<Id<"topic_notes"> | null>(null);
  const [noteSearch, setNoteSearch] = React.useState("");
  const [isCreatingNote, setIsCreatingNote] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Active note title local state
  const [activeTitle, setActiveTitle] = React.useState("");

  // Resource state
  const [resourceTitle, setResourceTitle] = React.useState("");
  const [resourceUrl, setResourceUrl] = React.useState("");
  const [isAddingLink, setIsAddingLink] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);

  // Auto-seed initial legacy note if none exists
  const hasAutoSeeded = React.useRef(false);
  React.useEffect(() => {
    if (notes && notes.length === 0 && initialNotes.trim() && !hasAutoSeeded.current) {
      hasAutoSeeded.current = true;
      createNote({
        topicId,
        title: "Study Notes & Summary",
        content: initialNotes,
      });
    }
  }, [notes, initialNotes, topicId, createNote]);

  // Only clear active note if the currently selected note was deleted
  React.useEffect(() => {
    if (activeNoteId && notes) {
      const exists = notes.some((n) => n._id === activeNoteId);
      if (!exists) {
        setActiveNoteId(null);
        setActiveTitle("");
      }
    }
  }, [notes, activeNoteId]);

  const activeNote = React.useMemo(() => {
    if (!notes || !activeNoteId) return null;
    return notes.find((n) => n._id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Sync title when active note changes
  React.useEffect(() => {
    if (activeNote) {
      setActiveTitle(activeNote.title);
    }
  }, [activeNote?._id, activeNote?.title]);

  const handleCreateNewNote = async () => {
    try {
      setIsCreatingNote(true);
      const newId = await createNote({
        topicId,
        title: `Note ${notes ? notes.length + 1 : 1}`,
        content: "<p></p>",
      });
      setActiveNoteId(newId);
      setActiveTitle(`Note ${notes ? notes.length + 1 : 1}`);
      toast.success("New note created!");
    } catch (err) {
      console.error("Failed to create note:", err);
      toast.error("Failed to create note.");
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleSaveNoteContent = async (content: string) => {
    if (!activeNoteId) return;
    try {
      setIsSaving(true);
      await updateNote({
        noteId: activeNoteId,
        title: activeTitle.trim() || "Untitled Note",
        content,
      });
      toast.success("Note saved!");
    } catch (err) {
      console.error("Failed to update note:", err);
      toast.error("Failed to save note.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleBlur = async () => {
    if (!activeNoteId || !activeNote) return;
    if (activeTitle.trim() === activeNote.title) return;

    try {
      await updateNote({
        noteId: activeNoteId,
        title: activeTitle.trim() || "Untitled Note",
      });
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  const [deleteTargetId, setDeleteTargetId] = React.useState<Id<"topic_notes"> | null>(null);

  const handleOpenDeleteDialog = (e: React.MouseEvent, noteId: Id<"topic_notes">) => {
    e.stopPropagation();
    setDeleteTargetId(noteId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteNote({ noteId: deleteTargetId });
      toast.info("Note deleted");
      if (activeNoteId === deleteTargetId) {
        setActiveNoteId(null);
      }
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete note:", err);
      toast.error("Failed to delete note");
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle.trim() || !resourceUrl.trim()) return;

    let formattedUrl = resourceUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    try {
      setIsAddingLink(true);
      await addResource({
        topicId,
        title: resourceTitle.trim(),
        url: formattedUrl,
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

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Strip html for clean card preview
  const getExcerpt = (html: string) => {
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text || "Empty note...";
  };

  // Filter notes by search
  const filteredNotes = React.useMemo(() => {
    if (!notes) return [];
    return notes.filter((n) => {
      const matchTitle = n.title.toLowerCase().includes(noteSearch.toLowerCase());
      const matchContent = n.content.toLowerCase().includes(noteSearch.toLowerCase());
      return matchTitle || matchContent;
    });
  }, [notes, noteSearch]);

  return (
    <div className="space-y-6">
      {/* Multi-Notes Master View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Notes Sidebar & List */}
        <div className="lg:col-span-4 rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border/60">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Topic Notes</h3>
              {notes && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {notes.length}
                </span>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleCreateNewNote}
              disabled={isCreatingNote}
              className="h-7 text-xs gap-1 font-semibold"
            >
              {isCreatingNote ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              New Note
            </Button>
          </div>

          {/* Note Search Filter */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Notes List */}
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-0.5">
            {notes === undefined ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading notes...</span>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 p-6 text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-1 text-muted-foreground/50" />
                <p className="text-xs font-medium text-foreground">No notes found</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {noteSearch
                    ? "Try a different search query"
                    : "Click '+ New Note' to start writing"}
                </p>
              </div>
            ) : (
              filteredNotes.map((item) => {
                const isActive = item._id === activeNoteId;
                const date = new Date(item.updatedAt || item.createdAt);
                const isToday = new Date().toDateString() === date.toDateString();
                const formattedDate = isToday
                  ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : date.toLocaleDateString([], { month: "short", day: "numeric" });

                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      setActiveNoteId(item._id);
                      setActiveTitle(item.title);
                    }}
                    className={`group relative flex flex-col gap-1 rounded-lg border p-3 text-left transition-all cursor-pointer ${
                      isActive
                        ? "border-primary/60 bg-primary/5 shadow-2xs"
                        : "border-border/60 bg-card hover:bg-muted/40 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          isActive ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {item.title || "Untitled Note"}
                      </h4>

                      <button
                        type="button"
                        onClick={(e) => handleOpenDeleteDialog(e, item._id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-0.5 rounded cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {getExcerpt(item.content)}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 pt-1">
                      <span>{formattedDate}</span>
                      {isActive && (
                        <span className="text-primary font-medium flex items-center gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" /> Editing
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Note Rich Text Workspace */}
        <div className="lg:col-span-8 space-y-3">
          {activeNote ? (
            <div className="space-y-3">
              {/* Note Header & Title Editor */}
              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <input
                    type="text"
                    value={activeTitle}
                    onChange={(e) => setActiveTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    placeholder="Note title..."
                    className="text-lg font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground flex-1"
                  />

                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Updated{" "}
                      {new Date(activeNote.updatedAt || activeNote.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveNoteId(null);
                        setActiveTitle("");
                      }}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Close Editor
                    </Button>
                  </div>
                </div>
              </div>

              {/* TipTap Rich Text Editor for Active Note */}
              <RichTextEditor
                key={activeNote._id}
                initialContent={activeNote.content}
                onSave={handleSaveNoteContent}
                isSaving={isSaving}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-16 text-center bg-card shadow-xs">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold text-foreground">No Note Selected</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Select a note from the left sidebar or create a new note document for this topic.
              </p>
              <Button
                onClick={handleCreateNewNote}
                disabled={isCreatingNote}
                className="gap-1.5 font-semibold text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Note
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Curated Reference Links Section */}
      <div className="pt-2 border-t border-border/60 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <LinkIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Curated Links & Docs</h3>
            <p className="text-[11px] text-muted-foreground">Reference bookmarks and official links</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <form
            onSubmit={handleAddResource}
            className="space-y-2.5 rounded-xl border border-border/80 bg-card p-3.5 shadow-xs"
          >
            <Input
              placeholder="Resource Title (e.g. Official Docs)"
              value={resourceTitle}
              onChange={(e) => setResourceTitle(e.target.value)}
              disabled={isAddingLink}
              className="h-8 text-xs"
            />
            <Input
              placeholder="URL (e.g. https://...)"
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              disabled={isAddingLink}
              className="h-8 text-xs"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isAddingLink || !resourceTitle.trim() || !resourceUrl.trim()}
              className="w-full h-8 text-xs gap-1.5 font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Bookmark
            </Button>
          </form>

          <div className="md:col-span-2 space-y-2">
            {initialResources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
                <LinkIcon className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground font-medium">No reference links yet</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Add bookmarks on the left to save helpful documentation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {initialResources.map((res) => (
                  <div
                    key={res.url}
                    className="group flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs shadow-2xs hover:border-primary/40 transition-all"
                  >
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 truncate text-foreground hover:text-primary font-medium flex-1 mr-2"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                      <span className="truncate">{res.title}</span>
                    </a>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyLink(res.url)}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copy URL"
                      >
                        {copiedUrl === res.url ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteResource(res.url)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Remove bookmark"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Professional Confirm Modal for Deleting Notes */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Delete Study Note"
        description="Are you sure you want to delete this study note? This action is permanent and cannot be undone."
        confirmText="Delete Note"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
