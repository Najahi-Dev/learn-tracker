"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  CodeXml,
  Minus,
  Undo,
  Redo,
  Save,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  initialContent?: string;
  onSave: (content: string) => Promise<void>;
  isSaving?: boolean;
}

export function RichTextEditor({
  initialContent = "",
  onSave,
  isSaving = false,
}: RichTextEditorProps) {
  const [isDirty, setIsDirty] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder:
          "Write key takeaways, concept explanations, formulas, or code snippets here... (Use the toolbar or type shortcuts)",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
    ],
    content: initialContent || "<p></p>",
    onUpdate: () => {
      setIsDirty(true);
    },
  });

  // Ctrl+S / Cmd+S shortcut to save
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (editor) {
          handleManualSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, isDirty]);

  const handleManualSave = async () => {
    if (!editor) return;
    const html = editor.getHTML();
    await onSave(html);
    setIsDirty(false);
    setLastSaved(new Date());
  };

  if (!editor) {
    return (
      <div className="h-64 w-full animate-pulse rounded-xl border border-border/80 bg-muted/20" />
    );
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive
          ? "bg-primary text-primary-foreground shadow-2xs"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden focus-within:border-primary/50 transition-colors">
      {/* Rich Text Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-muted/30 p-1.5 gap-1">
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-border/80" />

          {/* Inline Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold (⌘B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic (⌘I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline (⌘U)"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            title="Highlight Text"
          >
            <Highlighter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Inline Code"
          >
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-border/80" />

          {/* Lists & Blocks */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive("taskList")}
            title="Task Checklist"
          >
            <ListTodo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Quote Block"
          >
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <CodeXml className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider Line"
          >
            <Minus className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-border/80" />

          {/* History */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (⌘Z)"
          >
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (⌘Y)"
          >
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Save Status & Action */}
        <div className="flex items-center gap-2 pr-1">
          {lastSaved && !isDirty && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Check className="h-3 w-3 text-emerald-500" />
              Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {isDirty && (
            <span className="text-[11px] text-amber-500 font-medium hidden sm:inline">
              Unsaved changes
            </span>
          )}

          <Button
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
            className="h-7 text-xs font-semibold gap-1.5 px-3"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </div>

      {/* Editor Content Box */}
      <div className="p-4 sm:p-5 min-h-[320px] max-h-[600px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-border/50 bg-muted/10 px-4 py-2 text-[11px] text-muted-foreground">
        <span>Rich Text formatted notes & checklists</span>
        <span className="font-mono">Press ⌘S / Ctrl+S to save</span>
      </div>
    </div>
  );
}
