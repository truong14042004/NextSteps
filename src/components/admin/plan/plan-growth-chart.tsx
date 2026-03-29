"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const filters = ["30 Days", "90 Days"] as const;

export function PlanGrowthChart() {
  const [active, setActive] = useState<(typeof filters)[number]>("30 Days");

  return (
    <Card className="rounded-3xl border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-semibold">
            Xu hướng tăng trưởng
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Lượng đăng ký gói mới trong 30 ngày gần nhất.
          </p>
        </div>

        <div className="inline-flex rounded-2xl bg-muted p-1">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActive(item)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                active === item
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative h-[240px] overflow-hidden rounded-3xl bg-muted/20 p-6">
          <div className="absolute inset-x-6 top-16 h-px bg-border" />
          <div className="absolute inset-x-6 top-32 h-px bg-border" />
          <div className="absolute inset-x-6 top-48 h-px bg-border" />

          <svg
            viewBox="0 0 900 320"
            className="h-full w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M20 250 C120 220, 180 170, 260 140 C340 110, 410 130, 480 180 C560 235, 650 220, 730 100 C785 20, 845 15, 885 90"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-primary"
              strokeLinecap="round"
            />
          </svg>

          <div className="mt-3 grid grid-cols-5 text-xs font-semibold text-muted-foreground">
            <span>MAR 01</span>
            <span className="text-center">MAR 08</span>
            <span className="text-center">MAR 15</span>
            <span className="text-center">MAR 22</span>
            <span className="text-right">MAR 30</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
