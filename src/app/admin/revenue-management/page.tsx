import { DollarSign, RefreshCcw, TrendingDown, CreditCard, Sparkles } from "lucide-react";

import { RevenueStatCard } from "@/components/admin/revenue/revenue-stat-card";
import { RevenueGrowthChart } from "@/components/admin/revenue/revenue-growth-chart";
import { RecentTransactionsTable } from "@/components/admin/revenue/recent-transactions-table";
import { RevenueFilterBar } from "@/components/admin/revenue/revenue-filter-bar";
import { getAdminRevenue, getPlanDistribution } from "@/features/admin/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RevenueManagementPage() {
  const [revenue, planDistribution] = await Promise.all([
    getAdminRevenue(),
    getPlanDistribution(),
  ]);

  // Calculate total transactions of paid plans (Start + Premium) dynamically
  const startCount = planDistribution.items.find(i => i.label === "Start")?.count ?? 0;
  const premiumCount = planDistribution.items.find(i => i.label === "Premium")?.count ?? 0;
  const totalTransactions = startCount + premiumCount;

  // Calculate dynamic conversion rate
  const totalUsers = planDistribution.total || 1;
  const conversionRate = ((totalTransactions / totalUsers) * 100).toFixed(1) + "%";

  // Pre-calculate segments for Doughnut conic-gradient
  let accumulated = 0;
  const gradientParts = planDistribution.items.map(plan => {
    const start = accumulated;
    accumulated += plan.value;
    const end = accumulated;
    
    let color = "#a1a1aa"; // Free
    if (plan.label === "Premium") color = "#8b5cf6";
    else if (plan.label === "Start") color = "#3b82f6";
    
    return `${color} ${start}% ${end}%`;
  }).join(", ");

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Quản lý doanh thu
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi doanh thu, tăng trưởng và hiệu suất kinh doanh của nền tảng.
          </p>
        </div>

        <RevenueFilterBar />
      </section>

      {/* 2. Revenue Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RevenueStatCard
          title="Tổng doanh thu"
          value={revenue.stats.totalRevenue.value}
          change={revenue.stats.totalRevenue.change}
          changeType={revenue.stats.totalRevenue.changeType}
          description="Dữ liệu tích lũy trọn đời"
          icon={DollarSign}
        />
        <RevenueStatCard
          title="Doanh thu tháng này"
          value={revenue.stats.monthlyRecurringRevenue.value}
          change={revenue.stats.monthlyRecurringRevenue.change}
          changeType={revenue.stats.monthlyRecurringRevenue.changeType}
          description="Doanh thu định kỳ hàng tháng"
          icon={RefreshCcw}
        />
        <RevenueStatCard
          title="Tổng giao dịch"
          value={String(totalTransactions)}
          change={conversionRate}
          changeType="positive"
          description="Gói dịch vụ có phí"
          icon={CreditCard}
        />
        <RevenueStatCard
          title="Tỷ lệ hủy gói"
          value={revenue.stats.churnRate.value}
          change={revenue.stats.churnRate.change}
          changeType={revenue.stats.churnRate.changeType}
          description="Chưa phát sinh tỷ lệ hủy"
          icon={TrendingDown}
        />
      </section>

      {/* 3. Revenue Analytics Layout */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <RevenueGrowthChart data={revenue.chart} transactions={revenue.transactions} />
        </div>

        <div className="lg:col-span-4">
          <Card className="h-full rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Doanh thu theo gói
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Phân bổ tỷ lệ gói đăng ký của người dùng trên nền tảng.
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
              {/* Doughnut Chart container */}
              <div 
                className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-inner transition-transform hover:scale-102 duration-300"
                style={{
                  background: gradientParts ? `conic-gradient(${gradientParts})` : "#e4e4e7"
                }}
              >
                {/* Central hole of Doughnut */}
                <div className="absolute w-24 h-24 rounded-full bg-white dark:bg-zinc-900 flex flex-col items-center justify-center shadow-2xs">
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {planDistribution.total}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-450 dark:text-zinc-500 mt-0.5">
                    Thành viên
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="w-full space-y-3 pt-2">
                {planDistribution.items.map((plan) => {
                  let colorClass = "bg-zinc-400 dark:bg-zinc-500";
                  let textClass = "text-zinc-650 dark:text-zinc-400";
                  let badgeClass = "bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400";

                  if (plan.label === "Premium") {
                    colorClass = "bg-purple-500";
                    textClass = "text-purple-600 dark:text-purple-400";
                    badgeClass = "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400";
                  } else if (plan.label === "Start") {
                    colorClass = "bg-blue-500";
                    textClass = "text-blue-600 dark:text-blue-400";
                    badgeClass = "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400";
                  }

                  return (
                    <div key={plan.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${colorClass}`} />
                        <span className="font-semibold text-zinc-750 dark:text-zinc-300">{plan.label}</span>
                      </div>
                      <div className="flex items-center gap-2.5 font-bold text-zinc-900 dark:text-zinc-50">
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{plan.count} gói</span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${badgeClass}`}>
                          {plan.value}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. Recent Transactions */}
      <section>
        <RecentTransactionsTable transactions={revenue.transactions} />
      </section>
    </div>
  );
}
