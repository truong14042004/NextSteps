"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileTextIcon, Trash2Icon, UploadCloudIcon, RefreshCwIcon } from "lucide-react";

export function ResumeDropzone({
  resumeFile,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectFile,
  onClearFile,
}: {
  resumeFile: File | null;
  isDragOver: boolean;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onSelectFile: (file: File | null) => void;
  onClearFile: () => void;
}) {
  if (resumeFile) {
    return (
      <div className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-500/20 bg-gradient-to-br from-rose-500/[0.03] to-purple-500/[0.03] p-6 text-center transition-all duration-300 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 p-4 text-white shadow-md shadow-rose-500/10">
            <FileTextIcon className="size-8 animate-bounce" />
          </div>
          <div className="space-y-1">
            <p className="max-w-[280px] sm:max-w-md truncate text-sm font-bold text-foreground">
              {resumeFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <label
            htmlFor="resume-replace"
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-white dark:bg-card px-4 text-xs font-bold text-foreground transition-all hover:bg-muted hover:border-primary/20"
          >
            <input
              id="resume-replace"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="sr-only"
              onChange={(event) => {
                onSelectFile(event.target.files?.[0] ?? null);
              }}
            />
            <RefreshCwIcon className="size-3.5 text-muted-foreground" />
            Thay thế file
          </label>
          <Button
            type="button"
            variant="ghost"
            onClick={onClearFile}
            className="h-9 rounded-xl border border-destructive/20 bg-destructive/5 px-4 text-xs font-bold text-destructive hover:bg-destructive/10"
          >
            <Trash2Icon className="mr-1.5 size-3.5" />
            Xóa file
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
        isDragOver
          ? "border-primary bg-gradient-to-br from-rose-500/10 to-purple-500/10 scale-[1.01] shadow-md"
          : "border-slate-200 dark:border-slate-800 bg-gradient-to-br from-rose-500/[0.02] to-purple-500/[0.02] hover:border-primary/45 hover:from-rose-500/[0.04] hover:to-purple-500/[0.04] hover:scale-[1.005]",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <label
        htmlFor="resume-upload"
        className="flex cursor-pointer flex-col items-center w-full h-full"
      >
        <input
          id="resume-upload"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="sr-only"
          onChange={(event) => {
            onSelectFile(event.target.files?.[0] ?? null);
          }}
        />
        <div className="mb-4 rounded-full bg-gradient-to-br from-rose-500/10 to-purple-500/10 p-4 text-primary transition-transform duration-300 group-hover:scale-110">
          <UploadCloudIcon className="size-8 text-rose-500" />
        </div>
        <p className="text-sm font-bold text-foreground">
          Tải hồ sơ CV
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Kéo thả hoặc nhấn để tải CV
        </p>
        <p className="mt-2 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
          PDF • DOCX • TXT • Tối đa 10MB
        </p>
      </label>
    </div>
  );
}
