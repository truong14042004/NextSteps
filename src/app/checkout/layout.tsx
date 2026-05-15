import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"

export default async function CheckoutLayout({
  children,
}: {
  children: ReactNode
}) {
  const { user } = await getCurrentUser({ allData: true })

  if (user?.role === "recruiter") {
    redirect("/explore")
  }

  return children
}
