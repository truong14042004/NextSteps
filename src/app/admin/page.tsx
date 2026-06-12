import {
  BarChart3,
  Users,
  Calendar,
  BriefcaseBusiness,
  CreditCard,
  ReceiptText,
  Package,
  Download,
} from "lucide-react";
import Link from "next/link";

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
import { RecentActivityFeed } from "@/components/admin/dashboard/recent-activity-feed";
import { getAdminDashboard } from "@/features/admin/metrics";

export default async function AdminPage() {
  const dashboard = await getAdminDashboard(30);

  return (
    <div className="space-y-6">
      {/* Mini Hero Header Section */}
      {/* Subtle accent light source */}
      {/* <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Tổng quan quản trị
            </h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl">
              Hệ thống NextStep theo dõi hiệu suất và các chỉ số tương tác người dùng trong thời gian thực.
            </p>
          </div>
        </div> */}

      {/* KPI Cards Section */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={Users}
            label="Người dùng hoạt động"
            value={dashboard.stats.activeUsers.value}
            growthText={dashboard.stats.activeUsers.growthText}
            growthKind={dashboard.stats.activeUsers.growthKind}
          />
          <StatsCard
            icon={BarChart3}
            label="Tổng số phỏng vấn AI"
            value={dashboard.stats.totalInterviews.value}
            growthText={dashboard.stats.totalInterviews.growthText}
            growthKind={dashboard.stats.totalInterviews.growthKind}
          />
          <StatsCard
            icon={BarChart3}
            label="Tổng doanh thu"
            value={dashboard.stats.totalRevenue.value}
            growthText={dashboard.stats.totalRevenue.growthText}
            growthKind={dashboard.stats.totalRevenue.growthKind}
          />
          <StatsCard
            icon={Users}
            label="Số lượng đăng ký"
            value={dashboard.stats.registrations.value}
            growthText={dashboard.stats.registrations.growthText}
            growthKind={dashboard.stats.registrations.growthKind}
          />
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-5">
          <Link
            href="/admin/user-management"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/30 hover:border-border/60 transition-all text-center group"
          >
            <Users className="size-5 text-primary group-hover:scale-110 transition-transform mb-2" />
            <span className="text-xs font-semibold text-foreground">
              Quản lý người dùng
            </span>
          </Link>
          <Link
            href="/admin/recruiter-management"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/30 hover:border-border/60 transition-all text-center group"
          >
            <BriefcaseBusiness className="size-5 text-primary group-hover:scale-110 transition-transform mb-2" />
            <span className="text-xs font-semibold text-foreground">
              Quản lý nhà tuyển dụng
            </span>
          </Link>
          <Link
            href="/admin/revenue-management"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/30 hover:border-border/60 transition-all text-center group"
          >
            <CreditCard className="size-5 text-primary group-hover:scale-110 transition-transform mb-2" />
            <span className="text-xs font-semibold text-foreground">
              Quản lý doanh thu
            </span>
          </Link>
          <Link
            href="/admin/transaction-management"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/30 hover:border-border/60 transition-all text-center group"
          >
            <ReceiptText className="size-5 text-primary group-hover:scale-110 transition-transform mb-2" />
            <span className="text-xs font-semibold text-foreground">
              Quản lý giao dịch
            </span>
          </Link>
          <Link
            href="/admin/plan-management"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/30 hover:border-border/60 transition-all text-center group"
          >
            <Package className="size-5 text-primary group-hover:scale-110 transition-transform mb-2" />
            <span className="text-xs font-semibold text-foreground">
              Quản lý gói mua
            </span>
          </Link>
        </div>
      </section>

      {/* 3-Column Grid: Growth Chart, Recent Activity Feed, Subscription Analytics */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
        <GrowthChart data={dashboard.registrationGrowth} />
        <RecentActivityFeed activities={dashboard.recentActivities} />
        <AiPerformanceCard distribution={dashboard.planDistribution.items} />
      </section>

      {/* Recent Users Table Section */}
      <section>
        <UserActivityTable />
      </section>
    </div>
  );
}
