import { NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import { UserTable } from "@/drizzle/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  try {
    const users = await db.query.UserTable.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: [desc(UserTable.updatedAt)],
      limit: 10,
    })

    return NextResponse.json({ users })
  } catch (err) {
    console.error("Error fetching recent users", err)
    return NextResponse.json({ users: [] }, { status: 500 })
  }
}
