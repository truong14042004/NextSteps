"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Save, SlidersHorizontal, Trash2, WalletCards } from "lucide-react";
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
  isActive: boolean;
  sortOrder: number;
  features: AdminPlanFeature[];
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
  isActive: boolean;
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
  isActive: plan.isActive,
});

export function AdminPlanManager({
  initialPlans,
}: {
  initialPlans: AdminPlanConfig[];
}) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [pricingPlanKey, setPricingPlanKey] = useState(initialPlans[0]?.key ?? "");
  const [featurePlanKey, setFeaturePlanKey] = useState(initialPlans[0]?.key ?? "");
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingFeatureId, setSavingFeatureId] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState({
    label: "",
    description: "",
    isEnabled: true,
  });

  const pricingPlan = useMemo(
    () => plans.find(plan => plan.key === pricingPlanKey) ?? plans[0],
    [plans, pricingPlanKey],
  );
  const featurePlan = useMemo(
    () => plans.find(plan => plan.key === featurePlanKey) ?? plans[0],
    [plans, featurePlanKey],
  );
  const [planForm, setPlanForm] = useState<PlanFormState | null>(
    pricingPlan ? toPlanForm(pricingPlan) : null,
  );

  useEffect(() => {
    if (pricingPlan) setPlanForm(toPlanForm(pricingPlan));
  }, [pricingPlan]);

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
          isActive: planForm.isActive,
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      await refreshPlans();
      toast.success("Đã cập nhật gói");
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật gói");
    } finally {
      setSavingPlan(false);
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
      toast.success("Đã thêm tính năng");
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

  function updateLocalFeature(
    featureId: string,
    patch: Partial<AdminPlanFeature>,
  ) {
    setPlans(prev =>
      prev.map(plan => ({
        ...plan,
        features: plan.features.map(feature =>
          feature.id === featureId ? { ...feature, ...patch } : feature,
        ),
      })),
    );
  }

  if (plans.length === 0) {
    return (
      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Chưa có cấu hình gói. Chạy migration để tạo dữ liệu mặc định.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Feature Allocation
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Thêm, sửa, bật hoặc tắt tính năng theo từng gói.
            </p>
          </div>
          <Select value={featurePlanKey} onValueChange={setFeaturePlanKey}>
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans.map(plan => (
                <SelectItem key={plan.key} value={plan.key}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {featurePlan?.features.map(feature => (
              <div
                key={feature.id}
                className="rounded-2xl border bg-background p-4"
              >
                <div className="flex items-start gap-3">
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={feature.isEnabled}
                      onChange={event =>
                        updateLocalFeature(feature.id, {
                          isEnabled: event.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <span className="sr-only">Bật tính năng</span>
                  </label>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      value={feature.label}
                      onChange={event =>
                        updateLocalFeature(feature.id, {
                          label: event.target.value,
                        })
                      }
                      className="font-medium"
                    />
                    <Textarea
                      value={feature.description ?? ""}
                      onChange={event =>
                        updateLocalFeature(feature.id, {
                          description: event.target.value,
                        })
                      }
                      className="min-h-20"
                    />
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => saveFeature(feature)}
                      disabled={savingFeatureId === feature.id}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-xl text-red-600 hover:text-red-700"
                      onClick={() => deleteFeature(feature.id)}
                      disabled={savingFeatureId === feature.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-dashed p-4">
            <div className="grid gap-3">
              <Input
                value={newFeature.label}
                onChange={event =>
                  setNewFeature(prev => ({ ...prev, label: event.target.value }))
                }
                placeholder="Tên tính năng mới"
              />
              <Textarea
                value={newFeature.description}
                onChange={event =>
                  setNewFeature(prev => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Mô tả ngắn"
              />
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newFeature.isEnabled}
                    onChange={event =>
                      setNewFeature(prev => ({
                        ...prev,
                        isEnabled: event.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  Bật ngay
                </label>
                <Button
                  className="rounded-xl"
                  onClick={addFeature}
                  disabled={savingFeatureId === "new"}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm tính năng
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <WalletCards className="h-5 w-5 text-primary" />
              Pricing Engine
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Điều chỉnh giá, giảm giá năm, trial và trạng thái gói.
            </p>
          </div>
          <Select value={pricingPlanKey} onValueChange={setPricingPlanKey}>
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans.map(plan => (
                <SelectItem key={plan.key} value={plan.key}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="space-y-5">
          {pricingPlan && planForm && (
            <>
              <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
                <div>
                  <div className="text-sm text-muted-foreground">Gói hiện tại</div>
                  <div className="text-lg font-semibold">{pricingPlan.name}</div>
                </div>
                <Badge variant={planForm.isActive ? "default" : "secondary"}>
                  {planForm.isActive ? "Đang bán" : "Tạm ẩn"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Tên gói</Label>
                  <Input
                    value={planForm.name}
                    onChange={event =>
                      setPlanForm(prev =>
                        prev ? { ...prev, name: event.target.value } : prev,
                      )
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={planForm.description}
                    onChange={event =>
                      setPlanForm(prev =>
                        prev
                          ? { ...prev, description: event.target.value }
                          : prev,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Giá tháng (VNĐ)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={planForm.monthlyPrice}
                    onChange={event =>
                      setPlanForm(prev =>
                        prev
                          ? { ...prev, monthlyPrice: event.target.value }
                          : prev,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Giảm giá năm (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={planForm.annualDiscountPercent}
                    onChange={event =>
                      setPlanForm(prev =>
                        prev
                          ? {
                              ...prev,
                              annualDiscountPercent: event.target.value,
                            }
                          : prev,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trial (ngày)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={planForm.trialDays}
                    onChange={event =>
                      setPlanForm(prev =>
                        prev ? { ...prev, trialDays: event.target.value } : prev,
                      )
                    }
                  />
                </div>

                <UsageLimitInput
                  label="Lượt phân tích CV/tháng"
                  value={planForm.resumeAnalysisLimit}
                  unlimited={planForm.resumeAnalysisUnlimited}
                  onValueChange={value =>
                    setPlanForm(prev =>
                      prev ? { ...prev, resumeAnalysisLimit: value } : prev,
                    )
                  }
                  onUnlimitedChange={checked =>
                    setPlanForm(prev =>
                      prev
                        ? {
                            ...prev,
                            resumeAnalysisUnlimited: checked,
                            resumeAnalysisLimit: checked
                              ? ""
                              : prev.resumeAnalysisLimit,
                          }
                        : prev,
                    )
                  }
                />

                <UsageLimitInput
                  label="Lượt câu hỏi AI/tháng"
                  value={planForm.aiQuestionLimit}
                  unlimited={planForm.aiQuestionUnlimited}
                  onValueChange={value =>
                    setPlanForm(prev =>
                      prev ? { ...prev, aiQuestionLimit: value } : prev,
                    )
                  }
                  onUnlimitedChange={checked =>
                    setPlanForm(prev =>
                      prev
                        ? {
                            ...prev,
                            aiQuestionUnlimited: checked,
                            aiQuestionLimit: checked ? "" : prev.aiQuestionLimit,
                          }
                        : prev,
                    )
                  }
                />

                <UsageLimitInput
                  label="Lượt mock interview/tháng"
                  value={planForm.mockInterviewLimit}
                  unlimited={planForm.mockInterviewUnlimited}
                  onValueChange={value =>
                    setPlanForm(prev =>
                      prev ? { ...prev, mockInterviewLimit: value } : prev,
                    )
                  }
                  onUnlimitedChange={checked =>
                    setPlanForm(prev =>
                      prev
                        ? {
                            ...prev,
                            mockInterviewUnlimited: checked,
                            mockInterviewLimit: checked
                              ? ""
                              : prev.mockInterviewLimit,
                          }
                        : prev,
                    )
                  }
                />

                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={planForm.isActive}
                    onChange={event =>
                      setPlanForm(prev =>
                        prev
                          ? { ...prev, isActive: event.target.checked }
                          : prev,
                      )
                    }
                    className="h-4 w-4"
                  />
                  Cho phép hiển thị và bán gói
                </label>
              </div>

              <div className="flex justify-end">
                <Button
                  className="rounded-xl"
                  onClick={savePlan}
                  disabled={savingPlan}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Lưu cấu hình giá
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
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
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        disabled={unlimited}
        onChange={event => onValueChange(event.target.value)}
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={unlimited}
          onChange={event => onUnlimitedChange(event.target.checked)}
          className="h-3.5 w-3.5"
        />
        Không giới hạn
      </label>
    </div>
  );
}
