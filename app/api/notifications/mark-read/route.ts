// app/api/notifications/mark-read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inArray } from "drizzle-orm";
import { notifications } from "@/db/schema/logs";

export async function POST(req: NextRequest) {
  try {
    const { notificationIds } = await req.json();

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: "notificationIds must be a non-empty array" },
        { status: 400 }
      );
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(inArray(notifications.id, notificationIds));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
