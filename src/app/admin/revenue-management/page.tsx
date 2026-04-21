import { DollarSign, RefreshCcw, TrendingDown } from "lucide-react";

import { RevenueStatCard } from "@/components/admin/revenue/revenue-stat-card";
import { RevenueGrowthChart } from "@/components/admin/revenue/revenue-growth-chart";
import { RecentTransactionsTable } from "@/components/admin/revenue/recent-transactions-table";
import { RevenueFilterBar } from "@/components/admin/revenue/revenue-filter-bar";

export default function RevenueManagementPage() {
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
            value="$128,450"
            change="+12.5%"
            changeType="positive"
            description="6 tháng gần đây"
            icon={DollarSign}
          />
          <RevenueStatCard
            title="Doanh thu định kỳ hàng tháng"
            value="$12,000"
            change="+8%"
            changeType="positive"
            description="Tăng trưởng theo tháng"
            icon={RefreshCcw}
          />
          <RevenueStatCard
            title="Tỷ lệ hủy gói"
            value="2.4%"
            change="-0.5%"
            changeType="positive"
            description="Thấp nhất trong 6 tháng"
            icon={TrendingDown}
          />
        </div>
      </section>

      <section>
        <RevenueGrowthChart />
      </section>

      <section>
        <RecentTransactionsTable />
      </section>
    </div>
  );
}
