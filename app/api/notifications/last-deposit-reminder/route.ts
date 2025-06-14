import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { notifications } from "@/db/schema/logs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    if (!month) {
      return NextResponse.json({ error: "Missing month parameter" }, { status: 400 });
    }

    // Calculate start and end dates for the month
    const startDate = new Date(`${month}-01T00:00:00Z`);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Query notifications of type deposit_reminder created in that month
    const [lastReminder] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.type, "deposit_reminder"),
          gte(notifications.createdAt, startDate),
          lt(notifications.createdAt, nextMonth)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(1);

    return NextResponse.json({
      lastReminderSent: lastReminder?.createdAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("Failed to fetch last deposit reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
