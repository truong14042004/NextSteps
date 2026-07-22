import { NextResponse } from "next/server"

import { requireAdminForApi } from "@/features/admin/auth"
import { deleteAdminTransaction } from "@/features/admin/transactions"

export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminForApi()
  if (!admin.ok) return admin.response

  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { message: "Thiếu ID giao dịch." },
      { status: 400 }
    )
  }

  const deleted = await deleteAdminTransaction(id)

  if (!deleted) {
    return NextResponse.json(
      { message: "Không tìm thấy giao dịch." },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true })
}
