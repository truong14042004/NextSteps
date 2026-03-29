import type { ReactNode } from "react";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userContext = await getCurrentUser();
  const user = userContext?.user
    ? { name: userContext.user.name, imageUrl: userContext.user.imageUrl }
    : { name: "Admin", imageUrl: "" };

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      <div className="flex flex-1 flex-col min-h-0">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-auto min-h-0 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
