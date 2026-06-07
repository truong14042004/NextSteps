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
      className="h-12 w-full cursor-pointer rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.005] active:scale-[0.995]"
    >
      <LoadingSwap isLoading={isLoading}>
        {hasRemainingUsage ? (
          <span className="flex items-center justify-center gap-2">
            <SparklesIcon className="size-4 animate-pulse" />
            Phân tích CV ngay
          </span>
        ) : (
          "Đã hết lượt phân tích"
        )}
      </LoadingSwap>
    </Button>
  );
}
