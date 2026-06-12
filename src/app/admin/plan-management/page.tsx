import { PlanManagementClient } from "@/components/admin/plan/plan-management-client";
import { getAdminPlans } from "@/features/admin/metrics";

export default async function PlanManagementPage() {
  const plans = await getAdminPlans();

  return <PlanManagementClient initialData={plans} />;
}
