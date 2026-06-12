"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  User,
  Rocket,
  Gem,
  Search,
  Download,
  Plus,
  MoreHorizontal,
  Edit,
  Copy,
  EyeOff,
  Eye,
  Trash2,
  Check,
  Activity,
  Sparkles,
  DollarSign,
  AlertCircle,
  Save,
  LineChart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AdminPlanFeature = {
  id: string;
  planId: string;
  label: string;
  description: string | null;
  isEnabled: boolean;
  sortOrder: number;
};

type AdminPlanConfig = {
  id: string;
  key: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualDiscountPercent: number;
  trialDays: number;
  resumeAnalysisLimit: number | null;
  aiQuestionLimit: number | null;
  mockInterviewLimit: number | null;
  aiQuizLimit: number | null;
  isActive: boolean;
  sortOrder: number;
  features: AdminPlanFeature[];
};

type PlanPerformanceRow = {
  plan: string;
  description: string;
  activeUsers: number;
  conversion: string;
  revenue: string;
  retention: number;
  badge: string;
};

type PlanFormState = {
  name: string;
  description: string;
  monthlyPrice: string;
  annualDiscountPercent: string;
  trialDays: string;
  resumeAnalysisLimit: string;
  resumeAnalysisUnlimited: boolean;
  aiQuestionLimit: string;
  aiQuestionUnlimited: boolean;
  mockInterviewLimit: string;
  mockInterviewUnlimited: boolean;
  aiQuizLimit: string;
  aiQuizUnlimited: boolean;
  isActive: boolean;
};

type PlanManagementClientProps = {
  initialData: {
    stats: {
      totalSubscribers: number;
      freeUsers: number;
      startUsers: number;
      premiumUsers: number;
    };
    distribution: {
      total: number;
      items: { label: string; value: number; count: number }[];
    };
    configs: AdminPlanConfig[];
    growth: {
      daily: { label: string; free: number; start: number; premium: number }[];
      monthly: { label: string; free: number; start: number; premium: number }[];
      yearly: { label: string; free: number; start: number; premium: number }[];
    };
    performance: PlanPerformanceRow[];
  };
};

const toPlanForm = (plan: AdminPlanConfig): PlanFormState => ({
  name: plan.name,
  description: plan.description,
  monthlyPrice: String(plan.monthlyPrice),
  annualDiscountPercent: String(plan.annualDiscountPercent),
  trialDays: String(plan.trialDays),
  resumeAnalysisLimit: String(plan.resumeAnalysisLimit ?? ""),
  resumeAnalysisUnlimited: plan.resumeAnalysisLimit == null,
  aiQuestionLimit: String(plan.aiQuestionLimit ?? ""),
  aiQuestionUnlimited: plan.aiQuestionLimit == null,
  mockInterviewLimit: String(plan.mockInterviewLimit ?? ""),
  mockInterviewUnlimited: plan.mockInterviewLimit == null,
  aiQuizLimit: String(plan.aiQuizLimit ?? ""),
  aiQuizUnlimited: plan.aiQuizLimit == null,
  isActive: plan.isActive,
});

export function PlanManagementClient({ initialData }: PlanManagementClientProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<AdminPlanConfig[]>(initialData.configs);
  const [searchTerm, setSearchTerm] = useState("");
  const [pricingPlanKey, setPricingPlanKey] = useState(initialData.configs[0]?.key ?? "");
  const [featurePlanKey, setFeaturePlanKey] = useState(initialData.configs[0]?.key ?? "");
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingFeatureId, setSavingFeatureId] = useState<string | null>(null);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState({
    label: "",
    description: "",
    isEnabled: true,
  });

  const [growthFilter, setGrowthFilter] = useState<"Daily" | "Monthly" | "Yearly">("Daily");
  const [chartHoveredIndex, setChartHoveredIndex] = useState<number | null>(null);

  const pricingPlan = useMemo(
    () => plans.find((p) => p.key === pricingPlanKey) ?? plans[0],
    [plans, pricingPlanKey]
  );

  const featurePlan = useMemo(
    () => plans.find((p) => p.key === featurePlanKey) ?? plans[0],
    [plans, featurePlanKey]
  );

  const filteredGrowthData = useMemo(() => {
    if (growthFilter === "Monthly") {
      return initialData.growth.monthly;
    }
    if (growthFilter === "Yearly") {
      return initialData.growth.yearly;
    }
    return initialData.growth.daily;
  }, [growthFilter, initialData.growth]);

  const [planForm, setPlanForm] = useState<PlanFormState | null>(
    pricingPlan ? toPlanForm(pricingPlan) : null
  );

  useEffect(() => {
    if (pricingPlan) setPlanForm(toPlanForm(pricingPlan));
  }, [pricingPlan]);

  // Filter plans / features based on search input
  const filteredPlans = useMemo(() => {
    if (!searchTerm.trim()) return plans;
    const term = searchTerm.toLowerCase();
    return plans.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.features.some((f) => f.label.toLowerCase().includes(term))
    );
  }, [plans, searchTerm]);

  async function refreshPlans() {
    const response = await fetch("/api/admin/plans");
    if (!response.ok) throw new Error("Failed to refresh plans");
    const data = await response.json();
    setPlans(data.configs ?? []);
    router.refresh();
  }

  async function savePlan() {
    if (!pricingPlan || !planForm) return;
    setSavingPlan(true);

    try {
      const response = await fetch(`/api/admin/plans/${pricingPlan.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planForm.name,
          description: planForm.description,
          monthlyPrice: Number(planForm.monthlyPrice),
          annualDiscountPercent: Number(planForm.annualDiscountPercent),
          trialDays: Number(planForm.trialDays),
          resumeAnalysisLimit: planForm.resumeAnalysisUnlimited
            ? null
            : Number(planForm.resumeAnalysisLimit),
          aiQuestionLimit: planForm.aiQuestionUnlimited
            ? null
            : Number(planForm.aiQuestionLimit),
          mockInterviewLimit: planForm.mockInterviewUnlimited
            ? null
            : Number(planForm.mockInterviewLimit),
          aiQuizLimit: planForm.aiQuizUnlimited
            ? null
            : Number(planForm.aiQuizLimit),
          isActive: planForm.isActive,
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      await refreshPlans();
      toast.success("Đã cập nhật cấu hình gói");
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật cấu hình gói");
    } finally {
      setSavingPlan(false);
    }
  }

  async function togglePlanActive(planKey: string, currentStatus: boolean) {
    try {
      const targetPlan = plans.find((p) => p.key === planKey);
      if (!targetPlan) return;

      const response = await fetch(`/api/admin/plans/${planKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: targetPlan.name,
          description: targetPlan.description,
          monthlyPrice: targetPlan.monthlyPrice,
          annualDiscountPercent: targetPlan.annualDiscountPercent,
          trialDays: targetPlan.trialDays,
          resumeAnalysisLimit: targetPlan.resumeAnalysisLimit,
          aiQuestionLimit: targetPlan.aiQuestionLimit,
          mockInterviewLimit: targetPlan.mockInterviewLimit,
          aiQuizLimit: targetPlan.aiQuizLimit,
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      await refreshPlans();
      toast.success(`Đã ${!currentStatus ? "bật" : "ẩn"} gói thành công`);
    } catch (error) {
      console.error(error);
      toast.error("Không thể thay đổi trạng thái gói");
    }
  }

  async function addFeature() {
    if (!featurePlan || newFeature.label.trim().length === 0) return;
    setSavingFeatureId("new");

    try {
      const response = await fetch(`/api/admin/plans/${featurePlan.key}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFeature),
      });

      if (!response.ok) throw new Error(await response.text());
      setNewFeature({ label: "", description: "", isEnabled: true });
      await refreshPlans();
      toast.success("Đã thêm tính năng mới");
    } catch (error) {
      console.error(error);
      toast.error("Không thể thêm tính năng");
    } finally {
      setSavingFeatureId(null);
    }
  }

  async function saveFeature(feature: AdminPlanFeature) {
    setSavingFeatureId(feature.id);

    try {
      const response = await fetch(`/api/admin/plan-features/${feature.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: feature.label,
          description: feature.description ?? "",
          isEnabled: feature.isEnabled,
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      await refreshPlans();
      toast.success("Đã lưu tính năng");
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu tính năng");
    } finally {
      setSavingFeatureId(null);
    }
  }

  async function deleteFeature(featureId: string) {
    if (!confirm("Xóa tính năng này khỏi gói?")) return;
    setSavingFeatureId(featureId);

    try {
      const response = await fetch(`/api/admin/plan-features/${featureId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(await response.text());
      await refreshPlans();
      toast.success("Đã xóa tính năng");
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa tính năng");
    } finally {
      setSavingFeatureId(null);
    }
  }

  function updateLocalFeature(featureId: string, patch: Partial<AdminPlanFeature>) {
    setPlans((prev) =>
      prev.map((plan) => ({
        ...plan,
        features: plan.features.map((feature) =>
          feature.id === featureId ? { ...feature, ...patch } : feature
        ),
      }))
    );
  }

  // Handle Export plans config
  const handleExport = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(plans, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", "nextstep_subscription_configs.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Đã xuất cấu hình thành công");
    } catch {
      toast.error("Không thể xuất cấu hình");
    }
  };

  // Conic-gradient for Doughnut chart based on real distribution data
  const chartGradient = useMemo(() => {
    const total = initialData.distribution.total;
    if (total === 0) return "conic-gradient(#e2e8f0 0% 100%)";

    const freeCount = initialData.distribution.items.find((i) => i.label === "Free")?.count ?? 0;
    const startCount = initialData.distribution.items.find((i) => i.label === "Start")?.count ?? 0;
    const premiumCount = initialData.distribution.items.find((i) => i.label === "Premium")?.count ?? 0;

    const premiumPercent = (premiumCount / total) * 100;
    const startPercent = (startCount / total) * 100;

    return `conic-gradient(
      #a855f7 0% ${premiumPercent}%,
      #3b82f6 ${premiumPercent}% ${premiumPercent + startPercent}%,
      #64748b ${premiumPercent + startPercent}% 100%
    )`;
  }, [initialData.distribution]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Quản lý gói mua
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Quản lý gói dịch vụ, tính năng, giới hạn sử dụng và hiệu suất đăng ký của nền tảng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Tìm kiếm gói, tính năng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 pl-9.5 bg-zinc-50/55 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-full h-10 focus-visible:ring-1 focus-visible:ring-red-500/20 text-sm"
            />
          </div>
        </div>
      </section>

      {/* 2. Subscription Overview */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Subscribers */}
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Tổng đăng ký
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {initialData.stats.totalSubscribers.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Free Users */}
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Người dùng Free
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {initialData.stats.freeUsers.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/20 rounded-lg text-slate-500 dark:text-slate-400">
              <User className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Starter Users */}
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-500 uppercase tracking-wider">
                Người dùng Starter
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {initialData.stats.startUsers.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-55 dark:bg-blue-955/20 rounded-lg text-blue-600 dark:text-blue-450">
              <Rocket className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Premium Users */}
        <Card className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-500 uppercase tracking-wider">
                Người dùng Premium
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {initialData.stats.premiumUsers.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-955/20 rounded-lg text-purple-600 dark:text-purple-400">
              <Gem className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Analytics Section */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.9fr] gap-6">
        {/* Plan Distribution Chart */}
        <Card className="rounded-2xl border border-slate-150/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Phân bố gói
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center py-2">
              <div
                className="relative flex h-36 w-36 items-center justify-center rounded-full transition-transform hover:scale-102"
                style={{ background: chartGradient }}
              >
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white dark:bg-zinc-900 shadow-2xs border border-zinc-50 dark:border-zinc-800/50">
                  <div className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {initialData.distribution.total.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 tracking-wider">
                    USER ĐĂNG KÝ
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              {initialData.distribution.items.map((item, index) => {
                const colors = ["bg-slate-400", "bg-blue-500", "bg-purple-500"];
                const textColors = ["text-slate-500", "text-blue-500", "text-purple-500"];
                return (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("h-3 w-3 rounded-full shrink-0", colors[index])} />
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {item.label}
                      </span>
                      <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-800", textColors[index])}>
                        {item.value}%
                      </span>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">
                      {item.count.toLocaleString("vi-VN")} người dùng
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Growth Trend */}
        <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-xs backdrop-blur-xs flex flex-col">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-6">
            <div>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <LineChart className="h-4.5 w-4.5 text-[#b30000]" />
                Xu hướng đăng ký
              </CardTitle>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                {growthFilter === "Daily" && "Hiển thị số lượng đăng ký theo ngày."}
                {growthFilter === "Monthly" && "Hiển thị số lượng đăng ký theo tháng."}
                {growthFilter === "Yearly" && "Hiển thị số lượng đăng ký theo năm."}
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.75">
              {(["Daily", "Monthly", "Yearly"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setGrowthFilter(filter);
                    setChartHoveredIndex(null);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    growthFilter === filter
                      ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[280px]">
            {filteredGrowthData && filteredGrowthData.length > 0 ? (
              <div className="relative w-full h-[280px] rounded-xl border border-zinc-100/80 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-900/30 p-5 flex flex-col justify-between">
                {/* SVG Multi-Line / Area chart */}
                <div className="relative flex-1">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="free-area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#64748b" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#64748b" stopOpacity="0.00" />
                      </linearGradient>
                      <linearGradient id="start-area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                      </linearGradient>
                      <linearGradient id="premium-area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid Lines */}
                    <line x1="0" y1="36" x2="500" y2="36" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                    <line x1="0" y1="72" x2="500" y2="72" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                    <line x1="0" y1="108" x2="500" y2="108" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                    <line x1="0" y1="144" x2="500" y2="144" stroke="currentColor" strokeOpacity="0.04" strokeDasharray="3" className="text-zinc-500" />
                    <line x1="0" y1="180" x2="500" y2="180" stroke="currentColor" strokeOpacity="0.08" className="text-zinc-500" />

                    {(() => {
                      const maxVal = Math.max(1, ...filteredGrowthData.map(p => Math.max(p.free, p.start, p.premium)));
                      
                      const freePoints = filteredGrowthData.map((item, idx) => {
                        const x = (idx / Math.max(1, filteredGrowthData.length - 1)) * 480 + 10;
                        const y = 165 - (item.free / maxVal) * 140;
                        return { x, y, val: item.free, idx };
                      });

                      const startPoints = filteredGrowthData.map((item, idx) => {
                        const x = (idx / Math.max(1, filteredGrowthData.length - 1)) * 480 + 10;
                        const y = 165 - (item.start / maxVal) * 140;
                        return { x, y, val: item.start, idx };
                      });

                      const premiumPoints = filteredGrowthData.map((item, idx) => {
                        const x = (idx / Math.max(1, filteredGrowthData.length - 1)) * 480 + 10;
                        const y = 165 - (item.premium / maxVal) * 140;
                        return { x, y, val: item.premium, idx };
                      });

                      const getCurvePath = (pts: { x: number; y: number }[]) => {
                        if (pts.length === 0) return "";
                        let path = `M ${pts[0].x} ${pts[0].y}`;
                        for (let i = 0; i < pts.length - 1; i++) {
                          const p0 = pts[i];
                          const p1 = pts[i + 1];
                          // Tension points for S-curve smoothing
                          const cp1x = p0.x + (p1.x - p0.x) / 3;
                          const cp1y = p0.y;
                          const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
                          const cp2y = p1.y;
                          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                        }
                        return path;
                      };

                      const freePathD = getCurvePath(freePoints);
                      const freeAreaD = freePathD ? `${freePathD} L ${freePoints[freePoints.length - 1].x} 180 L ${freePoints[0].x} 180 Z` : "";

                      const startPathD = getCurvePath(startPoints);
                      const startAreaD = startPathD ? `${startPathD} L ${startPoints[startPoints.length - 1].x} 180 L ${startPoints[0].x} 180 Z` : "";

                      const premiumPathD = getCurvePath(premiumPoints);
                      const premiumAreaD = premiumPathD ? `${premiumPathD} L ${premiumPoints[premiumPoints.length - 1].x} 180 L ${premiumPoints[0].x} 180 Z` : "";

                      return (
                        <>
                          {/* Area Gradients */}
                          <path d={freeAreaD} fill="url(#free-area-gradient)" />
                          <path d={startAreaD} fill="url(#start-area-gradient)" />
                          <path d={premiumAreaD} fill="url(#premium-area-gradient)" />
                          
                          {/* Lines */}
                          <path d={freePathD} fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d={startPathD} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d={premiumPathD} fill="none" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

                          {/* Hover Guide Lines */}
                          {filteredGrowthData.map((item, idx) => {
                            const x = (idx / Math.max(1, filteredGrowthData.length - 1)) * 480 + 10;
                            return (
                              <g key={idx}>
                                {chartHoveredIndex === idx && (
                                  <line
                                    x1={x}
                                    y1={10}
                                    x2={x}
                                    y2={180}
                                    stroke="#cbd5e1"
                                    strokeOpacity="0.6"
                                    strokeWidth="1"
                                    strokeDasharray="3"
                                  />
                                )}
                                <rect
                                  x={x - 20}
                                  y={0}
                                  width={40}
                                  height={180}
                                  fill="transparent"
                                  className="cursor-pointer"
                                  onMouseEnter={() => setChartHoveredIndex(idx)}
                                  onMouseLeave={() => setChartHoveredIndex(null)}
                                />
                              </g>
                            );
                          })}

                          {/* Dots */}
                          {filteredGrowthData.map((item, idx) => {
                            const showActiveDot = chartHoveredIndex === idx;
                            const fp = freePoints[idx];
                            const sp = startPoints[idx];
                            const pp = premiumPoints[idx];

                            return (
                              <g key={idx} className="pointer-events-none">
                                {/* Free Dot */}
                                <circle
                                  cx={fp.x}
                                  cy={fp.y}
                                  r={showActiveDot ? 5 : 3.5}
                                  className={cn("fill-white stroke-[#64748b] stroke-2 transition-all", showActiveDot && "fill-[#64748b]")}
                                />
                                {/* Start Dot */}
                                <circle
                                  cx={sp.x}
                                  cy={sp.y}
                                  r={showActiveDot ? 5 : 3.5}
                                  className={cn("fill-white stroke-[#3b82f6] stroke-2 transition-all", showActiveDot && "fill-[#3b82f6]")}
                                />
                                {/* Premium Dot */}
                                <circle
                                  cx={pp.x}
                                  cy={pp.y}
                                  r={showActiveDot ? 5 : 3.5}
                                  className={cn("fill-white stroke-[#a855f7] stroke-2 transition-all", showActiveDot && "fill-[#a855f7]")}
                                />
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* X Axis labels */}
                <div className="flex justify-between mt-3 px-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 select-none">
                  {filteredGrowthData.map((item, index) => (
                    <span key={item.label} className="text-center flex-1">
                      {item.label}
                    </span>
                  ))}
                </div>

                {/* Legend displaying tier indicator colors */}
                <div className="flex items-center justify-center gap-4 mt-2 text-xs font-semibold text-zinc-500 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                    <span>Free</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span>Starter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                    <span>Premium</span>
                  </div>
                </div>

                {/* Custom floating tooltip with multi-tier details */}
                {chartHoveredIndex !== null && filteredGrowthData[chartHoveredIndex] && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 text-[10px] font-bold py-1.5 px-3 rounded-xl shadow-md pointer-events-none z-20 flex items-center gap-2.5">
                    <span className="font-extrabold text-[11px] border-r border-zinc-700/50 pr-2 mr-0.5">{filteredGrowthData[chartHoveredIndex].label}</span>
                    <span className="text-slate-400 dark:text-slate-500">Free: <strong className="text-white dark:text-zinc-950 font-extrabold">{filteredGrowthData[chartHoveredIndex].free}</strong></span>
                    <span className="text-blue-400 dark:text-blue-600">Starter: <strong className="text-white dark:text-zinc-950 font-extrabold">{filteredGrowthData[chartHoveredIndex].start}</strong></span>
                    <span className="text-purple-400 dark:text-purple-650">Premium: <strong className="text-white dark:text-zinc-950 font-extrabold">{filteredGrowthData[chartHoveredIndex].premium}</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-full text-zinc-400">
                  <Activity className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">Không có dữ liệu lịch sử</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                    Chưa có đủ dữ liệu để phân tích xu hướng đăng ký.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 4. Package Performance Table */}
      <section>
        <Card className="rounded-2xl border border-slate-150/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Hiệu suất gói dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] table-auto text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-800/10">
                    <th className="px-6 py-4">Package</th>
                    <th className="px-6 py-4">Active Users</th>
                    <th className="px-6 py-4">Revenue</th>
                    <th className="px-6 py-4">Conversion Rate</th>
                    <th className="px-6 py-4">Retention Rate</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
                  {filteredPlans.map((plan) => {
                    // Find matching metrics from initialData.performance or default
                    const perf = initialData.performance.find(
                      (p) => p.plan.toLowerCase() === plan.name.toLowerCase()
                    );
                    const activeCount = perf ? perf.activeUsers : 0;
                    const revenueStr = perf ? perf.revenue : "N/A";
                    const conversionStr = perf ? perf.conversion : "N/A";
                    const retentionStr = perf ? `${perf.retention}%` : "N/A";

                    return (
                      <tr
                        key={plan.id}
                        className="group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                                plan.key === "premium"
                                  ? "bg-purple-50 dark:bg-purple-950/20 text-purple-600"
                                  : plan.key === "start"
                                  ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              )}
                            >
                              {plan.key === "premium" ? (
                                <Gem className="h-4.5 w-4.5" />
                              ) : plan.key === "start" ? (
                                <Rocket className="h-4.5 w-4.5" />
                              ) : (
                                <User className="h-4.5 w-4.5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-900 dark:text-zinc-150">
                                  {plan.name}
                                </span>
                                <Badge
                                  className={cn(
                                    "font-semibold text-[10px] px-2 py-0.5 rounded-full shrink-0 border shadow-3xs",
                                    plan.isActive
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-150/40"
                                      : "bg-zinc-50 text-zinc-500 border-zinc-200"
                                  )}
                                >
                                  {plan.isActive ? "Đang bán" : "Tạm ẩn"}
                                </Badge>
                              </div>
                              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 max-w-[240px] truncate">
                                {plan.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-850 dark:text-zinc-300">
                          {activeCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-850 dark:text-zinc-300">
                          {revenueStr}
                        </td>
                        <td className="px-6 py-4">
                          {conversionStr !== "N/A" ? (
                            <Badge className="bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 font-bold text-xs rounded shadow-3xs">
                              {conversionStr}
                            </Badge>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {retentionStr !== "N/A" ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-750 dark:text-zinc-300">
                                {retentionStr}
                              </span>
                              <div className="w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#b30000] h-full"
                                  style={{ width: retentionStr }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                              >
                                <MoreHorizontal className="h-4.5 w-4.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-40 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-800 p-1 bg-white dark:bg-zinc-900"
                            >
                              <DropdownMenuItem
                                onClick={() => {
                                  setPricingPlanKey(plan.key);
                                  setFeaturePlanKey(plan.key);
                                  document
                                    .getElementById("config-engines")
                                    ?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="rounded-lg text-zinc-700 dark:text-zinc-300 gap-2 font-medium cursor-pointer"
                              >
                                <Edit className="h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => togglePlanActive(plan.key, plan.isActive)}
                                className="rounded-lg text-zinc-700 dark:text-zinc-300 gap-2 font-medium cursor-pointer"
                              >
                                {plan.isActive ? (
                                  <>
                                    <EyeOff className="h-4 w-4 text-zinc-400" />
                                    Ẩn gói
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 text-emerald-500" />
                                    Bật gói
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  toast.error("Chức năng xóa gói cấu hình chưa được hỗ trợ ở backend.");
                                }}
                                className="rounded-lg text-red-655 focus:bg-red-50 dark:focus:bg-red-950/20 gap-2 font-medium cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                                Xóa gói
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. Feature Allocation & 6. Pricing Engine Forms */}
      <section id="config-engines" className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Feature Allocation */}
        <Card className="rounded-2xl border border-slate-150/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs">
          <CardHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between gap-4 py-3">
            <div>
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Feature Allocation
              </CardTitle>
            </div>
            <Select value={featurePlanKey} onValueChange={setFeaturePlanKey}>
              <SelectTrigger className="w-32 rounded-xl border-zinc-200 dark:border-zinc-700 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {plans.map((plan) => (
                  <SelectItem key={plan.key} value={plan.key} className="text-xs">
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3">
            {/* Compact feature list layout */}
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
              {featurePlan?.features.map((feature) => (
                <div
                  key={feature.id}
                  className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/10 dark:bg-zinc-900 p-2 flex items-center justify-between gap-3 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={feature.isEnabled}
                      onChange={(event) =>
                        updateLocalFeature(feature.id, {
                          isEnabled: event.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded text-[#b30000] focus:ring-[#b30000]/20 border-zinc-300 dark:border-zinc-700 shrink-0 cursor-pointer"
                    />
                    
                    {editingFeatureId === feature.id ? (
                      <div className="flex-1 flex flex-col gap-1.5">
                        <Input
                          value={feature.label}
                          onChange={(event) =>
                            updateLocalFeature(feature.id, {
                              label: event.target.value,
                            })
                          }
                          className="font-bold text-zinc-900 dark:text-zinc-200 h-7 rounded text-xs px-2"
                        />
                        <Input
                          value={feature.description ?? ""}
                          placeholder="Mô tả / Giới hạn..."
                          onChange={(event) =>
                            updateLocalFeature(feature.id, {
                              description: event.target.value,
                            })
                          }
                          className="text-[11px] text-zinc-400 dark:text-zinc-500 h-6 rounded px-2"
                        />
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <span className={cn(
                          "font-semibold text-xs block",
                          feature.isEnabled ? "text-zinc-900 dark:text-zinc-150" : "text-zinc-450 line-through"
                        )}>
                          {feature.label}
                        </span>
                        {feature.description && (
                          <span className="text-[11px] text-zinc-400 block truncate">
                            {feature.description}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1 shrink-0">
                    {editingFeatureId === feature.id ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          onClick={async () => {
                            await saveFeature(feature);
                            setEditingFeatureId(null);
                          }}
                          disabled={savingFeatureId === feature.id}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded text-zinc-450 hover:bg-zinc-100"
                          onClick={() => {
                            setEditingFeatureId(null);
                            refreshPlans();
                          }}
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                          onClick={() => setEditingFeatureId(feature.id)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => deleteFeature(feature.id)}
                          disabled={savingFeatureId === feature.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add feature wrapper */}
            <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-2.5 space-y-2 bg-zinc-50/10">
              <div className="flex gap-2">
                <Input
                  value={newFeature.label}
                  onChange={(event) =>
                    setNewFeature((prev) => ({ ...prev, label: event.target.value }))
                  }
                  placeholder="Tên tính năng mới"
                  className="rounded-md h-7 text-xs flex-1"
                />
                <Input
                  value={newFeature.description}
                  onChange={(event) =>
                    setNewFeature((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Mô tả / Giới hạn"
                  className="rounded-md h-7 text-xs flex-1"
                />
                <Button
                  size="sm"
                  className="rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold h-7 px-3 shrink-0"
                  onClick={addFeature}
                  disabled={savingFeatureId === "new"}
                >
                  Thêm
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Engine */}
        <Card className="rounded-2xl border border-slate-150/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs">
          <CardHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between gap-4 py-3">
            <div>
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Pricing Engine
              </CardTitle>
            </div>
            <Select value={pricingPlanKey} onValueChange={setPricingPlanKey}>
              <SelectTrigger className="w-32 rounded-xl border-zinc-200 dark:border-zinc-700 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {plans.map((plan) => (
                  <SelectItem key={plan.key} value={plan.key} className="text-xs">
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3.5">
            {pricingPlan && planForm && (
              <div className="space-y-3.5">
                {/* 1. Basic Info inline grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="grid gap-1">
                    <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Tên gói
                    </Label>
                    <Input
                      value={planForm.name}
                      onChange={(event) =>
                        setPlanForm((prev) =>
                          prev ? { ...prev, name: event.target.value } : prev
                        )
                      }
                      className="rounded-md h-8 text-xs"
                    />
                  </div>
                  <div className="grid gap-1 sm:col-span-2">
                    <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Mô tả gói
                    </Label>
                    <Input
                      value={planForm.description}
                      onChange={(event) =>
                        setPlanForm((prev) =>
                          prev ? { ...prev, description: event.target.value } : prev
                        )
                      }
                      className="rounded-md h-8 text-xs"
                    />
                  </div>
                </div>

                {/* 2. Pricing & Term inline grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="grid gap-1">
                    <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Giá tháng (VNĐ)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={planForm.monthlyPrice}
                      onChange={(event) =>
                        setPlanForm((prev) =>
                          prev ? { ...prev, monthlyPrice: event.target.value } : prev
                        )
                      }
                      className="rounded-md h-8 text-xs"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Giảm giá năm (%)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={planForm.annualDiscountPercent}
                      onChange={(event) =>
                        setPlanForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                annualDiscountPercent: event.target.value,
                              }
                            : prev
                        )
                      }
                      className="rounded-md h-8 text-xs"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Dùng thử (Ngày)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={planForm.trialDays}
                      onChange={(event) =>
                        setPlanForm((prev) =>
                          prev ? { ...prev, trialDays: event.target.value } : prev
                        )
                      }
                      className="rounded-md h-8 text-xs"
                    />
                  </div>
                </div>

                {/* 3. Usage Limits grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <UsageLimitInput
                    label="CV Analysis/Tháng"
                    value={planForm.resumeAnalysisLimit}
                    unlimited={planForm.resumeAnalysisUnlimited}
                    onValueChange={(value) =>
                      setPlanForm((prev) =>
                        prev ? { ...prev, resumeAnalysisLimit: value } : prev
                      )
                    }
                    onUnlimitedChange={(checked) =>
                      setPlanForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              resumeAnalysisUnlimited: checked,
                              resumeAnalysisLimit: checked ? "" : prev.resumeAnalysisLimit,
                            }
                          : prev
                      )
                    }
                  />

                  <UsageLimitInput
                    label="AI Qs/Tháng"
                    value={planForm.aiQuestionLimit}
                    unlimited={planForm.aiQuestionUnlimited}
                    onValueChange={(value) =>
                      setPlanForm((prev) =>
                        prev ? { ...prev, aiQuestionLimit: value } : prev
                      )
                    }
                    onUnlimitedChange={(checked) =>
                      setPlanForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              aiQuestionUnlimited: checked,
                              aiQuestionLimit: checked ? "" : prev.aiQuestionLimit,
                            }
                          : prev
                      )
                    }
                  />

                  <UsageLimitInput
                    label="Mock Interviews"
                    value={planForm.mockInterviewLimit}
                    unlimited={planForm.mockInterviewUnlimited}
                    onValueChange={(value) =>
                      setPlanForm((prev) =>
                        prev ? { ...prev, mockInterviewLimit: value } : prev
                      )
                    }
                    onUnlimitedChange={(checked) =>
                      setPlanForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              mockInterviewUnlimited: checked,
                              mockInterviewLimit: checked ? "" : prev.mockInterviewLimit,
                            }
                          : prev
                      )
                    }
                  />

                  <UsageLimitInput
                    label="AI Quizzes"
                    value={planForm.aiQuizLimit}
                    unlimited={planForm.aiQuizUnlimited}
                    onValueChange={(value) =>
                      setPlanForm((prev) =>
                        prev ? { ...prev, aiQuizLimit: value } : prev
                      )
                    }
                    onUnlimitedChange={(checked) =>
                      setPlanForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              aiQuizUnlimited: checked,
                              aiQuizLimit: checked ? "" : prev.aiQuizLimit,
                            }
                          : prev
                      )
                    }
                  />
                </div>

                {/* 4. Active Switch and Save button inline */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-zinc-50/20 dark:bg-zinc-800/10 rounded-lg border border-zinc-100 dark:border-zinc-850">
                  <label className="flex items-center gap-2 text-xs text-zinc-550 dark:text-zinc-400 cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={planForm.isActive}
                      onChange={(event) =>
                        setPlanForm((prev) =>
                          prev ? { ...prev, isActive: event.target.checked } : prev
                        )
                      }
                      className="h-4.5 w-4.5 rounded text-[#b30000] focus:ring-[#b30000]/20 border-zinc-300 dark:border-zinc-700"
                    />
                    <span>Kích hoạt và bán gói dịch vụ</span>
                  </label>

                  <Button
                    onClick={savePlan}
                    disabled={savingPlan}
                    className="bg-[#b30000] hover:bg-[#b30000]/95 text-white font-semibold rounded-lg h-8 px-4 text-xs gap-1.5 transition-colors shadow-xs ml-auto"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Lưu cấu hình
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function UsageLimitInput({
  label,
  value,
  unlimited,
  onValueChange,
  onUnlimitedChange,
}: {
  label: string;
  value: string;
  unlimited: boolean;
  onValueChange: (value: string) => void;
  onUnlimitedChange: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider truncate block">
        {label}
      </Label>
      <div className="relative">
        <Input
          type="number"
          min={0}
          value={unlimited ? "" : value}
          disabled={unlimited}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Unlimited"
          className="rounded-md h-7.5 text-xs px-2"
        />
      </div>
      <label className="flex items-center gap-1 text-[10px] text-zinc-450 dark:text-zinc-500 cursor-pointer w-fit select-none">
        <input
          type="checkbox"
          checked={unlimited}
          onChange={(event) => onUnlimitedChange(event.target.checked)}
          className="h-3 w-3 rounded text-[#b30000] focus:ring-[#b30000]/20 border-zinc-300 dark:border-zinc-700"
        />
        <span>Vô hạn</span>
      </label>
    </div>
  );
}

