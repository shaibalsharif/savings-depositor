import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db/client";
import { personalInfo } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request) {
  try {
    const { isAuthenticated, getUser } = getKindeServerSession();
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getUser();
    if (!user || !user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prefs = await req.json();

    await db.update(personalInfo)
      .set({
        notificationEmail: prefs.notificationEmail || null,
        notifyOnDeposit: prefs.notifyOnDeposit,
        notifyOnReminder: prefs.notifyOnReminder,
        notifyOnSummary: prefs.notifyOnSummary,
      })
      .where(eq(personalInfo.userId, user.id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to update notification preferences:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
