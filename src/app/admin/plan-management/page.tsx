import {
  Users,
  User,
  Rocket,
  Gem,
} from "lucide-react";

import { PlanStatCard } from "@/components/admin/plan/plan-stat-card";
import { PlanDistributionCard } from "@/components/admin/plan/plan-distribution-card";
import { PlanGrowthChart } from "@/components/admin/plan/plan-growth-chart";
import { PlanPerformanceTable } from "@/components/admin/plan/plan-performance-table";
import { AdminPlanManager } from "@/components/admin/plan/admin-plan-manager";
import { getAdminPlans } from "@/features/admin/metrics";

export default async function PlanManagementPage() {
  const plans = await getAdminPlans();

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
            value={plans.stats.totalSubscribers.toLocaleString()}
            changeType="neutral"
            icon={Users}
          />
          <PlanStatCard
            title="Người dùng Free"
            value={plans.stats.freeUsers.toLocaleString()}
            badge="Live"
            changeType="neutral"
            icon={User}
          />
          <PlanStatCard
            title="Người dùng Start"
            value={plans.stats.startUsers.toLocaleString()}
            badge="Live"
            changeType="neutral"
            icon={Rocket}
          />
          <PlanStatCard
            title="Người dùng Premium"
            value={plans.stats.premiumUsers.toLocaleString()}
            badge="Live"
            changeType="neutral"
            icon={Gem}
            featured
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_2.1fr]">
        <PlanDistributionCard distribution={plans.distribution} />
        <PlanGrowthChart data={plans.growth} />
      </section>

      <section>
        <PlanPerformanceTable rows={plans.performance} />
      </section>

      <AdminPlanManager initialPlans={plans.configs} />
    </div>
  );
}
