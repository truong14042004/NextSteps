import { getRecruiterRequestsForAdmin } from "@/features/explore/db"
import RecruiterManagementClient from "./RecruiterManagementClient"

const statuses = ["all", "pending", "approved", "rejected"] as const

function getStatus(searchStatus?: string) {
  return statuses.includes(searchStatus as (typeof statuses)[number])
    ? (searchStatus as (typeof statuses)[number])
    : "pending"
}

export default async function AdminRecruiterManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: searchStatus } = await searchParams
  const status = getStatus(searchStatus)
  
  // Fetch filtered requests for the table list
  const requests = await getRecruiterRequestsForAdmin(
    status === "all" ? undefined : status
  )

  // Fetch all requests to compute summary card metrics
  const allRequests = await getRecruiterRequestsForAdmin(undefined)

  const stats = {
    total: allRequests.length,
    pending: allRequests.filter((r) => r.status === "pending").length,
    approved: allRequests.filter((r) => r.status === "approved").length,
    rejected: allRequests.filter((r) => r.status === "rejected").length,
  }

  // Typecast or pass directly to Client Component
  const mappedRequests = requests.map((r) => ({
    ...r,
    status: r.status as "pending" | "approved" | "rejected" | "cancelled",
  }))

  return (
    <RecruiterManagementClient
      requests={mappedRequests}
      stats={stats}
      currentStatus={status}
    />
  )
}
