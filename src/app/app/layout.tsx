import { getCurrentUser, getUser } from "@/services/clerk/lib/getCurrentUser";
import { upsertUser } from "@/features/users/db";
import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Navbar } from "./_Navbar";
import { Sidebar } from "./_Sidebar";

async function syncUserFromClerkById(userId: string) {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;

    if (!primaryEmail) return false;

    await upsertUser({
      id: clerkUser.id,
      email: primaryEmail,
      name:
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        "User",
      imageUrl: clerkUser.imageUrl || "",
      createdAt: new Date(clerkUser.createdAt),
      updatedAt: new Date(clerkUser.updatedAt),
    });

    return true;
  } catch (error) {
    console.error("Failed to sync user from Clerk:", error);
    return false;
  }
}

async function getUserWithRetry(
  userId: string,
  isNewUser: boolean,
): Promise<Awaited<ReturnType<typeof getUser>> | null> {
  const maxRetries = isNewUser ? 3 : 0;
  const retryDelay = 1000;

  for (let i = 0; i <= maxRetries; i++) {
    const user = await getUser(userId);
    if (user) return user;

    if (i < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  return null;
}

export default async function AppLayout({
  children,
  searchParams,
}: {
  children: ReactNode;
  searchParams?: Promise<{ new?: string }>;
}) {
  const { userId, redirectToSignIn } = await getCurrentUser();

  if (userId == null) return redirectToSignIn();

  const params = await searchParams;
  const isNewUser = params?.new === "true";

  let user = await getUserWithRetry(userId, isNewUser);

  if (user == null) {
    const synced = await syncUserFromClerkById(userId);
    if (synced) {
      user = await getUserWithRetry(userId, false);
    }
  }

  if (user == null) {
    console.error("User not found in DB after retries");
    return redirect("/sign-up?error=sync_failed");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <Navbar user={user} />
        <main className="flex-1 overflow-auto min-h-0 bg-background/20">
          {children}
        </main>
      </div>
    </div>
  );
}
