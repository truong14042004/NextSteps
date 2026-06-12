"use client";

import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RevenueFilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Tìm giao dịch..."
          className="w-full sm:w-64 pl-9.5 bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-full h-10 focus-visible:ring-1 focus-visible:ring-red-500/20 text-sm"
        />
      </div>

      {/* Export Button */}
      <Button className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-medium rounded-full px-5 h-10 shadow-xs transition-colors duration-200 text-sm border border-zinc-200 dark:border-zinc-800">
        <Download className="h-4 w-4" />
        Xuất báo cáo
      </Button>
    </div>
  );
}
