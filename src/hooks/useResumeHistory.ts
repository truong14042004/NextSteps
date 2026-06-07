"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ExperienceLevel } from "@/drizzle/schema/jobInfo";
import { getUserJobInfos, updateJobInfoDirect } from "@/features/jobInfos/actions";
import type { JobInfoHistory } from "@/components/resume-analysis/types";

type EditValues = {
  title: string;
  experienceLevel: ExperienceLevel;
  description: string;
};

export function useResumeHistory({ isActive }: { isActive: boolean }) {
  const [history, setHistory] = useState<JobInfoHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadHistory = useCallback(async () => {
    if (history != null) return;

    setHistoryLoading(true);
    try {
      const items = await getUserJobInfos(20);
      setHistory(items);
    } catch {
      toast.error("Không thể tải lịch sử phân tích");
    } finally {
      setHistoryLoading(false);
    }
  }, [history]);

  useEffect(() => {
    if (isActive) {
      void loadHistory();
    }
  }, [isActive, loadHistory]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  }, []);

  const startEditing = useCallback((item: NonNullable<JobInfoHistory>[number]) => {
    setEditingId(item.id);
    setEditValues({
      title: item.title ?? "",
      experienceLevel: item.experienceLevel,
      description: item.description,
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditValues(null);
  }, []);

  const saveEditing = useCallback(
    async (itemId: string) => {
      if (!editValues) return;

      setIsSaving(true);
      const result = await updateJobInfoDirect(itemId, editValues);
      setIsSaving(false);

      if (result.error) {
        toast.error(result.message);
        return;
      }

      toast.success("Đã cập nhật thông tin thành công");
      setHistory((previous) =>
        previous?.map((item) =>
          item.id === itemId
            ? {
                ...item,
                title: editValues.title,
                experienceLevel: editValues.experienceLevel,
                description: editValues.description,
              }
            : item,
        ) ?? null,
      );
      cancelEditing();
    },
    [cancelEditing, editValues],
  );

  return {
    history,
    historyLoading,
    expandedId,
    editingId,
    editValues,
    isSaving,
    setEditValues,
    toggleExpanded,
    startEditing,
    cancelEditing,
    saveEditing,
  };
}