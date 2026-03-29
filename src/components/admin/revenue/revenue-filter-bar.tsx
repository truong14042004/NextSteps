"use client";

import { Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RevenueFilterBar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative w-full sm:w-[280px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Tìm giao dịch..." className="rounded-2xl pl-9" />
      </div>

      <Button className="rounded-2xl">
        <Download className="mr-2 h-4 w-4" />
        Generate Report
      </Button>
    </div>
  );
}
