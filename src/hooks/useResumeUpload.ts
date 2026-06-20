"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { validateResumeFile } from "@/lib/resume-validation";

export function useResumeUpload() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSelectFile = useCallback((file: File | null) => {
    const validation = validateResumeFile(file);

    if (!validation.valid) {
      if (file) {
        toast.error(validation.message);
      }
      return;
    }
    if (!file) return;
    setResumeFile(file);
    toast.success(`Đã chọn CV "${file.name}"`);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      handleSelectFile(event.dataTransfer.files[0] ?? null);
    },
    [handleSelectFile],
  );

  const clearResumeFile = useCallback(() => {
    setResumeFile(null);
  }, []);

  // Set file trực tiếp, bỏ qua validation. Dùng cho luồng "Phân tích lại":
  // file được tải về từ server đã được validate khi upload lần đầu.
  const setResumeFileDirect = useCallback((file: File) => {
    setResumeFile(file);
  }, []);

  return {
    resumeFile,
    isDragOver,
    setIsDragOver,
    handleDrop,
    handleSelectFile,
    clearResumeFile,
    setResumeFileDirect,
  };
}