"use client";

import { BarChart3, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { StatsCard } from "@/components/admin/dashboard/stats-card";
import { AiPerformanceCard } from "@/components/admin/dashboard/ai-performance-card";
import { GrowthChart } from "@/components/admin/dashboard/growth-chart";
import { UserActivityTable } from "@/components/admin/dashboard/user-activity-table";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Tổng quan quản trị
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hệ thống NextStep theo dõi hiệu suất và các chỉ số tương tác người
            dùng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="min-w-[210px]">
            <Select defaultValue="30">
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Past 30 Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Past 7 Days</SelectItem>
                <SelectItem value="30">Past 30 Days</SelectItem>
                <SelectItem value="90">Past 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="rounded-xl">Generate Report</Button>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={Users}
            label="Người dùng hoạt động"
            value="240"
            growthText="+12.8%"
            growthKind="positive"
          />
          <StatsCard
            icon={BarChart3}
            label="Tổng số phỏng vấn AI"
            value="4,800"
            growthText="+4.2%"
            growthKind="positive"
          />
          <StatsCard
            icon={BarChart3}
            label="Tổng doanh thu"
            value="220,200,000₫"
            growthText="+12.5%"
            growthKind="positive"
          />
          <StatsCard
            icon={Users}
            label="Số lượng đăng ký"
            value="850"
            growthText="+5.2%"
            growthKind="positive"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GrowthChart />
        <AiPerformanceCard />
      </section>

      <section>
        <UserActivityTable />
      </section>
    </div>
  );
}
