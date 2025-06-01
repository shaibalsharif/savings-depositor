import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import {  desc } from "drizzle-orm"
import { depositSettings, logs } from "@/db/schema/logs"

function checkAdminOrManager(user: any) {
  return user?.role === "admin" || user?.role === "manager"
}

export async function GET() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()
if (!user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
  if (!checkAdminOrManager(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const settings = await db.select().from(depositSettings).orderBy(desc(depositSettings.createdAt))
  return NextResponse.json({ settings })
}

export async function POST(request: Request) {
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  if (!user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

  if (!checkAdminOrManager(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { monthlyAmount, dueDay, reminderDay, effectiveMonth } = await request.json()

  if (!monthlyAmount || !dueDay || !reminderDay || !effectiveMonth) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  // Add your business logic checks here (e.g., no overlapping effectiveMonth)

  const [newSetting] = await db.insert(depositSettings).values({
    monthlyAmount,
    dueDay,
    reminderDay,
    effectiveMonth,
    createdBy: user.id,
  }).returning()

  await db.insert(logs).values({
    userId: user.id,
    action: "create_deposit_setting",
    details: JSON.stringify({ monthlyAmount, dueDay, reminderDay, effectiveMonth }),
  })

  return NextResponse.json({ setting: newSetting })
}
