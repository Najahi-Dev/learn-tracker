"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "destructive",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Confirmation action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const isBusy = isLoading || loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              variant === "destructive"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            }`}
          >
            {variant === "destructive" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </div>

          <div className="space-y-1 pt-0.5">
            <DialogTitle className="text-base font-semibold leading-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              {description}
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 pt-2 border-t border-border/50 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
            className="h-9 px-4 text-xs font-medium cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={handleConfirm}
            disabled={isBusy}
            className="h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            {isBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : variant === "destructive" ? (
              <Trash2 className="h-3.5 w-3.5" />
            ) : null}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
