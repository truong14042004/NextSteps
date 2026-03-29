import {
  Users,
  User,
  Rocket,
  Gem,
  Settings2,
  BadgeDollarSign,
} from "lucide-react";

import { PlanStatCard } from "@/components/admin/plan/plan-stat-card";
import { PlanDistributionCard } from "@/components/admin/plan/plan-distribution-card";
import { PlanGrowthChart } from "@/components/admin/plan/plan-growth-chart";
import { PlanPerformanceTable } from "@/components/admin/plan/plan-performance-table";
import { PlanActionCard } from "@/components/admin/plan/plan-action-card";

export default function PlanManagementPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          Quản lý gói mua
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi hiệu suất gói dịch vụ, phân bổ người dùng và tăng trưởng đăng
          ký.
        </p>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlanStatCard
            title="Tổng người đăng ký"
            value="12,842"
            change="+12.4%"
            changeType="positive"
            icon={Users}
          />
          <PlanStatCard
            title="Người dùng Free"
            value="8,120"
            badge="Stable"
            changeType="neutral"
            icon={User}
          />
          <PlanStatCard
            title="Người dùng Start"
            value="3,450"
            change="+4.2%"
            changeType="positive"
            icon={Rocket}
          />
          <PlanStatCard
            title="Người dùng Premium"
            value="1,272"
            change="+18.9%"
            changeType="positive"
            icon={Gem}
            featured
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_2.1fr]">
        <PlanDistributionCard />
        <PlanGrowthChart />
      </section>

      <section>
        <PlanPerformanceTable />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlanActionCard
          title="Feature Allocation"
          description="Thêm hoặc gỡ các tính năng nền tảng cho từng gói hiện có."
          buttonText="Quản lý tính năng"
          icon={Settings2}
        />
        <PlanActionCard
          title="Pricing Engine"
          description="Điều chỉnh giá tháng, giảm giá năm và thời gian dùng thử."
          buttonText="Cập nhật giá"
          icon={BadgeDollarSign}
          darkButton
        />
      </section>
    </div>
  );
}
