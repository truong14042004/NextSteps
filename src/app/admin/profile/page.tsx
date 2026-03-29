import React from "react";
import { ShieldCheck, UserCircle2, KeyRound, BadgeCheck } from "lucide-react";
import { AdminProfileCard } from "@/components/admin/profile/AdminProfileCard";
import { AdminPermissionsCard } from "@/components/admin/profile/AdminPermissionsCard";
import { AdminSecurityCard } from "@/components/admin/profile/AdminSecurityCard";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";

function OverviewCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-3xl border-border/60 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminProfilePage() {
  const { user } = await getCurrentUser({ allData: true });
  const name = (user as any)?.fullName || (user as any)?.firstName || "Admin";
  const imageUrl = (user as any)?.imageUrl || "/avatar.png";

  return (
    <div className="min-h-0 bg-background">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <section className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              Admin Workspace
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Hồ sơ Quản trị
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quản lý thông tin cá nhân, phân quyền và cài đặt bảo mật của
                  tài khoản quản trị.
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <AdminProfileCard user={{ name, imageUrl }} />
              <AdminPermissionsCard />
            </div>

            <div className="space-y-6">
              <AdminSecurityCard />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
