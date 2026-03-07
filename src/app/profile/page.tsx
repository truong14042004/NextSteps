import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import ProfileClient from "./ProfileClient"

export default async function ProfilePage() {
  const { userId, user, redirectToSignIn } = await getCurrentUser({ allData: true })

  if (!userId) {
    redirectToSignIn()
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