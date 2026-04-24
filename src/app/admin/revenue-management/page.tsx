import { DollarSign, RefreshCcw, TrendingDown } from "lucide-react";

import { RevenueStatCard } from "@/components/admin/revenue/revenue-stat-card";
import { RevenueGrowthChart } from "@/components/admin/revenue/revenue-growth-chart";
import { RecentTransactionsTable } from "@/components/admin/revenue/recent-transactions-table";
import { RevenueFilterBar } from "@/components/admin/revenue/revenue-filter-bar";
import { getAdminRevenue } from "@/features/admin/metrics";

export default async function RevenueManagementPage() {
  const revenue = await getAdminRevenue();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý doanh thu
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi doanh thu, tăng trưởng hàng tháng và lịch sử giao dịch.
          </p>
        </div>

        <RevenueFilterBar />
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <RevenueStatCard
            title="Tổng doanh thu"
            value={revenue.stats.totalRevenue.value}
            change={revenue.stats.totalRevenue.change}
            changeType={revenue.stats.totalRevenue.changeType}
            description="Theo dữ liệu thanh toán hiện có"
            icon={DollarSign}
          />
          <RevenueStatCard
            title="Doanh thu định kỳ hàng tháng"
            value={revenue.stats.monthlyRecurringRevenue.value}
            change={revenue.stats.monthlyRecurringRevenue.change}
            changeType={revenue.stats.monthlyRecurringRevenue.changeType}
            description="Tăng trưởng theo tháng"
            icon={RefreshCcw}
          />
          <RevenueStatCard
            title="Tỷ lệ hủy gói"
            value={revenue.stats.churnRate.value}
            change={revenue.stats.churnRate.change}
            changeType={revenue.stats.churnRate.changeType}
            description="Chưa có bảng subscription"
            icon={TrendingDown}
          />
        </div>
      </section>

      <section>
        <RevenueGrowthChart data={revenue.chart} />
      </section>

      <section>
        <RecentTransactionsTable transactions={revenue.transactions} />
      </section>
    </div>
  );
}
