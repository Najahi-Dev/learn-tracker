"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileUp,
  Sparkles,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Layers,
  ArrowRight,
  ListTodo,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  extractTextFromPdf,
  analyzeDocumentToTasks,
  type ParsedTaskItem,
  type PdfAnalysisResult,
} from "@/lib/pdf-parser";
import type { Id } from "@/convex/_generated/dataModel";

interface PdfUploadDialogProps {
  /** Optional topicId. If provided, tasks are imported into this topic. Otherwise, a new topic is created. */
  topicId?: Id<"topics">;
  topicName?: string;
  triggerButton?: React.ReactNode;
}

export function PdfUploadDialog({
  topicId,
  topicName: existingTopicName,
  triggerButton,
}: PdfUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "analyzing" | "preview">("upload");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analyzingStatus, setAnalyzingStatus] = useState("");

  // Analysis result state
  const [parsedTopicName, setParsedTopicName] = useState("");
  const [parsedDescription, setParsedDescription] = useState("");
  const [parsedTasks, setParsedTasks] = useState<ParsedTaskItem[]>([]);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const importTasksAndSubtasks = useMutation(api.tasks.importTasksAndSubtasks);
  const importTopicWithTasksFromPdf = useMutation(api.tasks.importTopicWithTasksFromPdf);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setParsedTopicName("");
    setParsedDescription("");
    setParsedTasks([]);
    setExpandedTaskIds(new Set());
    setIsImporting(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".pdf")) {
        processPdfFile(droppedFile);
      } else {
        toast.error("Please upload a valid PDF file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      processPdfFile(selectedFile);
    }
  };

  const processPdfFile = async (pdfFile: File) => {
    try {
      setFile(pdfFile);
      setStep("analyzing");
      setAnalyzingStatus("Extracting pages & text content from PDF...");

      const { text, totalPages } = await extractTextFromPdf(pdfFile);

      if (!text || text.length < 15) {
        toast.error("Could not extract readable text from this PDF. It might be scanned or image-only.");
        setStep("upload");
        return;
      }

      setAnalyzingStatus("AI analyzing structure, milestones, and subtasks...");
      // Small artificial delay for smooth UI transition
      await new Promise((r) => setTimeout(r, 600));

      const analysis: PdfAnalysisResult = analyzeDocumentToTasks(text, pdfFile.name, totalPages);

      setParsedTopicName(existingTopicName || analysis.topicName);
      setParsedDescription(analysis.description);
      setParsedTasks(analysis.tasks);
      // Expand all tasks with subtasks by default for easy review
      setExpandedTaskIds(new Set(analysis.tasks.map((t) => t.id)));
      setStep("preview");
    } catch (err) {
      console.error("Failed to parse PDF:", err);
      toast.error("Failed to parse the PDF document. Please try another file.");
      setStep("upload");
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setParsedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, selected: !t.selected } : t))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = parsedTasks.every((t) => t.selected !== false);
    setParsedTasks((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleUpdateTaskTitle = (taskId: string, newTitle: string) => {
    setParsedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t))
    );
  };

  const handleUpdateSubtask = (taskId: string, subtaskIndex: number, newTitle: string) => {
    setParsedTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = [...t.subtasks];
          updated[subtaskIndex] = newTitle;
          return { ...t, subtasks: updated };
        }
        return t;
      })
    );
  };

  const handleCyclePriority = (taskId: string) => {
    setParsedTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextPriority: Record<"low" | "medium" | "high", "low" | "medium" | "high"> = {
            low: "medium",
            medium: "high",
            high: "low",
          };
          return { ...t, priority: nextPriority[t.priority] };
        }
        return t;
      })
    );
  };

  const handleAddNewParentTask = () => {
    const newTask: ParsedTaskItem = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: "New Learning Milestone",
      priority: "medium",
      subtasks: ["Review core principles and practical examples"],
      selected: true,
    };
    setParsedTasks((prev) => [...prev, newTask]);
    setExpandedTaskIds((prev) => new Set(prev).add(newTask.id));
  };

  const handleDeleteTask = (taskId: string) => {
    setParsedTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleDeleteSubtask = (taskId: string, subtaskIndex: number) => {
    setParsedTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = [...t.subtasks];
          updatedSubtasks.splice(subtaskIndex, 1);
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      })
    );
  };

  const handleAddSubtask = (taskId: string) => {
    setParsedTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, subtasks: [...t.subtasks, "New actionable subtask"] };
        }
        return t;
      })
    );
    setExpandedTaskIds((prev) => new Set(prev).add(taskId));
  };

  const selectedTasks = parsedTasks.filter((t) => t.selected !== false);
  const totalSubtasksCount = selectedTasks.reduce((acc, t) => acc + (t.subtasks?.length || 0), 0);

  const handleConfirmImport = async () => {
    if (selectedTasks.length === 0) {
      toast.error("Please select at least one task to import.");
      return;
    }

    try {
      setIsImporting(true);

      const payloadTasks = selectedTasks.map((t) => ({
        title: t.title,
        priority: t.priority,
        subtasks: t.subtasks,
      }));

      if (topicId) {
        // Import into current topic
        const result = await importTasksAndSubtasks({
          topicId,
          tasks: payloadTasks,
        });

        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.7 },
        });

        toast.success(
          `Imported ${result.tasksCreated} tasks and ${result.subtasksCreated} subtasks successfully!`
        );
      } else {
        // Create new topic from PDF
        const result = await importTopicWithTasksFromPdf({
          topicName: parsedTopicName.trim() || "Imported Study Plan",
          description: parsedDescription.trim(),
          tasks: payloadTasks,
        });

        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });

        toast.success(
          `Created topic "${parsedTopicName}" with ${result.tasksCreated} tasks and ${result.subtasksCreated} subtasks!`
        );

        router.push(`/dashboard/topics/${result.topicId}`);
      }

      setOpen(false);
      resetState();
    } catch (err) {
      console.error("Failed to import tasks:", err);
      toast.error("Failed to import tasks from PDF.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <DialogTrigger asChild>
        {triggerButton ? (
          triggerButton
        ) : (
          <Button
            variant="outline"
            className="gap-2 border-indigo-500/30 hover:border-indigo-500 shadow-xs bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
          >
            <FileUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>{topicId ? "Import from PDF" : "PDF to Study Plan"}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[650px] max-h-[88vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FileUp className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {step === "preview" ? "Review & Import Tasks" : "Upload PDF Document"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {topicId
                    ? `Extract and create tasks & subtasks directly under this topic.`
                    : `Analyze any syllabus, checklist, or guide to generate a complete learning topic.`}
                </DialogDescription>
              </div>
            </div>
            {step === "preview" && (
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30 gap-1 text-[11px]">
                <Sparkles className="h-3 w-3" />
                AI Analyzed
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-500/10 scale-[0.99]"
                    : "border-border/70 hover:border-indigo-500/50 hover:bg-muted/40 bg-card"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Click to choose a PDF or drag and drop here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports course syllabi, roadmap documents, checklists, book outlines, etc.
                  </p>
                </div>
                <Button size="sm" variant="secondary" className="mt-2 text-xs gap-1.5 pointer-events-none">
                  <FileUp className="h-3.5 w-3.5" />
                  Select PDF File
                </Button>
              </div>

              <div className="rounded-lg bg-muted/40 p-3.5 border border-border/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  How it works:
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Extracts modules, chapters, and topics as <strong>Tasks</strong>.</li>
                  <li>Extracts bullet points and action items as nested <strong>Subtasks</strong>.</li>
                  <li>You can preview, edit, uncheck, or add new items before importing.</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: ANALYZING */}
          {step === "analyzing" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 animate-pulse">
                  <Sparkles className="h-8 w-8" />
                </div>
                <Loader2 className="h-16 w-16 absolute -inset-0 text-indigo-600 animate-spin opacity-40" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">Processing Document</h3>
                <p className="text-xs text-muted-foreground">{analyzingStatus}</p>
              </div>
              {file && (
                <Badge variant="outline" className="text-[11px] font-normal gap-1">
                  <FileText className="h-3 w-3" />
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </Badge>
              )}
            </div>
          )}

          {/* STEP 3: PREVIEW & CUSTOMIZE */}
          {step === "preview" && (
            <div className="space-y-4">
              {/* Topic info header (if creating new topic) */}
              {!topicId && (
                <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-2.5">
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Learning Topic Name
                    </label>
                    <Input
                      value={parsedTopicName}
                      onChange={(e) => setParsedTopicName(e.target.value)}
                      placeholder="e.g. Machine Learning Fundamentals"
                      className="mt-1 h-8 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Description / Summary
                    </label>
                    <Input
                      value={parsedDescription}
                      onChange={(e) => setParsedDescription(e.target.value)}
                      placeholder="Topic summary..."
                      className="mt-1 h-8 text-xs text-muted-foreground"
                    />
                  </div>
                </div>
              )}

              {/* Tasks List Header */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Extracted Tasks & Subtasks
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.2">
                    {selectedTasks.length} Tasks • {totalSubtasksCount} Subtasks
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                >
                  {parsedTasks.every((t) => t.selected !== false) ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Tasks Tree List */}
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {parsedTasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No tasks found in document.
                  </div>
                ) : (
                  parsedTasks.map((task) => {
                    const isExpanded = expandedTaskIds.has(task.id);
                    const isSelected = task.selected !== false;

                    return (
                      <div
                        key={task.id}
                        className={`rounded-lg border transition-all ${
                          isSelected
                            ? "border-border bg-card shadow-2xs"
                            : "border-border/40 bg-muted/20 opacity-60"
                        }`}
                      >
                        {/* Parent Task Header */}
                        <div className="p-2.5 flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTaskSelection(task.id)}
                            className="cursor-pointer"
                          />

                          <button
                            type="button"
                            onClick={() => toggleExpand(task.id)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <Input
                              value={task.title}
                              onChange={(e) => handleUpdateTaskTitle(task.id, e.target.value)}
                              placeholder="Milestone title..."
                              className="h-7 text-xs font-semibold bg-background/50 border-border/60 hover:border-primary/50 focus:border-primary focus:bg-background px-2"
                            />
                          </div>

                          {/* Interactive Priority Badge */}
                          <button
                            type="button"
                            onClick={() => handleCyclePriority(task.id)}
                            title="Click to toggle priority (High → Medium → Low)"
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95 ${
                              task.priority === "high"
                                ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                                : task.priority === "medium"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                          >
                            {task.priority}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded cursor-pointer"
                            title="Remove milestone"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Nested Subtasks List */}
                        {isExpanded && (
                          <div className="pl-8 pr-3 pb-2.5 pt-1 space-y-1.5 border-t border-border/30 bg-muted/10">
                            {task.subtasks.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-center justify-between gap-1.5 group text-xs text-muted-foreground hover:text-foreground bg-background/50 hover:bg-background border border-border/40 hover:border-indigo-500/40 rounded-md p-0.5 pr-1.5 transition-all shadow-2xs"
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <span className="text-[10px] text-muted-foreground/50 pl-1.5 font-bold">•</span>
                                  <Input
                                    value={sub}
                                    onChange={(e) => handleUpdateSubtask(task.id, sIdx, e.target.value)}
                                    placeholder="Subtask description..."
                                    className="h-6 text-xs bg-transparent border-transparent hover:border-border/60 focus:border-indigo-500 focus:bg-background px-1.5 py-0 shadow-none font-normal"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubtask(task.id, sIdx)}
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded cursor-pointer transition-opacity shrink-0"
                                  title="Remove subtask"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddSubtask(task.id)}
                              className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline pt-1 cursor-pointer font-medium pl-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add subtask
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Add Parent Milestone Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddNewParentTask}
                  className="w-full text-xs border-dashed border-border/80 hover:border-indigo-500 hover:bg-indigo-500/5 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 gap-1.5 h-8.5 mt-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Another Milestone / Chapter</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/20 border-t border-border/40 sm:justify-between flex items-center">
          {step === "preview" ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("upload")}
                disabled={isImporting}
              >
                Upload Different File
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmImport}
                disabled={isImporting || selectedTasks.length === 0}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Import {selectedTasks.length} Tasks ({totalSubtasksCount} Subtasks)
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="ml-auto"
            >
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
