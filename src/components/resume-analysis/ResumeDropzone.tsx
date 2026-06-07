"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileTextIcon, Trash2Icon, UploadCloudIcon } from "lucide-react";

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
      <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <FileTextIcon className="size-5" />
          </div>
          <div className="max-w-[200px] sm:max-w-md">
            <p className="truncate text-sm font-semibold text-foreground">
              {resumeFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClearFile}
          className="size-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all",
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/10 hover:border-primary/45 hover:bg-primary/[0.01]",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <label
        htmlFor="resume-upload"
        className="flex cursor-pointer flex-col items-center"
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
        <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
          <UploadCloudIcon className="size-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Kéo thả hoặc nhấn để tải file CV
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          PDF, Word, TXT (Tối đa 10MB)
        </p>
      </label>
    </div>
  );
}
