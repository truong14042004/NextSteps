import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import ProfileClient from "./ProfileClient"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const { userId, user, redirectToSignIn } = await getCurrentUser({ allData: true })

  if (!userId) {
    redirectToSignIn()
  }

  if (user?.role === "recruiter") {
    redirect("/explore")
  }

  const fullName = user?.name ?? "User"
  const email = user?.email ?? ""
  const avatar = user?.imageUrl ?? ""

  return (
    <ProfileClient
      user={{
        name: fullName,
        email,
        imageUrl: avatar,
      }}
    />
  )
}
