import React from "react";
import { requireAdminForPage } from "@/features/admin/auth";
import AdminProfileClient from "./AdminProfileClient";

export default async function AdminProfilePage() {
  const { user } = await requireAdminForPage();

  return (
    <div className="min-h-0 bg-background">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <AdminProfileClient
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              imageUrl: user.imageUrl,
              role: user.role,
            }}
          />
        </div>
      </main>
    </div>
  );
}
