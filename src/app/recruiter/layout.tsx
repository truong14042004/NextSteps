import type { ReactNode } from "react";

import { RecruiterHeader } from "@/components/recruiter/recruiter-header";
import { RecruiterSidebar } from "@/components/recruiter/recruiter-sidebar";
import { requireRecruiterForPage } from "@/features/recruiter/auth";

export default async function RecruiterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireRecruiterForPage();

  return (
    <div className="min-h-screen flex bg-background">
      <RecruiterSidebar />

      <div className="flex flex-1 flex-col min-h-0">
        <RecruiterHeader user={{ name: user.name, imageUrl: user.imageUrl }} />
        <main className="flex-1 overflow-auto min-h-0 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
