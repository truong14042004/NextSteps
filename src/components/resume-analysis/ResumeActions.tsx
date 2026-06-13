"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { SparklesIcon } from "lucide-react";

export function ResumeActions({
  isLoading,
  hasRemainingUsage,
}: {
  isLoading: boolean;
  hasRemainingUsage: boolean;
}) {
  return (
    <Button
      type="submit"
      disabled={isLoading || !hasRemainingUsage}
      className="h-[52px] w-full cursor-pointer rounded-2xl bg-gradient-to-r from-[#DC2626] to-[#8B5CF6] hover:from-[#DC2626]/95 hover:to-[#8B5CF6]/95 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-[2px] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
    >
      <LoadingSwap isLoading={isLoading}>
        {hasRemainingUsage ? (
          <span className="flex items-center justify-center gap-2">
            <SparklesIcon className="size-4.5 animate-pulse" />
            Phân tích CV ngay
          </span>
        ) : (
          "Đã hết lượt phân tích"
        )}
      </LoadingSwap>
    </Button>
  );
}
