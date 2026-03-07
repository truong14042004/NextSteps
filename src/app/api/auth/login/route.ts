import { loginWithPassword } from "@/services/auth/lib/login"
import { NextResponse } from "next/server"
import z from "zod"

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dữ liệu đăng nhập không hợp lệ." },
      { status: 400 }
    )
  }

  try {
    const result = await loginWithPassword(parsed.data)
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { message: "Đăng nhập thất bại. Vui lòng thử lại." },
      { status: 500 }
    )
  }
}
