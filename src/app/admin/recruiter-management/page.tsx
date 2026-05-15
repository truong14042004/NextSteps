import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  approveRecruiterRequestAction,
  rejectRecruiterRequestAction,
} from "@/features/admin/explore"
import { getRecruiterRequestsForAdmin } from "@/features/explore/db"
import { getRecruiterRequestStatusLabel, getRoleLabel } from "@/features/explore/exploreRules.mjs"

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
  const requests = await getRecruiterRequestsForAdmin(
    status === "all" ? undefined : status
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý nhà tuyển dụng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Duyệt yêu cầu trở thành nhà tuyển dụng và chuyển role sang recruiter.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map(item => (
            <Button key={item} asChild variant={status === item ? "default" : "outline"} size="sm">
              <Link href={`/admin/recruiter-management?status=${item}`}>
                {item === "all" ? "Tất cả" : getRecruiterRequestStatusLabel(item)}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card className="rounded-lg">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Chưa có yêu cầu phù hợp.
            </CardContent>
          </Card>
        ) : (
          requests.map(request => (
            <Card key={request.id} className="rounded-lg">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="text-lg">{request.companyName}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {request.user?.name ?? "Người dùng"} · {request.user?.email} · {getRoleLabel(request.user?.role ?? "user")}
                    </p>
                  </div>
                  <Badge className="w-fit rounded-full">
                    {getRecruiterRequestStatusLabel(request.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <div className="text-muted-foreground">Chức vụ</div>
                    <div className="font-medium">{request.position}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Website</div>
                    <div className="font-medium">{request.companyWebsite ?? "Chưa có"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email công việc</div>
                    <div className="font-medium">{request.businessEmail ?? "Chưa có"}</div>
                  </div>
                </div>

                <p className="whitespace-pre-line rounded-lg bg-muted/40 p-3 text-sm leading-6">
                  {request.reason}
                </p>

                {request.adminNote && (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {request.adminNote}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/user-management?focus=${request.userId}`}>
                      Xem user profile
                    </Link>
                  </Button>
                  {request.status === "pending" && (
                    <>
                      <form
                        action={async () => {
                          "use server"
                          await approveRecruiterRequestAction(request.id)
                        }}
                      >
                        <Button type="submit" size="sm">
                          <CheckCircle2 className="mr-2 size-4" />
                          Duyệt
                        </Button>
                      </form>
                      <form
                        action={async formData => {
                          "use server"
                          await rejectRecruiterRequestAction(
                            request.id,
                            String(formData.get("note") ?? "")
                          )
                        }}
                        className="flex gap-2"
                      >
                        <Input name="note" placeholder="Lý do từ chối" className="h-9 w-56" />
                        <Button type="submit" size="sm" variant="destructive">
                          <XCircle className="mr-2 size-4" />
                          Từ chối
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
