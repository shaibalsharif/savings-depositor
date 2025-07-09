// app/api/notifications/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, eq, isNull, lte, gte, or, like, desc } from "drizzle-orm";
import { notifications } from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const recipientUserId = url.searchParams.get("recipientUserId");
    const isReadParam = url.searchParams.get("isRead") || "all";
    const limit = Number(url.searchParams.get("limit")) || 20;
    const cursor = url.searchParams.get("cursor");

    if (!recipientUserId) {
      return NextResponse.json(
        { error: "recipientUserId is required" },
        { status: 400 }
      );
    }

    const filters = [eq(notifications.recipientUserId, recipientUserId)];

    if (isReadParam === "true") filters.push(eq(notifications.isRead, true));
    else if (isReadParam === "false")
      filters.push(eq(notifications.isRead, false));

    if (cursor) {
      // Cursor is the createdAt timestamp of last item from previous page
      filters.push(lte(notifications.createdAt, new Date(cursor)));
    }

    const results = await db
      .select()
      .from(notifications)
      .where(and(...filters))
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1);

    let nextCursor = null;
    if (results.length > limit) {
      nextCursor = results[limit].createdAt.toISOString();
      results.pop();
    }

    return NextResponse.json({ notifications: results, nextCursor });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
