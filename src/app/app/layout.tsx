import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Navbar } from "./_Navbar";
import { Sidebar } from "./_Sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { userId, user, redirectToSignIn } = await getCurrentUser({
    allData: true,
  });

  if (userId == null) return redirectToSignIn();
  if (user == null) return redirect("/sign-up");

  // Nếu user có role admin => chuyển tới dashboard admin
  // Hỗ trợ nhiều thuộc tính có thể lưu role (publicMetadata, role, isAdmin)
  const isAdmin =
    (user as any)?.publicMetadata?.role === "admin" ||
    (user as any)?.role === "admin" ||
    (user as any)?.isAdmin === true;

  if (isAdmin) return redirect("/admin");

  return (
    // root provides viewport height; child pages must NOT use min-h-screen
    <div className="min-h-screen flex bg-background">
      {/* Sidebar is fixed per-viewport (sticky + h-screen) */}
      <Sidebar />

      {/* Right column: header + main (ONLY main scrolls) */}
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <Navbar user={user} />

        {/* Main is the only scrolling container. keep min-h-0 so children don't force extra height */}
        <main className="flex-1 overflow-auto min-h-0">{children}</main>
      </div>
    </div>
  );
}
