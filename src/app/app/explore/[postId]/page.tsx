import { redirect } from "next/navigation"

export default async function AppExplorePostRedirectPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  redirect(`/explore/${postId}`)
}
