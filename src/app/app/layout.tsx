import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { redirect } from "next/navigation"
import { ReactNode } from "react"
import { Navbar } from "./_Navbar"
import { Sidebar } from "./_Sidebar"

export default async function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  const { userId, user, redirectToSignIn } = await getCurrentUser({
    allData: true,
  })

  if (userId == null) return redirectToSignIn()
  if (user == null) return redirect("/sign-up")

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
