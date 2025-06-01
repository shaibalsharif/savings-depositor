import { NextResponse } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

// Mock DB or replace with real DB logic
let notificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
}

function checkAdminOrManager(user: any) {
  return user?.role === "admin" || user?.role === "manager"
}

export async function GET() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  

  if (!checkAdminOrManager(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  return NextResponse.json(notificationSettings)
}

export async function POST(request: Request) {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!checkAdminOrManager(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await request.json()
  const { emailNotifications, smsNotifications } = body

  // Validate booleans
  if (typeof emailNotifications !== "boolean" || typeof smsNotifications !== "boolean") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  // Save to DB here (mocked)
  notificationSettings = { emailNotifications, smsNotifications }

  return NextResponse.json({ success: true })
}
